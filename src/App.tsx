import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { supabase } from "./lib/supabase";
import { AlertTriangle, Home as HomeIcon, BookOpen, HelpCircle } from "lucide-react";

function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center" dir="rtl">
      <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto border border-red-100">
          <AlertTriangle className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">404</h1>
          <h2 className="text-lg font-black text-slate-800">الصفحة غير موجودة</h2>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            عذراً، الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله. يمكنك العودة للصفحة الرئيسية أو تصفح بنك الأسئلة والامتحانات.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <HomeIcon className="w-4 h-4 text-red-400" />
            الرئيسية
          </Link>
          <Link
            to="/mock-exams"
            className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            الامتحانات
          </Link>
          <Link
            to="/questions"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            الأسئلة
          </Link>
        </div>
      </div>
    </div>
  );
}

// Lazy load non-critical pages
import InstructorRegistration from "./pages/InstructorRegistration";
const ServiceProviderRegistration = lazy(() => import("./pages/ServiceProviderRegistration"));
const CompanyRegistration = lazy(() => import("./pages/CompanyRegistration"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const InstructorDashboard = lazy(() => import("./pages/InstructorDashboard"));
const InstructorLogin = lazy(() => import("./pages/InstructorLogin"));
const MockExams = lazy(() => import("./pages/MockExams"));
const Questions = lazy(() => import("./pages/Questions"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Services = lazy(() => import("./pages/Services"));
const ExamPage = lazy(() => import("./pages/ExamPage"));
const Login = lazy(() => import("./pages/Login"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const JobBoard = lazy(() => import("./pages/JobBoard"));

const ProfessionalServicesLogin = lazy(() => import("./pages/ProfessionalServicesLogin"));
const ProfessionalDashboard = lazy(() => import("./pages/ProfessionalDashboard"));
const ServiceDetails = lazy(() => import("./pages/ServiceDetails"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function VisitorTracker() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    async function trackVisitor() {
      if (!supabase) return;
      try {
        // 1. Total visitors count
        const { data: current } = await supabase.from('visitor_stats').select('count').eq('id', 1).single();
        if (current) {
          await supabase.from('visitor_stats').update({ count: (Number(current.count) || 0) + 1 }).eq('id', 1);
        } else {
          await supabase.from('visitor_stats').upsert({ id: 1, count: 1 });
        }

        // 2. Daily visitors history map (e.g. { "YYYY-MM-DD": count })
        const todayDate = new Date().toISOString().split('T')[0];
        const { data: historySetting } = await supabase.from('site_settings').select('value').eq('key', 'daily_visitors_history').single();
        
        let historyMap: Record<string, number> = {};
        if (historySetting && historySetting.value) {
          try {
            const parsed = JSON.parse(historySetting.value);
            if (typeof parsed === 'object' && parsed !== null) {
              if (Array.isArray(parsed)) {
                parsed.forEach((item: any) => {
                  if (item && item.date) historyMap[item.date] = Number(item.count) || 0;
                });
              } else {
                historyMap = parsed;
              }
            }
          } catch (e) {
            console.error("Parse daily history error", e);
          }
        }

        // Increment today's count
        historyMap[todayDate] = (historyMap[todayDate] || 0) + 1;

        // Keep last 180 days
        const dates = Object.keys(historyMap).sort().reverse().slice(0, 180);
        const cleanedMap: Record<string, number> = {};
        dates.forEach(d => { cleanedMap[d] = historyMap[d]; });

        await supabase.from('site_settings').upsert({
          key: 'daily_visitors_history',
          value: JSON.stringify(cleanedMap)
        });

        // Also update 'daily_visitors' key
        await supabase.from('site_settings').upsert({
          key: 'daily_visitors',
          value: JSON.stringify({ date: todayDate, count: cleanedMap[todayDate] })
        });
      } catch (err) {
        console.error("Visitor tracking error:", err);
      }
    }

    trackVisitor();
  }, []);

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
                  <Route path="/job-board" element={<JobBoard />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/instructor/login" element={<InstructorLogin />} />
                  <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
                  <Route path="/instructor-registration" element={<InstructorRegistration />} />
                  <Route path="/service-provider-registration" element={<ServiceProviderRegistration />} />
                  <Route path="/company-registration" element={<CompanyRegistration />} />
                  <Route path="/professional-services/login" element={<ProfessionalServicesLogin />} />
                  <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
                  <Route path="/service/:id" element={<ServiceDetails />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
}
