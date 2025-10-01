import "./About.css";

type Item = { title: string; desc: string };

const left: Item[] = [
  { title: "직업", desc: "일 경험 없음" },
  { title: "학생 여부", desc: "아니요" },
  { title: "최근 수강한 강의", desc: "수강 후 5년 이상 지났음" },
  { title: "거주지", desc: "개인 주택이나\n아파트에서 혼자서 거주" },
];

const right: Item[] = [
  { title: "여가 활동", desc: "영화 감상, 공연 관람,\n콘서트 관람, 해변에 가기" },
  { title: "취미나 관심사", desc: "음악 감상" },
  { title: "운동", desc: "헬스, 조깅, 걷기, 하이킹(트레킹),\n운동을 전혀 하지 않음" },
  { title: "휴가나 출장", desc: "국내 여행, 해외 여행" },
];

export default function About() {
  return (
    <main className="about-wrap">
      <section className="about-hero" />

      <section className="about-card">
        <h1 className="about-title">
          OPic_K는 아래 항목을 기준으로 문제를 출제합니다.
        </h1>

        <div className="about-grid">
          <ul className="about-col">
            {left.map((it) => (
              <li key={it.title} className="about-item">
                <span className="tick" aria-hidden>✓</span>
                <div className="texts">
                  <div className="it-title">{it.title}</div>
                  <div className="it-desc">{it.desc}</div>
                </div>
              </li>
            ))}
          </ul>

          <ul className="about-col">
            {right.map((it) => (
              <li key={it.title} className="about-item">
                <span className="tick" aria-hidden>✓</span>
                <div className="texts">
                  <div className="it-title">{it.title}</div>
                  <div className="it-desc">{it.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
