import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

function getFrom(loc: ReturnType<typeof useLocation>) {
  const st = loc.state as any;
  return st?.from && typeof st.from === "string" ? st.from : "/mypage";
}

export default function Login() {
  const { login, isAuthed } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = getFrom(loc);

  // 이미 로그인 상태로 /login 접근 시: 직전(from)으로 돌려보내기
  if (isAuthed) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const name = email.split("@")[0] || "사용자";
    login({ id: "u1", name, email }, "FAKE_TOKEN");
    nav(from, { replace: true }); // ← 로그인 후에도 직전 경로로 복귀
  };

  return (
    <main className="auth-page login">
      <section className="auth-card">
        <h1 className="auth-title">로그인</h1>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="form-row">
            <span className="form-label">이메일</span>
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>

          <label className="form-row">
            <span className="form-label">비밀번호</span>
            <input name="password" type="password" placeholder="••••••••" required />
          </label>

          <button type="submit" className="btn primary">로그인</button>
        </form>

        <p className="auth-helper">
          계정이 없으신가요? <Link to="/signup" state={{ from }}>회원가입</Link>
        </p>
      </section>
    </main>
  );
}
