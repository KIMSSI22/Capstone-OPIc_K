import { useNavigate } from "react-router-dom";
import "./MainSection.css";

export default function MainSection() {
  const nav = useNavigate();
  const goStart = () => nav("/signup");
  const goDemo  = () => nav("/learn");

  return (
    <main className="opic-main" role="main">
      {/* ========= 상단~하단(footer 직전)까지 하나의 배경으로 감싸는 래퍼 ========= */}
      <div className="opic-bg-fill">
        {/* ===== HERO ===== */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-left">
            <h1 id="hero-title">
              AI가 도와주는
              <br />
              <span>OPIc 학습의 시작</span>
            </h1>
            <p className="hero-sub">
              설문 기반 문제 제공부터 문법·발음 피드백까지,
              <br />
              AI로 완성하는 OPIc 대비!
            </p>

            <div className="hero-ctas">
              <button className="btn ghost" onClick={goStart}>시작하기</button>
              <button className="btn outline" onClick={goDemo}>둘러보기</button>
            </div>

            <ul className="trust-bullets" aria-label="핵심 장점">
              <li>맞춤형 문제 자동 생성</li>
              <li>실시간 문법/발음 피드백</li>
              <li>학습 히스토리 저장/리뷰</li>
            </ul>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section className="features" aria-label="주요 기능">
          <article className="feature-card">
            <h3>실전 문제은행</h3>
            <p>개인 설문 분석으로 주제·난이도·최신 경향을 반영해 문제를 자동 생성합니다.</p>
          </article>
          <article className="feature-card">
            <h3>AI 분석 리포트</h3>
            <p>AI가 답변을 실시간으로 분석하고 문법/어휘 교정을 제공합니다.</p>
          </article>
          <article className="feature-card">
            <h3>학습 기록</h3>
            <p>세션별 저장·재생·재도전 가이드를 통해 스스로 피드백하며 성장할 수 있습니다.</p>
          </article>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="how" aria-label="사용 흐름">
          <h2>3 단계로 시작해요</h2>
          <ol className="steps">
            <li className="step">
              <span className="badge">1</span>
              <h4>설문 입력</h4>
              <p>레벨/직무/관심사를 간단히 선택하면 학습 플랜을 구성해요.</p>
            </li>
            <li className="step">
              <span className="badge">2</span>
              <h4>문제 풀이 & 피드백</h4>
              <p>음성/텍스트로 답변하면 즉시 문법과 발음을 교정해 드려요.</p>
            </li>
            <li className="step">
              <span className="badge">3</span>
              <h4>복습 & 누적 리포트</h4>
              <p>틀린 유형을 모아서 리마인드하고 성취도를 시각화합니다.</p>
            </li>
          </ol>
        </section>

        {/* ===== CTA ===== */}
        <section className="cta-band" aria-label="지금 시작하기">
          <div className="cta-text">
            <h3>지금 바로 OPic_K로 학습을 시작하세요</h3>
            <p>가입은 무료, 설정은 1분이면 충분해요.</p>
          </div>
          <div className="cta-actions">
            <button className="btn white" onClick={goStart}>무료로 시작</button>
            <button className="btn outline" onClick={goDemo}>둘러보기</button>
          </div>
        </section>
      </div>

      {/* ===== 배경이 끝나는 지점 (여기부터는 배경 X) ===== */}
      <footer className="page-footer" role="contentinfo">
        © 2025 OpicK. All rights reserved.
      </footer>
    </main>
  );
}
