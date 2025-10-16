# server/opic_problems_router.py
from __future__ import annotations

import json
import random
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel, Field

# ---------------------------------------------------------
# 파일 로드 (JSON은 이 파일 기준 ../opic_test_data/ 에 둔다)
#   - basic_questions.json
#   - unexpected_questions.json
#   - roleplay_questions.json
#   - advanced_questions.json
# ---------------------------------------------------------
HERE = Path(__file__).parent
DATA_DIR = HERE / "opic_test_data"   # <- JSON들 넣어둘 폴더

def _load_bank(filename: str) -> Dict[str, Dict[str, List[str]]]:
    path = DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Questions JSON not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

BASIC_BANK       = _load_bank("basic_questions.json")        # 서베이
UNEXPECTED_BANK  = _load_bank("unexpected_questions.json")   # 돌발
ROLEPLAY_BANK    = _load_bank("roleplay_questions.json")     # 롤플레잉 11/12/13
ADVANCED_BANK    = _load_bank("advanced_questions.json")     # 어드밴스 14/15

# ---------------------------------------------------------
# 문제 생성 로직 (원본 함수 그대로 가져오되 FastAPI app 제거)
# ---------------------------------------------------------
RULE_CAPS = {"routine": 1, "comparison": 1, "experience": 2}  # description은 고정 1

def pick_random_topic(bank: Dict[str, Dict[str, List[str]]]) -> str:
    topics = list(bank.keys())
    if not topics:
        raise ValueError("QUESTION_BANK is empty.")
    return random.choice(topics)

def generate_set_from_bank(
    bank: Dict[str, Dict[str, List[str]]],
    topic: Optional[str],
    n: int
) -> Tuple[str, List[Dict[str, Any]]]:
    """하나의 주제에서 n문항 생성 (description=1, 나머지 caps 준수)"""
    if topic is None:
        topic = pick_random_topic(bank)

    data = bank.get(topic)
    if not data:
        raise KeyError(f"Topic not found: {topic}")

    descriptions = list(data.get("description", []))
    routines = list(data.get("routine", []))
    experiences = list(data.get("experience", []))
    comparisons = list(data.get("comparison", []))
    if not descriptions:
        raise ValueError(f"No 'description' questions for topic: {topic}")

    questions: List[Dict[str, Any]] = []
    # 1) description
    q1 = random.choice(descriptions)
    questions.append({"number": 1, "type": "description", "text": q1})

    # 2) 나머지
    used = {"routine": 0, "comparison": 0, "experience": 0}
    pools = {"routine": routines, "comparison": comparisons, "experience": experiences}

    for idx in range(2, n + 1):
        candidates = [t for t, limit in RULE_CAPS.items() if used[t] < limit and pools.get(t)]
        if not candidates:
            break
        t = random.choice(candidates)
        qtext = random.choice(pools[t])
        pools[t].remove(qtext)
        used[t] += 1
        questions.append({"number": idx, "type": t, "text": qtext})

    return topic, questions

def generate_unexpected(n: int = 3) -> Dict[str, Any]:
    topic, qs = generate_set_from_bank(UNEXPECTED_BANK, None, n)
    return {
        "mode": "unexpected",
        "count": len(qs),
        "sets": [{"topic": topic, "questions": qs}],
    }

def generate_survey() -> Dict[str, Any]:
    """서베이: 서로 다른 주제 2개 × 각 3문항 = 6문항"""
    topics = list(BASIC_BANK.keys())
    if len(topics) < 2:
        raise ValueError("basic_questions.json must contain at least 2 topics.")
    chosen = random.sample(topics, 2)

    sets = []
    total = 0
    for t in chosen:
        topic, qs = generate_set_from_bank(BASIC_BANK, t, 3)
        sets.append({"topic": topic, "questions": qs})
        total += len(qs)

    return {"mode": "survey", "count": total, "sets": sets}

def generate_roleplay() -> Dict[str, Any]:
    """롤플레잉: 한 주제에서 11/12/13 각 1문항"""
    topic = pick_random_topic(ROLEPLAY_BANK)
    block = ROLEPLAY_BANK.get(topic, {})
    questions = []

    for i, key in enumerate(["11", "12", "13"], start=1):
        lst = list(block.get(key, []))
        if not lst:
            continue
        q = random.choice(lst)
        questions.append({"number": i, "type": key, "text": q})

    if not questions:
        raise ValueError(f"No questions found for topic: {topic}")

    return {"mode": "roleplay", "count": len(questions), "sets": [{"topic": topic, "questions": questions}]}

