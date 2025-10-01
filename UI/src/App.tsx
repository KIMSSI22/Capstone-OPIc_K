import { Routes, Route } from "react-router-dom"
import Header from "./components/Header"

// ✅ 새로 추가된 컴포넌트
import MainSection from "./components/MainSection"
import Record from "./pages/Record"

// 팀원 버전에 이미 있는 페이지들 (예시는 이름 맞춰 수정)
import Signup from "./pages/Signup"
import Login from "./pages/Login"
import About from "./pages/About"
import Learn from "./pages/Learn"
import Feedback from "./pages/Feedback"
import MyPage from "./pages/MyPage"

// 팀원 인증 라우트
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <div className="app-container">
      <Header />
      <Routes>
        {/* 홈을 네 MainSection으로 */}
        <Route path="/" element={<MainSection />} />
        <Route path="/about" element={<About />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/record" element={<Record />} />

        {/* 공개 */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* 보호(팀원 버전 유지) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
