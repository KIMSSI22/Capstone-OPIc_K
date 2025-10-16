import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./Record.css";

const SERVER =
  (import.meta.env.VITE_SERVER_URL as string | undefined)?.replace(/\/$/, "") ||
  "";

// 브라우저 TTS
function speak(text: string, lang = "en-US") {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => /Aria|Jenny|Guy|Salli|Google.*English/i.test(v.name)) ||
    voices.find((v) => v.lang === lang) ||
    voices[0];
  if (preferred) u.voice = preferred;
  u.lang = preferred?.lang ?? lang;
  u.rate = 0.95;
  u.pitch = 1.0;
  u.volume = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

type Status = "ready" | "recording" | "stopped" | "uploading" | "error";

type Analysis = {
  text: string;
  summary: string;
  level_guess: string;
  metrics: {
    wpm?: number;
    filler_rate?: number;
    grammar_issues?: number;
    vocab_range?: number;
    spk_len_sec?: number;
    [k: string]: unknown;
  };
  tips: string[];
};

// 00:23 형태
function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Record() {
  const loc = useLocation() as { state?: { prompt?: string } };
  const initialPrompt = loc.state?.prompt ?? "";

  const [status, setStatus] = useState<Status>("ready");
  const [prompt, setPrompt] = useState(initialPrompt);

  const [audioUrl, setAudioUrl] = useState<string>("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [err, setErr] = useState<string>("");

  // 녹음 제어
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // ⏱️ 경과 시간만 표시
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const statusText = useMemo(() => {
    if (status === "recording") return "Recording";
    if (status === "uploading") return "Uploading…";
    if (status === "stopped") return "Stopped";
    if (status === "error") return "Error";
    return "Ready";
  }, [status]);

  useEffect(() => {
    // 자동 읽기 원하면 주석 해제
    // if (initialPrompt) speak(initialPrompt);
  }, []);

  function startTimer() {
    startTimeRef.current = Date.now();
    setElapsedSec(0);
    stopTimer();
    tickRef.current = window.setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now();
        setElapsedSec((now - startTimeRef.current) / 1000);
      }
    }, 200);
  }

  function stopTimer() {
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErr("브라우저에서 마이크 권한을 지원하지 않습니다.");
        setStatus("error");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        setStatus("stopped");
        stopTimer();
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setAnalysis(null);
      setErr("");
      setStatus("recording");
      startTimer();
    } catch (e: any) {
      setErr(e?.message || "녹음 시작 실패");
      setStatus("error");
      stopTimer();
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
  }

  async function onUpload() {
    try {
      if (!audioUrl) {
        setErr("업로드할 녹음이 없습니다.");
        setStatus("error");
        return;
      }
      setStatus("uploading");
      setErr("");
      setAnalysis(null);

      const blob = await (await fetch(audioUrl)).blob();
      const fd = new FormData();
      fd.append("audio", new File([blob], "rec.webm", { type: blob.type }));
      fd.append("prompt", prompt);

      const res = await fetch(`${SERVER}/upload`, { method: "POST", body: fd });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${t}`);
      }
      const json = (await res.json()) as Analysis;
      setAnalysis(json);
      setStatus("stopped");
    } catch (e: any) {
      setErr(e?.message || "업로드/분석 실패");
      setStatus("error");
    }
  }

  return (
    <main className="rec-page">
      <div className="rec-container">
        <section className="card rec-left">
          <div className="page-kicker">OPIc · Recording</div>
          <div className="status-line">
            <span className={`chip ${status}`}>{statusText}</span>
          </div>

          {/* ⏱️ 경과 타이머만 */}
          <div className="timer-only">{fmt(elapsedSec)}</div>

          <div className="field">
            <label>문항/주제</label>
            <div className="row">
              <input
                className="input"
                placeholder="예) 최근에 본 영화에 대해 이야기해보세요."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button className="btn ghost" onClick={() => prompt && speak(prompt)}>
                Listen
              </button>
            </div>
          </div>

          <div className="audio-wrap">
            <audio controls src={audioUrl || undefined} />
          </div>

          <div className="actions">
            {status !== "recording" ? (
              <button className="btn primary" onClick={startRecording}>
                녹음 시작
              </button>
            ) : (
              <button className="btn danger" onClick={stopRecording}>
                녹음 정지
              </button>
            )}
            <button
              className="btn"
              onClick={onUpload}
              disabled={!audioUrl || status === "uploading"}
            >
              업로드/분석
            </button>
          </div>

          {!!err && <div className="error-banner">{err}</div>}
        </section>

        <section className="rec-right">
          {status === "uploading" && (
            <article className="card analysis-card">
              <div className="skeleton-title" />
              <div className="skeleton para" />
              <div className="skeleton para" />
            </article>
          )}

          {!analysis && status !== "uploading" && (
            <article className="card placeholder">
              <p>
                왼쪽에서 녹음 후 <strong>업로드/분석</strong>을 누르면
                <br />
                이 영역에 전사·분석 결과가 표시됩니다.
              </p>
            </article>
          )}

          {analysis && (
            <>
              <article className="card analysis-card">
                <h3>전사 결과</h3>
                <p className="transcript">{analysis.text}</p>
              </article>

              <article className="card analysis-card">
                <div className="flex-between">
                  <h3>요약 & 레벨 추정</h3>
                  <span className="chip level">{analysis.level_guess || "-"}</span>
                </div>
                <p className="summary">{analysis.summary || "-"}</p>
              </article>

              <article className="card analysis-card">
                <h3>지표</h3>
                <div className="metrics">
                  <div className="metric">
                    <span className="m-key">WPM</span>
                    <span className="m-val">{analysis.metrics.wpm ?? "-"}</span>
                  </div>
                  <div className="metric">
                    <span className="m-key">Filler</span>
                    <span className="m-val">
                      {analysis.metrics.filler_rate ?? "-"}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="m-key">Grammar</span>
                    <span className="m-val">
                      {analysis.metrics.grammar_issues ?? "-"}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="m-key">Vocab</span>
                    <span className="m-val">
                      {analysis.metrics.vocab_range ?? "-"}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="m-key">Len(s)</span>
                    <span className="m-val">
                      {analysis.metrics.spk_len_sec ?? "-"}
                    </span>
                  </div>
                </div>
              </article>

              {analysis.tips?.length > 0 && (
                <article className="card analysis-card">
                  <h3>개선 팁</h3>
                  <ul className="tips">
                    {analysis.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </article>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