def generate_full15() -> Dict[str, Any]:
    """Q1 INTRO + 서베이(2×3=6) + 돌발3 + 롤플3 + 어드밴스2 = 15문항"""
    # 1) INTRO (Q1)
    intro_set = {
        "topic": "INTRO",
        "questions": [{
            "number": 1,
            "type": "introduce",
            "text": "Let’s start the interview now. Tell me something about yourself."
        }],
    }

    # 2) SURVEY 두 블록 (Q2-4, Q5-7)
    survey_topics = random.sample(list(BASIC_BANK.keys()), 2)
    t1, qs1 = generate_set_from_bank(BASIC_BANK, survey_topics[0], 3)
    for i, q in enumerate(qs1, start=2): q["number"] = i
    survey_set_1 = {"topic": t1, "questions": qs1}

    t2, qs2 = generate_set_from_bank(BASIC_BANK, survey_topics[1], 3)
    for i, q in enumerate(qs2, start=5): q["number"] = i
    survey_set_2 = {"topic": t2, "questions": qs2}

    # 3) UNEXPECTED (Q8-10)
    utopic, uqs = generate_set_from_bank(UNEXPECTED_BANK, None, 3)
    for i, q in enumerate(uqs, start=8): q["number"] = i
    unexpected_set = {"topic": utopic, "questions": uqs}

    # 4) ROLEPLAY (Q11-13)
    rtopic = pick_random_topic(ROLEPLAY_BANK)
    rblock = ROLEPLAY_BANK[rtopic]
    rqs = []
    for key, num in (("11", 11), ("12", 12), ("13", 13)):
        lst = list(rblock.get(key, []))
        if lst: rqs.append({"number": num, "type": key, "text": random.choice(lst)})
    if not rqs:
        raise ValueError(f"No roleplay questions for topic: {rtopic}")
    roleplay_set = {"topic": rtopic, "questions": rqs}

    # 5) ADVANCED (Q14-15)
    atopic = pick_random_topic(ADVANCED_BANK)
    ablock = ADVANCED_BANK[atopic]
    aqs = []
    for key, num in (("14", 14), ("15", 15)):
        lst = list(ablock.get(key, []))
        if lst: aqs.append({"number": num, "type": key, "text": random.choice(lst)})
    if not aqs:
        raise ValueError(f"No advanced questions for topic: {atopic}")
    advanced_set = {"topic": atopic, "questions": aqs}

    all_sets = [intro_set, survey_set_1, survey_set_2, unexpected_set, roleplay_set, advanced_set]
    total = sum(len(s["questions"]) for s in all_sets)
    return {"mode": "full15", "count": total, "sets": all_sets}

def generate_advanced() -> Dict[str, Any]:
    """어드밴스: 한 주제에서 14/15 각 1문항"""
    topic = pick_random_topic(ADVANCED_BANK)
    block = ADVANCED_BANK.get(topic, {})
    questions = []

    for i, key in enumerate(["14", "15"], start=1):
        lst = list(block.get(key, []))
        if not lst:
            continue
        q = random.choice(lst)
        questions.append({"number": i, "type": key, "text": q})

    if not questions:
        raise ValueError(f"No advanced questions for topic: {topic}")

    return {"mode": "advanced", "count": len(questions), "sets": [{"topic": topic, "questions": questions}]}

# ---------------------------------------------------------
# HTML 렌더 (프리뷰용)
# ---------------------------------------------------------
def _badge_label(mode: str, t: str) -> str:
    if t == "introduce":
        return "INTRO"
    if t in {"11", "12", "13", "14", "15"}:
        return t
    return {"description": "묘사", "routine": "루틴", "comparison": "비교", "experience": "경험"}.get(t, t)

