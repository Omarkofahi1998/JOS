import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import MockExams from "./pages/MockExams";
import Questions from "./pages/Questions";
import Reviews from "./pages/Reviews";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mock-exams" element={<MockExams />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/reviews" element={<Reviews />} />
        </Routes>
      </Layout>
    </Router>
  );
}
