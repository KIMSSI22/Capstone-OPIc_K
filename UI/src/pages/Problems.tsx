import { useMemo, useState } from "react";
import {
  generateProblems,
  previewUrl,
  type GenerateResponse,
  type Mode,
  type GenerateParams,
} from "../api/problems";
import "./Problems.css";
import { useNavigate } from "react-router-dom";

const MODES: Mode[] = ["full15", "survey", "unexpected", "roleplay", "advanced"];

export default function Problems() {
  const [mode, setMode] = useState<Mode>("full15");
  const [topic, setTopic] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<GenerateResponse | null>(null);
  const nav = useNavigate();

    async function onGenerate() {
    setLoading(true);
    setErr("");
    setData(null);
    try {
        const payload: GenerateParams = { mode };                // ⬅ 정확한 타입
        const trimmed = topic.trim();
        if (trimmed) payload.topic = trimmed;

        const res = await generateProblems(payload);
        setData(res);
    } catch (e: any) {
        setErr(e?.message || "요청 실패");
    } finally {
        setLoading(false);
    }
    }

  // ← Problems → Record 간 프롬프트 전달 + 새로고침에도 유지
  function practiceThis(text: string) {
    localStorage.setItem("practice_prompt", text); // Record에서 fallback 복원용
    nav("/record", { state: { prompt: text } });   // 즉시 전달(새로고침 없을 때)
  }

  const previewHref = useMemo(() => previewUrl(mode), [mode]);

  return (
    <main className="problems-page" role="main">
      <section className="toolbar container">
        <div className="left">
          <h1>문제 생성</h1>
          <p className="muted">모드 선택 → 생성하기를 누르면 서버에서 문제를 만들어 반환합니다.</p>
        </div>

        <div className="controls">
          <label className="field">
            <span>모드</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              disabled={loading}
            >
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {m === "full15"
                    ? "전체 15문항"
                    : m === "survey"
                    ? "서베이(2×3)"
                    : m === "unexpected"
                    ? "돌발"
                    : m === "roleplay"
                    ? "롤플레잉(11/12/13)"
                    : "어드밴스(14/15)"}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>특정 토픽 (선택)</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: bank, travel …"
              disabled={loading}
            />
          </label>

          <button className="btn primary" onClick={onGenerate} disabled={loading}>
            {loading ? "생성 중…" : "생성하기"}
          </button>

          <a className="btn outline" href={previewHref} target="_blank" rel="noreferrer">
            서버 미리보기 열기
          </a>
        </div>
      </section>

      {!!err && (
        <div className="container">
          <div className="error">{err}</div>
        </div>
      )}

      {data && (
        <section className="container">
          <header className="result-head">
            <h2>생성 결과</h2>
            <div className="meta">
              <span className="chip">mode: {data.mode}</span>
              <span className="chip">count: {data.count}</span>
            </div>
          </header>

          <div className="sets">
            {data.sets.map((set, i) => (
              <article className="set-card" key={i}>
                <h3 className="topic">TOPIC · {set.topic}</h3>
                <ul className="qs">
                  {set.questions.map((q) => (
                    <li className="q" key={q.number}>
                      <div className="q-head">
                        <span className="num">Q{q.number}</span>
                        <span className={`badge t-${q.type.replace(/\s/g, "_")}`}>{q.type}</span>
                      </div>

                      <div className="q-text">{q.text}</div>

                      <div className="q-actions">
                        {/* 녹음/분석 페이지로 바로 이동해서 prompt로 사용 */}
                        <button
                          className="btn ghost"
                          onClick={() => practiceThis(q.text)}
                        >
                          이 문제로 연습하기
                        </button>
                        <button
                          className="btn"
                          onClick={() => navigator.clipboard.writeText(q.text)}
                        >
                          텍스트 복사
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
