import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Home, BookOpen, HelpCircle, FileText, ExternalLink, Sparkles, ChevronDown, Search, Mail } from "lucide-react";
import React, { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

function Logo() {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 group cursor-pointer"
    >
      <div className="relative w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-md overflow-hidden">
        <div className="absolute inset-0 jordan-flag-gradient opacity-20" />
        <span className="text-white font-bold text-base tracking-tighter relative z-10">JO</span>
      </div>
    </motion.div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/questions?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setIsOpen(false);
    }
  };

  const navItems = [
    { name: "الرئيسية", path: "/", icon: <Home className="w-4 h-4" /> },
    { name: "امتحانات تجريبية", path: "/mock-exams", icon: <BookOpen className="w-4 h-4" /> },
    { name: "بنك الأسئلة", path: "/questions", icon: <HelpCircle className="w-4 h-4" /> },
    { name: "خدماتنا المهنية", path: "/services", icon: <Sparkles className="w-4 h-4" /> },
    { name: "المراجعات", path: "/reviews", icon: <FileText className="w-4 h-4" /> },
    { name: "تواصل معنا", path: "/contact", icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 jordan-flag-gradient-soft" dir="rtl">
      {/* National Identity Bar */}
      <div className="h-1.5 w-full jordan-flag-accent sticky top-0 z-[60] shadow-sm" />
      
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-1.5 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Logo />
              <div className="hidden lg:block">
                <span className="text-lg font-bold text-slate-900 block leading-tight">JO Students</span>
              </div>
            </Link>

            {/* General Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm relative group">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
              <input 
                type="text" 
                placeholder="ابحث هنا عن أسئلة أو مواضيع..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-10 pl-4 py-2 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all relative ${
                    location.pathname === item.path ? "text-red-600" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="relative z-10">{item.name}</span>
                  {location.pathname === item.path && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute inset-0 bg-red-50 rounded-lg -z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {location.pathname !== item.path && (
                    <div className="absolute inset-0 bg-slate-100 opacity-0 hover:opacity-100 rounded-lg -z-0 transition-opacity" />
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
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
        {isOpen && (
          <div className="md:hidden border-t border-neutral-100 bg-white shadow-lg">
            <div className="px-4 py-4 space-y-4">
              <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ابحث..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-10 pl-4 py-2 text-sm focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${
                      location.pathname === item.path
                        ? "bg-red-50 text-red-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="flex-grow">
        {children}
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
                <li>
                  <Link to="/reviews" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-500 rounded-full" />
                    المراجعات والآراء
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-500 rounded-full" />
                    تواصل معنا
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
