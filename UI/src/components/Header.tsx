import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthed, user, logout } = useAuth();

  const goLogin = () => navigate("/login", { state: { from: location.pathname } });
  const goSignup = () => navigate("/signup", { state: { from: location.pathname } });

  return (
    <header className="header" role="banner">
      <div className="header-container">
        {/* Left: Logo */}
        <button className="logo" onClick={() => navigate("/")} aria-label="홈으로">
          OPic_K
        </button>

        {/* Center: Navigation */}
        <nav className="nav-menu" aria-label="주요 메뉴">
          <ul role="list">
            <li>
              <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
                소개
              </NavLink>
            </li>
            {isAuthed && (
              <li>
                <NavLink to="/learn" className={({ isActive }) => (isActive ? "active" : "")}>
                  학습하기
                </NavLink>
              </li>
            )}
            {isAuthed && (
              <li>
                <NavLink to="/mypage" className={({ isActive }) => (isActive ? "active" : "")}>
                  마이페이지
                </NavLink>
              </li>
            )}
            {isAuthed && (
              <li>
                <NavLink to="/record" className={({ isActive }) => (isActive ? "active" : "")}>
                  녹음/분석
                </NavLink>
              </li>
            )}
            {isAuthed && (
              <li>
                <NavLink to="/problems" className={({ isActive }) => (isActive ? "active" : "")}>
                  문제 생성
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* Right: Auth */}
        <div className="auth-area">
          {!isAuthed ? (
            <>
              {/* 회원가입 = 회색 배경 / 검정 글자 */}
              <button className="btn signup" onClick={goSignup}>회원가입</button>
              {/* 로그인 = 주황 배경 / 흰 글자 */}
              <button className="btn login" onClick={goLogin}>로그인</button>
            </>
          ) : (
            <div className="profile-cluster">
              <button className="chip" onClick={() => navigate("/mypage")}>
                {user?.name ?? "hi"}
              </button>
              {/* 로그아웃은 외곽선 스타일 유지 */}
              <button className="btn outline danger" onClick={logout}>로그아웃</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
