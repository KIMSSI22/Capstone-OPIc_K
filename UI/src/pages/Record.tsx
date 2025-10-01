import { useEffect, useMemo, useRef, useState } from "react";
import "./Record.css";

function splitSentences(text: string): string[] {
  if (!text) return [];
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .flatMap((line) =>
      line
        .match(/[^\.!\?。！？…]+[\.!\?。！？…]?/g)
        ?.map((s) => s.trim())
        .filter(Boolean) ?? []
    );
}

type Analysis = {
  text: string;
  summary: string;
  level_guess: string;
  metrics: {
    wpm?: number;
    filler_rate?: number;
    grammar_issues?: number;
    vocab_range?: string;
    spk_len_sec?: number;
    [k: string]: any;
  };
  tips: string[];
};

type RecState = "idle" | "recording" | "stopped" | "error" | "denied" | "uploading" | "done";

export default function Record() {
  const [recState, setRecState] = useState<RecState>("idle");
  const [prompt, setPrompt] = useState("Q. 최근에 본 영화에 대해 이야기해보세요.");
  const [elapsed, setElapsed] = useState(0);
  const [targetLen, setTargetLen] = useState(60);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [fontSize, setFontSize] = useState(20);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const mmss = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  const hint = useMemo(() => {
    if (recState === "recording") {
      if (targetLen && elapsed >= targetLen) return "목표 시간을 넘겼어요. 이제 멈추고 업로드해도 좋아요.";
      if (elapsed >= Math.max(20, targetLen * 0.6)) return "좋아요! 예시/경험을 한 문장 더 보태면 점수가 올라가요.";
      return "또렷한 발음과 완전한 문장을 의식해 주세요.";
    }
    return "";
  }, [recState, elapsed, targetLen]);

  async function startRecording() {
    try {
      setAnalysis(null); setBlob(null); setAudioUrl(null); setElapsed(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: "audio/webm" });
        const u = URL.createObjectURL(b);
        setBlob(b); setAudioUrl(u);
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setRecState("stopped");
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecState("recording");
      timerRef.current = window.setInterval(() => setElapsed((t) => t + 1), 1000) as unknown as number;
    } catch (err: any) {
      console.error(err);
      setRecState(err?.name === "NotAllowedError" ? "denied" : "error");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function resetAll() {
    setRecState("idle"); setAnalysis(null); setBlob(null); setAudioUrl(null); setElapsed(0);
  }

  async function uploadAndAnalyze() {
    if (!blob) return;
    setRecState("uploading");
    try {
      const fd = new FormData();
      fd.append("audio", new File([blob], "answer.webm", { type: "audio/webm" }));
      fd.append("prompt", prompt);
      fd.append("target_len_sec", String(targetLen));
      const res = await fetch("http://localhost:8000/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || String(res.status));
      }
      const json = (await res.json()) as Analysis;
      setAnalysis(json);
      setRecState("done");
    } catch (e:any) {
      console.error(e);
      setRecState("error");
      alert("업로드/분석 실패: " + e.message);
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="practice-wrapper record-wrapper">
      <main className="practice-main record-main">
        <section className="left-col">
          <header className="top">
            <div className="title">
              <div className="badge">OPIc · Recording</div>
              <h1>오픽형 녹음</h1>
            </div>
            <div className={`rec-state ${recState === "recording" ? "on" : ""}`}>
              {recState === "recording" ? "Recording..." : "Ready"}
            </div>
          </header>

          <div className="card rec-card">
            <div className="controller">
              <button
                className={`mic ${recState === "recording" ? "stop" : "start"}`}
                onClick={recState === "recording" ? stopRecording : startRecording}
              >
                {recState === "recording" ? <span className="square" /> : <span className="dot" />}
              </button>
              <div className="rec-timer">{mmss(elapsed)}</div>
            </div>

            <div className="fields">
              <label className="field">
                <span>문항/주제</span>
                <input className="input" value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="Topic or question" />
              </label>
              <label className="field w120">
                <span>목표(초)</span>
                <input className="input" type="number" min={30} max={180} step={5} value={targetLen} onChange={(e)=>setTargetLen(Number(e.target.value))} />
              </label>
            </div>

            <p className="hint">{hint}</p>

            <div className="player-row">
              {audioUrl ? <audio controls src={audioUrl} /> : <div className="audio-placeholder">녹음하면 미리듣기 표시</div>}
            </div>

            <div className="buttons">
              <button className="btn ghost" onClick={resetAll} disabled={!audioUrl}>다시 녹음</button>
              <button className="btn primary" onClick={uploadAndAnalyze} disabled={!audioUrl || recState === "uploading"} aria-disabled={!audioUrl || recState === "uploading"}>
                {recState === "uploading" ? "분석 중..." : "업로드/분석"}
              </button>
            </div>
          </div>
        </section>

        <section className="right-col">
          <div className="card result-card">
            {!analysis && recState !== "uploading" && (
              <div className="placeholder">
                <p>왼쪽에서 녹음 후 업로드하면<br/>여기에 전사·분석 결과가 표시됩니다.</p>
              </div>
            )}
            {recState === "uploading" && (
              <div className="loading">
                <div className="spinner" />
                <p>전사 및 분석 중입니다…</p>
              </div>
            )}
            {analysis && (
              <div className="result">
                <div className="head">
                  <span className="level">{analysis.level_guess || "—"}</span>
                  {analysis.metrics?.spk_len_sec !== undefined && (<span className="chip">⏱ {Math.round(analysis.metrics.spk_len_sec)}s</span>)}
                  {analysis.metrics?.wpm !== undefined && (<span className="chip">🗣 {Math.round(analysis.metrics.wpm)} wpm</span>)}
                  {analysis.metrics?.filler_rate !== undefined && (<span className="chip">🔸 filler {Math.round((analysis.metrics.filler_rate||0)*100)}%</span>)}
                </div>

                <h3>전사</h3>
                <div className="transcript" style={{ fontSize }}>
                  {splitSentences(analysis.text).map((s, i) => <p key={i}>{s}</p>)}
                </div>
                <div className="font-row">
                  <label>글자 크기: {fontSize}px</label>
                  <input type="range" min={16} max={26} value={fontSize} onChange={(e)=>setFontSize(Number(e.target.value))}/>
                </div>

                <h3>요약</h3>
                <p className="summary">{analysis.summary}</p>

                <h3>지표</h3>
                <div className="grid">
                  <div><span className="k">WPM</span><span className="v">{analysis.metrics?.wpm ?? "—"}</span></div>
                  <div><span className="k">Filler</span><span className="v">{analysis.metrics?.filler_rate !== undefined ? `${Math.round((analysis.metrics.filler_rate||0)*100)}%` : "—"}</span></div>
                  <div><span className="k">Grammar</span><span className="v">{analysis.metrics?.grammar_issues ?? "—"}</span></div>
                  <div><span className="k">Vocab</span><span className="v">{analysis.metrics?.vocab_range ?? "—"}</span></div>
                  <div><span className="k">Length</span><span className="v">{analysis.metrics?.spk_len_sec !== undefined ? `${Math.round(analysis.metrics.spk_len_sec)}s` : "—"}</span></div>
                </div>

                <h3>개선 팁</h3>
                <ul className="tips">
                  {analysis.tips?.length ? analysis.tips.map((t, i) => <li key={i}>• {t}</li>) : <li>—</li>}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
