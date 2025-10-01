import MainSection from "../components/MainSection";

export default function Home() {
  // 기존에 쓰던 랜딩 섹션을 그대로 가져와 렌더합니다.
  // MainSection.tsx / MainSection.css는 이미 프로젝트에 존재합니다.
  return (
    <main>
      <MainSection />
    </main>
  );
}
