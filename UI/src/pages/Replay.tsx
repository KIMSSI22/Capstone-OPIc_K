import { useState } from "react";
import "./Replay.css";

export default function Replay() {
  const [questions] = useState<string[]>([
    "어제 본 영화를 소개하기",
    "가장 좋아하는 휴양지 소개하기",
    "최근에 한 운동 소개하기",
    "나의 취미 소개하기",
    "최근에 본 영화 소개하기",
  ]);

  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    // TODO: 실제 오디오 재생/일시정지 로직 연결
  };

  return (
    <div className="replay-wrapper">
      <main className="replay-main">
        <div className="prompt">Q. 최근에 본 영화에 대해 이야기해보세요.</div>

        <div className="play-area">
          <div className="status">{isPlaying ? "playing..." : "ready"}</div>
          <button
            className="play-button"
            onClick={togglePlay}
            aria-label={isPlaying ? "정지" : "재생"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        </div>

        <ul className="question-list">
          {questions.map((text, idx) => (
            <li key={idx}>
              <span className="icon">A</span>
              <span className="q-text">{text}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
