import "./About.css";

type Item = {
  title: string;
  desc: string;
};

type Section = {
  title: string;
  items: Item[];
};

const LEFT: Section[] = [
  {
    title: "직업",
    items: [{ title: "일 경험 없음", desc: "" }],
  },
  {
    title: "학생 여부",
    items: [{ title: "아니요", desc: "" }],
  },
  {
    title: "최근 수강한 강의",
    items: [{ title: "수강 후 5년 이상 지났음", desc: "" }],
  },
  {
    title: "거주지",
    items: [
      { title: "개인 주택이나 아파트에서 혼자서 거주", desc: "" },
    ],
  },
];

const RIGHT: Section[] = [
  {
    title: "여가 활동",
    items: [{ title: "영화 감상, 공연 관람, 콘서트 관람, 해변에 가기", desc: "" }],
  },
  {
    title: "취미나 관심사",
    items: [{ title: "음악 감상", desc: "" }],
  },
  {
    title: "운동",
    items: [
      { title: "헬스, 조깅, 걷기, 하이킹(트레킹), 운동을 전혀 하지 않음", desc: "" },
    ],
  },
  {
    title: "휴가나 출장",
    items: [{ title: "국내 여행, 해외 여행", desc: "" }],
  },
];

function CheckBadge() {
  return (
    <span className="check-badge" aria-hidden>
      ✓
    </span>
  );
}

function SectionCard({ data }: { data: Section }) {
  return (
    <article className="about-card">
      <header className="about-card__head">
        <CheckBadge />
        <h3>{data.title}</h3>
      </header>

      <ul className="about-list">
        {data.items.map((it, idx) => (
          <li key={idx} className="about-list__item">
            <div className="about-item__title">{it.title}</div>
            {it.desc && <div className="about-item__desc">{it.desc}</div>}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function About() {
  return (
    <main className="about-page" role="main">
      <section className="about-hero">
        <h1>
          OPic_K는 아래 항목을 기반으로 <strong>맞춤 문제</strong>를 생성합니다
        </h1>
        <p className="about-sub">
          설문 항목을 토대로 주제·난이도·스타일을 자동 추천하고, 연습/분석까지 한 곳에서 진행해요.
        </p>
      </section>

      <section className="about-grid">
        <div className="about-col">
          {LEFT.map((s, i) => (
            <SectionCard key={`L${i}`} data={s} />
          ))}
        </div>
        <div className="about-col">
          {RIGHT.map((s, i) => (
            <SectionCard key={`R${i}`} data={s} />
          ))}
        </div>
      </section>


    </main>
  );
}
