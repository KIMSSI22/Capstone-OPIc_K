// src/pages/MyPage.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Mypage.css"; // ✅ 파일명이 Mypage.css 인 점에 맞춤(대소문자 주의)

type Card = {
  id: "today" | "yesterday" | "tomorrow";
  title: string;
  desc: string;
  cta: string;
  disabled?: boolean;
  onClick?: () => void;
  aria: string;
};

export default function MyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 표시용 이름: name > (email의 @ 앞부분) > "사용자"
  const displayName = useMemo(() => {
    if (!user) return "사용자";
    if (user.name && user.name.trim()) return user.name.trim();
    if (user.email && user.email.includes("@")) return user.email.split("@")[0];
    return "사용자";
  }, [user]);

  // ▼ 데모 데이터(필요 시 API 연동으로 교체)
  const streakDays = 51;
  const todayQuestion = "나의 학교 캠퍼스 소개하기";
  const yesterdayQuestion = "최근에 본 영화 소개하기";
  const tomorrowOpenText = "08시 이후 open";
  const yesterdayQid = "yesterday-q1"; // 어제 문항 id (replay 이동에 사용)

  const cards: Card[] = [
    {
      id: "today",
      title: "오늘의 문제",
      desc: todayQuestion,
      cta: "학습하기",
      disabled: false,
      onClick: () => navigate("/practice"),
      aria: "오늘의 문제 학습하기로 이동",
    },
    {
      id: "yesterday",
      title: "어제의 문제",
      desc: yesterdayQuestion,
      cta: "복습하기",
      disabled: false, // 어제 녹음 없을 경우 true 처리
      onClick: () => navigate(`/replay?qid=${yesterdayQid}`),
      aria: "어제의 문제 다시 듣기/복습으로 이동",
    },
    {
      id: "tomorrow",
      title: "내일 풀 문제",
      desc: tomorrowOpenText,
      cta: "대기중",
      disabled: true,
      aria: "내일 오픈 예정",
    },
  ];

  return (
    <main className="mypage-simple">
      {/* 히어로 영역 */}
      <section className="mypage-hero-simple" aria-label="마이페이지 안내">
        <h1>{displayName} 님의 마이페이지</h1>
        <p className="streak">{streakDays}일째</p>
      </section>

      {/* 카드 3개 그리드 */}
      <section className="mypage-grid" aria-label="문제 카드 목록">
        {cards.map((c) => (
          <article key={c.id} className="mypage-card" aria-labelledby={`${c.id}-title`}>
            <h2 id={`${c.id}-title`} className="card-title">
              {c.title}
            </h2>
            <p className="card-desc">{c.desc}</p>
            <button
              className={`card-btn ${c.disabled ? "disabled" : "primary"}`}
              onClick={c.disabled ? undefined : c.onClick}
              disabled={c.disabled}
              aria-label={c.aria}
            >
              {c.id === "tomorrow" ? "대기중" : c.cta}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
