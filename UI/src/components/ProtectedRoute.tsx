import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/** 로그인 필요한 구간을 감싸는 라우트 가드 */
export default function ProtectedRoute() {
  const { isAuthed } = useAuth();
  const loc = useLocation();

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <Outlet />;
}
