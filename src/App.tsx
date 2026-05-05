import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import MockExams from "./pages/MockExams";
import Questions from "./pages/Questions";
import Reviews from "./pages/Reviews";
import Services from "./pages/Services";
import ExamPage from "./pages/ExamPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Isolated Exam Route */}
        <Route path="/exam" element={<ExamPage />} />

        {/* Regular App with Layout */}
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/mock-exams" element={<MockExams />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/services" element={<Services />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}
