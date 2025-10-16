import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Mic, Repeat2, MessageSquareText } from "lucide-react";
import "./Learn.css";

type Item = {
  id: "practice" | "replay" | "feedback";
  title: string;
  desc: string;
  icon: ReactNode;   // ⬅️ string(이모지) → ReactNode(아이콘 컴포넌트)
  to: string;
  cta: string;
};

export default function Learn() {
  const nav = useNavigate();

  const items: Item[] = [
    {
      id: "practice",
      title: "문제 풀기",
      desc: "녹음으로 답변하고 실전 감각을 키워요.",
      icon: <Mic size={44} strokeWidth={2.4} aria-hidden />,       // ✅ 미니멀 아이콘
      to: "/practice",
      cta: "시작하기",
    },
    {
      id: "replay",
      title: "답변 다시 듣기",
      desc: "내 답변을 들어보고 스스로 점검해요.",
      icon: <Repeat2 size={44} strokeWidth={2.4} aria-hidden />,    // ✅ 미니멀 아이콘
      to: "/replay",
      cta: "바로가기",
    },
    {
      id: "feedback",
      title: "피드백 보기",
      desc: "표현, 문법 코멘트를 한눈에 확인해요.",
      icon: <MessageSquareText size={44} strokeWidth={2.4} aria-hidden />, // ✅ 미니멀 아이콘
      to: "/feedback",
      cta: "열어보기",
    },
  ];

  const go = (to: string) => nav(to);

  return (
    <main className="learn-wrap" aria-labelledby="learn-title">
      <h1 id="learn-title">학습하기</h1>

      <section className="learn-grid" aria-label="학습 메뉴">
        {items.map((it) => (
          <article
            key={it.id}
            className="learn-card"
            role="button"
            tabIndex={0}
            onClick={() => go(it.to)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") go(it.to);
            }}
          >
            {/* ⬇️ 아이콘 배경 없이 깔끔하게 */}
            <div className="learn-icon" aria-hidden>
              {it.icon}
            </div>

            <h2 className="learn-card-title">{it.title}</h2>
            <p className="learn-card-desc">{it.desc}</p>

            <button
              className="learn-card-btn"
              onClick={(e) => {
                e.stopPropagation();
                go(it.to);
              }}
            >
              {it.cta}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
