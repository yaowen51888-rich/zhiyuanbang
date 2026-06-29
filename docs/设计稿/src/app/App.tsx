import { MemoryRouter, Routes, Route } from "react-router";
import { HomePage } from "./pages/HomePage";
import { RecommendPage } from "./pages/RecommendPage";
import { UniversityDetailPage } from "./pages/UniversityDetailPage";
import { MajorCategoryPage } from "./pages/MajorCategoryPage";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";

export default function App() {
  return (
    <MemoryRouter>
      <div className="min-h-screen bg-[#F7FBF9] text-[#1F2A2E]">
        <SiteHeader />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recommend" element={<RecommendPage />} />
            <Route path="/university/:id" element={<UniversityDetailPage />} />
            <Route path="/majors/:category" element={<MajorCategoryPage />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </MemoryRouter>
  );
}
