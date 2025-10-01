import { useMemo } from "react";
import { Link } from "react-router-dom";
import "./Feedback.css";

type FeedbackItem = {
  id: string;
  question: string;
  issues: string[];   // 시제 오류, 반복 표현 등
  sample: string;     // "Whenever I do the house chores."
};

export default function Feedback() {
  // TODO: 실제 API로 교체
  const items: FeedbackItem[] = useMemo(
    () => [
      {
        id: "q1",
        question:
          "Tell me what you do to keep your home clean and comfortable. What kind of housework do you do around your home?",
        issues: ["시제오류 있음", "반복 표현 사용"],
        sample: '“Whenever I do the house chores.”',
      },
      {
        id: "q2",
        question:
          "Tell me about the furniture you had in your childhood at home. Was there anything different from the furniture that you have now?",
        issues: ["시제오류 있음", "반복 표현 사용"],
        sample: '“Whenever I do the house chores.”',
      },
      {
        id: "q3",
        question:
          "Tell me about the furniture you had in your childhood at home. Was there anything different from the furniture that you have now?",
        issues: ["시제오류 있음", "반복 표현 사용"],
        sample: '“Whenever I do the house chores.”',
      },
    ],
    []
  );

  return (
    <main className="fb-wrap">
      {/* 상단 띠 타이틀 */}
      <section className="fb-heading" aria-labelledby="fb-title">
        <h1 id="fb-title">오픽 문제 피드백</h1>
      </section>

      {/* 목록 */}
      <section className="fb-list" role="list">
        {items.map((it) => (
          <article key={it.id} className="fb-item" role="listitem">
            <div className="fb-item-main">
              <p className="fb-q">
                <b>Q.</b> {it.question}
              </p>

              <ul className="fb-issues">
                {it.issues.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              <p className="fb-sample">{it.sample}</p>
            </div>

            <div className="fb-actions">
              <Link to={`/feedback/${it.id}`} className="fb-detail">
                상세보기
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
