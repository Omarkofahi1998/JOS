import { useEffect, lazy, Suspense } from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { supabase } from "./lib/supabase";

// Lazy load non-critical pages
const MockExams = lazy(() => import("./pages/MockExams"));
const Questions = lazy(() => import("./pages/Questions"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Services = lazy(() => import("./pages/Services"));
const ExamPage = lazy(() => import("./pages/ExamPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Contact = lazy(() => import("./pages/Contact"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function VisitorTracker() {
// ... existing code ...
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
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Isolated Exam Route */}
          <Route path="/exam" element={<ExamPage />} />

          {/* Regular App with Layout */}
          <Route path="*" element={
            <Layout>
              <Suspense fallback={<div className="h-20" />}>
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
              </Suspense>
            </Layout>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
}