def render_result_html(payload: Dict[str, Any]) -> str:
    if "error" in payload:
        return f"""<!doctype html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>생성 실패</title>
<style>:root{{--bg:#f9fafb;--card:#ffffff;--ring:#d0d7de;
--text:#1f2937;--muted:#6b7280;--accent:#FF993B}}
body{{margin:0;background:var(--bg);color:var(--text);
font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Apple SD Gothic Neo,Arial;}}
.wrap{{max-width:900px;margin:40px auto;padding:0 16px}}
.card{{background:var(--card);border:1px solid var(--ring);border-radius:16px;padding:24px}}
a.link{{display:inline-block;margin-top:14px;padding:10px 14px;
border:1px solid var(--ring);border-radius:10px;text-decoration:none;color:var(--text)}}
a.link:hover{{border-color:var(--accent);box-shadow:0 0 0 3px #FF993B33}}
</style></head><body><div class="wrap"><div class="card">
<h2>생성 실패</h2><p>{payload["error"]}</p>
<a class="link" href="/">홈으로</a>
</div></div></body></html>"""

    mode = payload["mode"]
    title_map = {"survey": "서베이", "unexpected": "돌발", "roleplay": "롤플레잉", "advanced": "어드밴스", "full15": "통합 15"}
    title = title_map.get(mode, "문항")

    sections = []
    for s in payload["sets"]:
        topic = s["topic"]
        items_html = "\n".join(
            f"""<li class="q">
  <div class="q-head"><span class="num">Q{q["number"]}</span>
  <span class="badge {q["type"]}">{_badge_label(mode, q["type"])}</span></div>
  <div class="q-text">{q["text"]}</div>
</li>"""
            for q in s["questions"]
        )
        sections.append(f"""
<section class="card section">
  <h2 class="topic">TOPIC · {topic}</h2>
  <ul class="qs">{items_html}</ul>
</section>""")

    sections_html = "\n".join(sections)
    return f"""<!doctype html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OPIc {title} 생성 결과</title>
<style>:root{{--bg:#f9fafb;--card:#ffffff;--ring:#d0d7de;--text:#1f2937;--muted:#6b7280;--accent:#FF993B}}
body{{margin:0;background:var(--bg);color:var(--text);
font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Apple SD Gothic Neo,Arial;}}
.wrap{{max-width:960px;margin:40px auto;padding:0 16px}}
.brand{{font-weight:900;font-size:22px;margin-bottom:12px}}
.card{{background:var(--card);border:1px solid var(--ring);border-radius:16px;padding:22px;margin-bottom:16px}}
.section{{border-left:4px solid var(--accent)}}
h1{{margin:0 0 12px;font-size:26px}}
h2.topic{{margin:0 0 10px;font-size:20px;color:var(--accent)}}
ul.qs{{list-style:none;margin:0;padding:0;display:grid;gap:12px}}
.q{{background:#fefefe;border:1px solid var(--ring);border-radius:14px;padding:14px}}
.q-head{{display:flex;align-items:center;gap:10px;margin-bottom:8px}}
.num{{font-weight:800;font-size:14px;color:var(--muted)}}
.badge{{font-size:12px;padding:4px 8px;border-radius:999px;border:1px solid var(--ring)}}
.badge.description{{background:#e8f1ff;color:#1f4ea3;border-color:#cbdaf6}}
.badge.routine{{background:#e9f7ef;color:#1f6f43;border-color:#cbead7}}
.badge.comparison{{background:#fff2db;color:#8a5a00;border-color:#ffe1b3}}
.badge.experience{{background:#f3eaff;color:#5b3da6;border-color:#e4d6ff}}
.badge.introduce{{background:#fff4e8;color:#a65510;border-color:#FFD2A8}}
.badge[class~="11"] {{background:#ffecec; color:#a61c1c; border-color:#f7b2b2;}}
.badge[class~="12"] {{background:#e8f5ff; color:#0f4c81; border-color:#b5dbf7;}}
.badge[class~="13"] {{background:#f5f0ff; color:#5b3da6; border-color:#d7c8f7;}}
.badge[class~="14"] {{background:#fff6e6; color:#a15a00; border-color:#ffd8a6;}}
.badge[class~="15"] {{background:#e9fff5; color:#0f6a47; border-color:#bff0db;}}
.q-text{{line-height:1.7;font-size:17px}}
.home{{display:inline-block;margin-top:8px;border:1px solid var(--ring);padding:8px 12px;
border-radius:10px;color:var(--text);text-decoration:none}}
.home:hover{{border-color:var(--accent);color:var(--accent);box-shadow:0 0 0 3px #FF993B33}}
</style></head>
<body><div class="wrap"><div class="brand">{title} 문제</div><main>
{sections_html}
</main></div></body></html>"""

# ---------------------------------------------------------
# 스키마 & 라우터
# ---------------------------------------------------------
class GenerateBody(BaseModel):
    mode: str = Field("unexpected", description="survey|unexpected|roleplay|advanced|full15")
    # 아래는 옵션: 일부 모드에서 수를 바꾸고 싶으면 사용
    n: Optional[int] = Field(None, description="unexpected에서 문항 수 (기본 3)")

class GenerateJSONResponse(BaseModel):
    mode: str
    count: int
    sets: List[Dict[str, Any]]

router = APIRouter(prefix="/problems", tags=["OPIc Problems"])

@router.post("/generate", response_model=GenerateJSONResponse)
def api_generate(body: GenerateBody):
    """JSON API: 문제 생성"""
    try:
        if body.mode == "survey":
            result = generate_survey()
        elif body.mode == "roleplay":
            result = generate_roleplay()
        elif body.mode == "advanced":
            result = generate_advanced()
        elif body.mode == "full15":
            result = generate_full15()
        elif body.mode == "unexpected":
            n = body.n if body.n and body.n > 0 else 3
            result = generate_unexpected(n=n)
        else:
            raise HTTPException(status_code=400, detail="Invalid mode")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview", response_class=HTMLResponse)
def api_preview(
    mode: str = Query(default="unexpected", pattern="^(survey|unexpected|roleplay|advanced|full15)$"),
    n: Optional[int] = None
):
    """브라우저로 결과를 바로 확인하고 싶을 때(HTML)"""
    try:
        if mode == "survey":
            result = generate_survey()
        elif mode == "roleplay":
            result = generate_roleplay()
        elif mode == "advanced":
            result = generate_advanced()
        elif mode == "full15":
            result = generate_full15()
        else:
            result = generate_unexpected(n=n if n else 3)
    except Exception as e:
        result = {"error": str(e)}
    return HTMLResponse(render_result_html(result))

@router.get("/topics")
def api_topics(mode: str = Query(default="unexpected", pattern="^(survey|unexpected|roleplay)$")):
    """모드별 토픽 리스트"""
    bank = {"survey": BASIC_BANK, "unexpected": UNEXPECTED_BANK, "roleplay": ROLEPLAY_BANK}[mode]
    return {"mode": mode, "topics": list(bank.keys())}
