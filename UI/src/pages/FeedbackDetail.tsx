import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./FeedbackDetail.css";

type FeedbackDetail = {
  id: string;
  questionKr?: string;
  questionEn: string;
  answerText: string;
  issues: string[];
  notes: string[];
  suggestion: string;
};

export default function FeedbackDetailPage() {
  const { id = "sample" } = useParams();
  const navigate = useNavigate();

  // 데모 데이터 (실제 서비스에서는 API 호출로 교체)
  const mock: FeedbackDetail = useMemo(
    () => ({
      id,
      questionEn:
        "Q. Tell me what you do to keep your home clean and comfortable. What kind of housework do you do around your home?",
      answerText: [
        "I usually clean my house every weekend.",
        "I vacuum the floor, wipe the tables, and wash the dishes.",
        "Sometimes I organize the closet and throw away old stuff.",
        "Doing housework helps me feel more comfortable at home.",
      ].join("\n"),
      issues: ['"Doing housework helps me feel more comfortable at home."'],
      notes: [
        `"Doing housework"은 OK.`,
        `"more comfortable"은 자연스럽지만 "relaxed and refreshed" 같이 더 구체적으로 말하면 좋음.`,
      ],
      suggestion: "Doing housework helps me feel relaxed and refreshed at home.",
    }),
    [id]
  );

  const [data, setData] = useState<FeedbackDetail | null>(null);

  useEffect(() => {
    // TODO: fetch(`/api/feedback/${id}`).then(...)
    setData(mock);
  }, [id, mock]);

  // 따옴표 제거 유틸 (replaceAll 대신 정규식 사용)
  const cleanQuotes = (t: string) => t.replace(/["“”]/g, "");

  if (!data) return null;

  return (
    <div className="fbdetail-wrapper">
      <div className="fbdetail-topline">피드백 상세</div>

      <main className="fbdetail-main">
        <section className="fbdetail-card fbdetail-question">
          <h2 className="fbdetail-qtext">
            {data.questionKr ? (
              <>
                <span className="kr">{data.questionKr}</span>
                <br />
                <span className="en">{data.questionEn}</span>
              </>
            ) : (
              <span className="en">{data.questionEn}</span>
            )}
          </h2>
        </section>

        <section className="fbdetail-card">
          <div className="fbdetail-section-title">답변 텍스트</div>
          <div className="fbdetail-bubble">
            <pre className="fbdetail-answer">{data.answerText}</pre>
          </div>
        </section>

        <section className="fbdetail-card">
          <div className="fbdetail-section-title">표현 피드백</div>

          <div className="fbdetail-bubble">
            <div className="fbdetail-subtitle">오류 문장:</div>
            <ul className="fbdetail-list">
              {data.issues.map((s, i) => (
                <li key={`issue-${i}`}>“{cleanQuotes(s)}”</li>
              ))}
            </ul>

            <div className="fbdetail-subtitle">피드백:</div>
            <ul className="fbdetail-list">
              {data.notes.map((n, i) => (
                <li key={`note-${i}`}>{n}</li>
              ))}
            </ul>

            <div className="fbdetail-subtitle">추천 표현:</div>
            <div className="fbdetail-suggestion">→ “{data.suggestion}”</div>
          </div>
        </section>

        <div className="fbdetail-actions">
          <button className="fbdetail-btn ghost" onClick={() => navigate(-1)}>
            목록으로
          </button>
          <button className="fbdetail-btn solid" onClick={() => navigate("/learn")}>
            학습하기
          </button>
        </div>
      </main>
    </div>
  );
}
