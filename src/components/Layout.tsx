import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Home, BookOpen, HelpCircle, FileText, ExternalLink, Sparkles, ChevronDown, Search, Mail, Phone, MapPin } from "lucide-react";
import React, { useState, ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";

function Logo() {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 group cursor-pointer"
      role="img"
      aria-label="JO Students Logo"
    >
      <div className="relative w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-md overflow-hidden ring-2 ring-slate-100">
        <div className="absolute inset-0 jordan-flag-gradient opacity-20" />
        <span className="text-white font-black text-base tracking-tighter relative z-10">JO</span>
        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-600 rounded-bl-sm" />
      </div>
    </motion.div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    address: "",
    description: ""
  });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSettings() {
      if (!supabase) return;
      const { data } = await supabase.from('site_settings').select('key, value');
      if (data) {
        const settings: any = {};
        data.forEach(item => settings[item.key] = item.value);
        setContactInfo({
          email: settings.contact_email || "",
          phone: settings.contact_phone || "",
          address: settings.contact_address || "",
          description: settings.hero_subtitle || ""
        });
      }
    }
    fetchSettings();
  }, []);

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
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-slate-800 pb-12">
            <div className="text-right">
              <div className="flex items-center gap-3 mb-6 justify-start">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
                    <FileText className="w-6 h-6 text-white" />
                 </div>
                 <span className="text-xl font-black text-white tracking-tight uppercase">JO Students</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {contactInfo.description}
              </p>
            </div>

            <div className="text-right">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 border-r-4 border-red-600 pr-4">روابط سريعة</h3>
              <ul className="space-y-4">
                <li>
                  <Link to="/" className="text-slate-400 hover:text-white transition-all text-sm flex items-center gap-3 justify-start group">
                    <div className="w-1.5 h-1.5 bg-slate-700 group-hover:bg-red-600 rounded-full transition-all" />
                    <span className="group-hover:text-red-500 transition-colors">الرئيسية</span>
                  </Link>
                </li>
                <li>
                  <Link to="/mock-exams" className="text-slate-400 hover:text-white transition-all text-sm flex items-center gap-3 justify-start group">
                    <div className="w-1.5 h-1.5 bg-slate-700 group-hover:bg-red-600 rounded-full transition-all" />
                    <span className="group-hover:text-red-500 transition-colors">امتحانات تجريبية</span>
                  </Link>
                </li>
                <li>
                  <Link to="/reviews" className="text-slate-400 hover:text-white transition-all text-sm flex items-center gap-3 justify-start group">
                    <div className="w-1.5 h-1.5 bg-slate-700 group-hover:bg-red-600 rounded-full transition-all" />
                    <span className="group-hover:text-red-500 transition-colors">المراجعات والآراء</span>
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-slate-400 hover:text-white transition-all text-sm flex items-center gap-3 justify-start group">
                    <div className="w-1.5 h-1.5 bg-slate-700 group-hover:bg-red-600 rounded-full transition-all" />
                    <span className="group-hover:text-red-500 transition-colors">تواصل معنا</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="text-right">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 border-r-4 border-slate-700 pr-4">روابط الهيئة</h3>
              <ul className="space-y-4">
                <li>
                  <a href="https://applyjobs.spac.gov.jo/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white transition-all text-sm justify-start group">
                    <ExternalLink className="w-4 h-4 text-slate-700 group-hover:text-blue-400 transition-all" />
                    <span className="group-hover:text-blue-400 transition-colors">نظام الاستقطاب في القطاع العام</span>
                  </a>
                </li>
                <li>
                  <a href="https://enq-sys.spac.gov.jo/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white transition-all text-sm justify-start group">
                    <ExternalLink className="w-4 h-4 text-slate-700 group-hover:text-blue-400 transition-all" />
                    <span className="group-hover:text-blue-400 transition-colors">الاستعلام عن الدور التنافسي</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="text-right">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 border-r-4 border-emerald-600 pr-4">قنوات التواصل</h3>
              <ul className="space-y-5">
                {contactInfo.email && (
                  <li className="flex items-center gap-4 text-sm text-slate-400 justify-start group">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <Mail className="w-5 h-5" />
                    </div>
                    <a href={`mailto:${contactInfo.email}`} className="hover:text-white transition-colors group-hover:text-slate-200">{contactInfo.email}</a>
                  </li>
                )}
                {contactInfo.phone && (
                  <li className="flex items-center gap-4 text-sm text-slate-400 justify-start group">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Phone className="w-5 h-5" />
                    </div>
                    <a href={`tel:${contactInfo.phone}`} className="hover:text-white transition-colors group-hover:text-slate-200">{contactInfo.phone}</a>
                  </li>
                )}
                {contactInfo.address && (
                  <li className="flex items-center gap-4 text-sm text-slate-400 justify-start group">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="group-hover:text-slate-200">{contactInfo.address}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-slate-600 text-[10px] font-black tracking-[0.3em] uppercase">
            © {new Date().getFullYear()} JO Students. جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>
  );
}
