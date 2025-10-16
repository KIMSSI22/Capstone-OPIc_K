# server/main.py
import os
import uuid
import json
import aiofiles
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

# ← 문제 생성 라우터 (이미 만드신 파일)
from opic_problems_router import router as problems_router


from fastapi import Query
from fastapi.responses import StreamingResponse



# ─────────────────────────────────────────────────────────
# Env & Client
# .env 예시:
# OPENAI_API_KEY=sk-...
# TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
# ANALYZE_MODEL=gpt-4.1-mini
# ALLOWED_ORIGIN=http://localhost:5173
# ─────────────────────────────────────────────────────────
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
TRANSCRIBE_MODEL = os.getenv("TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe")
ANALYZE_MODEL = os.getenv("ANALYZE_MODEL", "gpt-4.1-mini")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set in environment (.env).")

client = OpenAI(api_key=OPENAI_API_KEY)

# ─────────────────────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────────────────────
app = FastAPI()

# CORS — 프론트 로컬 환경 2개도 함께 허용(원하면 제거 가능)
allow_origins = {ALLOWED_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"}
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allow_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 문제 생성 라우터 연결 (여기가 핵심)
app.include_router(problems_router)


# ─────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────
class AnalysisResult(BaseModel):
    text: str
    summary: str
    level_guess: str
    metrics: dict
    tips: list[str]


# ─────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────
def extract_output_text(resp) -> str:
    """
    OpenAI Responses API 응답에서 텍스트를 최대한 안전하게 뽑아냅니다.
    SDK 버전에 따라 구조가 달라질 수 있어 여러 경로를 시도합니다.
    """
    # 1) 최신 SDK 속성
    out = getattr(resp, "output_text", None)
    if isinstance(out, str) and out.strip():
        return out

    # 2) 객체 속성 탐색 (output -> content -> output_text)
    try:
        output = getattr(resp, "output", None)
        if output and isinstance(output, list):
            for item in output:
                content = item.get("content") if isinstance(item, dict) else getattr(item, "content", None)
                if content and isinstance(content, list):
                    for c in content:
                        # 통상 {"type": "output_text", "text": "..."}
                        if (isinstance(c, dict) and c.get("type") in ("output_text", "text") and c.get("text")):
                            return c["text"]
                        # 혹시 객체 속성 형태일 때
                        if hasattr(c, "type") and getattr(c, "type") in ("output_text", "text"):
                            t = getattr(c, "text", None)
                            if t:
                                return t
    except Exception:
        pass

    # 3) 마지막 수단: 문자열화
    return str(resp)


# ─────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"ok": True}

@app.post("/upload", response_model=AnalysisResult)
async def upload_audio(
    audio: UploadFile = File(...),
    prompt: Optional[str] = Form(None),        # (선택) 문제 텍스트
    target_len_sec: Optional[int] = Form(60),  # (선택) 목표 길이(초)
):
    # 1) 파일 저장
    os.makedirs("uploads", exist_ok=True)
    uid = str(uuid.uuid4())[:8]
    ext = os.path.splitext(audio.filename or "rec.webm")[1] or ".webm"
    save_path = f"uploads/{uid}{ext}"

    try:
        async with aiofiles.open(save_path, "wb") as f:
            content = await audio.read()
            await f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # 2) 전사 (Speech-to-Text)
    try:
        with open(save_path, "rb") as f:
            tr = client.audio.transcriptions.create(
                model=TRANSCRIBE_MODEL,
                file=f,
                response_format="json",  # 'json' 또는 'text' 지원
                # language="ko",
            )
        # SDK에 따라 dict로 올 수 있어 안전 추출
        text = getattr(tr, "text", None) or (tr.get("text") if isinstance(tr, dict) else "")
        if not text:
            raise RuntimeError(f"Empty transcription. Raw: {tr}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Transcription failed: {e}")

    # 3) 분석 (Responses API) — JSON만 반환하도록 강력 지시
    system_prompt = (
        "You are an OPIC-style evaluator for Korean EFL speakers. "
        "Given a transcript, return ONLY JSON (no code fences). "
        "Keys: summary, level_guess, metrics{wpm,filler_rate,grammar_issues,vocab_range,spk_len_sec}, tips[]."
    )
    user_prompt = (
        f"Topic/Prompt (optional): {prompt or 'N/A'}\n"
        f"Target speaking length (sec): {target_len_sec}\n"
        f"Transcript:\n{text}\n"
        "Return ONLY JSON. No other text."
    )

    try:
        resp = client.responses.create(
            model=ANALYZE_MODEL,
            input=[
                {"role": "system", "content": [{"type": "input_text", "text": system_prompt}]},
                {"role": "user",   "content": [{"type": "input_text", "text": user_prompt}]},
            ],
        )
        out_text = extract_output_text(resp)
        data = json.loads(out_text)
    except json.JSONDecodeError as e:
        # 모델이 JSON을 벗어났을 때 디버깅 도우미
        print("ANALYZE PARSE ERROR RAW:", out_text)
        raise HTTPException(status_code=400, detail=f"Analyze failed: cannot parse JSON ({e})")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Analyze failed: {e}")

    return AnalysisResult(
        text=text,
        summary=data.get("summary", ""),
        level_guess=data.get("level_guess", ""),
        metrics=data.get("metrics", {}),
        tips=data.get("tips", []),
    )




@app.get("/tts")
def tts(
    text: str = Query(..., min_length=1, description="읽을 텍스트"),
    voice: str = Query("alloy"),
    audio_format: str = Query("mp3"),
):
    """
    고음질 TTS. mp3 스트리밍으로 반환.
    Vercel/로컬 모두 잘 동작. 브라우저 <audio src="/tts?text=..."> 로 재생.
    """
    try:
        # SDK v1 기준 (openai 1.x)
        # 스트리밍이 가능한 버전
        with client.audio.speech.with_streaming_response.create(
            model="gpt-4o-mini-tts",
            voice=voice,
            input=text,
            format=audio_format,
        ) as resp:
            return StreamingResponse(resp.iter_bytes(), media_type="audio/mpeg")
    except Exception as e:
        # 모델/키 문제 시 클라이언트가 WebSpeech fallback 하도록 400
        raise HTTPException(status_code=400, detail=f"TTS failed: {e}")