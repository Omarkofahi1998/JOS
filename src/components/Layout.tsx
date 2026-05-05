import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, BookOpen, HelpCircle, FileText, ExternalLink, Sparkles } from "lucide-react";
import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

function Logo() {
  return (
    <div className="flex items-center gap-2 group">
      <div className="relative w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-110 transition-all duration-300">
        <span className="text-white font-black text-xl tracking-tighter">JO</span>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-md shadow-sm flex items-center justify-center border border-slate-100">
           <Sparkles className="w-3 h-3 text-red-600" />
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "الرئيسية", path: "/", icon: <Home className="w-5 h-5" /> },
    { name: "امتحانات تجريبية", path: "/mock-exams", icon: <BookOpen className="w-5 h-5" /> },
    { name: "اسئلة شاملة", path: "/questions", icon: <HelpCircle className="w-5 h-5" /> },
    { name: "مراجعات شاملة", path: "/reviews", icon: <FileText className="w-5 h-5" /> },
    { name: "خدماتنا", path: "/services", icon: <Sparkles className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 animated-jordan-bg" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <Logo />
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-blue-900 block leading-tight">JO Students</span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">المنصة التعليمية للمتقدمين</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-sm font-semibold transition-all duration-200 flex items-center gap-2 relative ${
                    location.pathname === item.path
                      ? "text-blue-900 after:content-[''] after:absolute after:bottom-[-26px] after:left-0 after:right-0 after:h-1 after:bg-blue-900"
                      : "text-slate-600 hover:text-blue-900"
                  }`}
                >
                  {location.pathname === item.path && <motion.div layoutId="nav-pill" className="absolute inset-0 bg-blue-50/50 rounded-lg -z-10" />}
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-neutral-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                      location.pathname === item.path
                        ? "bg-blue-50 text-blue-900"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-slate-800 pb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                   <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-bold text-white">JO Students</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                منصة JO Students متكاملة تهدف إلى دعم المتقدمين للامتحانات التنافسية في الأردن من خلال توفير مصادر تعليمية وامتحانات تجريبية محدثة.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">روابط سريعة</h3>
              <ul className="space-y-4">
                <li>
                  <Link to="/" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-500 rounded-full" />
                    الرئيسية
                  </Link>
                </li>
                <li>
                  <Link to="/mock-exams" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-500 rounded-full" />
                    امتحانات تجريبية
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">روابط الهيئة</h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="https://applyjobs.spac.gov.jo/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm"
                  >
                    نظام الاستقطاب في القطاع العام
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://enq-sys.spac.gov.jo/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm"
                  >
                    الاستعلام عن الدور التنافسي
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-slate-500 text-xs">
            © {new Date().getFullYear()} JO Students. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
