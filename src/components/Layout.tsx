import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, BookOpen, HelpCircle, FileText, ExternalLink, Sparkles, ChevronDown } from "lucide-react";
import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

function Logo() {
  return (
    <div className="flex items-center gap-2 group">
      <div className="relative w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-xl shadow-red-600/30 group-hover:rotate-12 transition-all duration-500 overflow-hidden">
        {/* Flag Stripes Decoration */}
        <div className="absolute inset-0 flex flex-col">
          <div className="h-1/3 bg-black/10" />
          <div className="h-1/3 bg-white/10" />
          <div className="h-1/3 bg-green-600/10" />
        </div>
        <span className="text-white font-black text-2xl tracking-tighter relative z-10">JO</span>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <Logo />
              <div className="hidden sm:block">
                <span className="text-2xl font-black text-blue-900 block leading-tight tracking-tight italic">JO Students</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">المنصة التعليمية الأولى</span>
              </div>
            </Link>

            {/* Desktop Nav Dropdown */}
            <div className="hidden md:flex items-center gap-6">
              <div className="relative">
                <button 
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-red-600 transition-all shadow-lg shadow-slate-900/10"
                >
                  <Menu className="w-5 h-5" />
                  اكتشف المنصة
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      onMouseLeave={() => setIsDropdownOpen(false)}
                      className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-50 mb-2">القائمة الرئيسية</div>
                      {navItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsDropdownOpen(false)}
                          className={`flex items-center gap-4 px-5 py-3.5 text-sm font-bold transition-all hover:bg-slate-50 ${
                            location.pathname === item.path ? "text-red-600 bg-red-50/50" : "text-slate-600"
                          }`}
                        >
                          <span className={`${location.pathname === item.path ? "text-red-600" : "text-slate-400"}`}>
                            {item.icon}
                          </span>
                          {item.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link to="/services" className="text-slate-600 font-bold hover:text-red-600 transition-colors">اتصل بنا</Link>
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
