import { useEffect, useMemo, useRef, useState } from "react";
import "./Practice.css";

type RecState = "idle" | "recording" | "paused" | "stopped" | "denied" | "error";

export default function Practice() {
  const [recState, setRecState] = useState<RecState>("idle");
  const [prompt, setPrompt] = useState("Q. 최근에 본 영화에 대해 이야기해보세요.");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const canRecord = useMemo(() => recState === "idle" || recState === "stopped", [recState]);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stopTimer();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startTimer = () => {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      chunksRef.current = [];
      setElapsed(0);
      setAudioUrl(null);

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stopTimer();
        setRecState("stopped");
      };

      mr.start();
      startTimer();
      setRecState("recording");
    } catch (err) {
      console.error(err);
      if ((err as any)?.name === "NotAllowedError") {
        setRecState("denied");
        setErrorMsg("마이크 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.");
      } else {
        setRecState("error");
        setErrorMsg("녹음을 시작할 수 없습니다. 다른 브라우저나 장치를 시도해 보세요.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const resetAll = () => {
    setRecState("idle");
    setAudioUrl(null);
    setElapsed(0);
    setErrorMsg(null);
    chunksRef.current = [];
  };

  const mmss = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="practice-wrapper">

      <main className="practice-main">
        <div className="prompt">
          {prompt}
        </div>

        <div className="rec-area">
          {recState === "recording" && <div className="rec-status">recording...</div>}
          {recState === "denied" && <div className="rec-error">{errorMsg}</div>}
          {recState === "error" && <div className="rec-error">{errorMsg}</div>}

          <button
            className={`rec-button ${recState === "recording" ? "pulse" : ""}`}
            onClick={() => (canRecord ? requestMic() : stopRecording())}
            aria-label={recState === "recording" ? "녹음 중지" : "녹음 시작"}
          >
            <span className="inner-dot" />
          </button>

          <div className="rec-timer">{mmss(elapsed)}</div>

          {audioUrl && (
            <div className="player">
              <audio controls src={audioUrl} />
              <button className="linklike" onClick={resetAll}>다시 녹음하기</button>
            </div>
          )}
        </div>

        <div className="navs">
          <button className="nav back">
            <span className="check">✓</span> BACK
          </button>
          <button
            className="nav next"
            onClick={() => {
              // TODO: 제출/다음 문제 로직 ↘
              // 예: 업로드 API 호출 후 다음 문제로 이동
              alert("다음 문제로 이동하는 로직을 연결하세요.");
            }}
          >
            <span className="check">✓</span> NEXT
          </button>
        </div>
      </main>
    </div>
  );
}
