import { useEffect } from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import MockExams from "./pages/MockExams";
import Questions from "./pages/Questions";
import Reviews from "./pages/Reviews";
import Services from "./pages/Services";
import ExamPage from "./pages/ExamPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Contact from "./pages/Contact";
import { supabase } from "./lib/supabase";

function VisitorTracker() {
  const location = useLocation();

  useEffect(() => {
    async function trackVisitor() {
      if (!supabase) return;

      // Check for session cookie
      const sessionVisited = sessionStorage.getItem('jo_student_visited');
      
      if (!sessionVisited) {
        try {
          // Increment visitor count in DB
          const { data: current } = await supabase.from('visitor_stats').select('count').eq('id', 1).single();
          if (current) {
            await supabase.from('visitor_stats').update({ count: (current.count || 0) + 1 }).eq('id', 1);
          }
          sessionStorage.setItem('jo_student_visited', 'true');
        } catch (err) {
          console.error("Visitor tracking error:", err);
        }
      }
    }
    trackVisitor();
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <VisitorTracker />
      <Routes>
        {/* Isolated Exam Route */}
        <Route path="/exam" element={<ExamPage />} />

        {/* Regular App with Layout */}
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/mock-exams" element={<MockExams />} />
              <Route path="/mock-exams/:majorId" element={<MockExams />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/questions/:fileTitle" element={<Questions />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}
