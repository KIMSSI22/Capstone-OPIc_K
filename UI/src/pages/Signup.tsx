import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Signup.css"; // ✅ Auth.css 아님!

export default function Signup() {
  const { login } = useAuth();
  const nav = useNavigate();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "사용자");
    const email = String(fd.get("email") || "");
    // TODO: 회원가입 API → 성공 시 로그인 처리
    login({ id: "u2", name, email }, "FAKE_TOKEN");
    nav("/mypage", { replace: true });
  };

  return (
    <main className="auth-page signup">
      <section className="auth-card">
        <h1 className="auth-title">회원가입</h1>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="form-row">
            <span className="form-label">이름</span>
            <input name="name" placeholder="홍길동" required />
          </label>

          <label className="form-row">
            <span className="form-label">이메일</span>
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>

          <label className="form-row">
            <span className="form-label">비밀번호</span>
            <input name="password" type="password" placeholder="최소 8자" required />
          </label>

          <button type="submit" className="btn primary">가입하기</button>
        </form>

        <p className="auth-helper">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </section>
    </main>
  );
}
