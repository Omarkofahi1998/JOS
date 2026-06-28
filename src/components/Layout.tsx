import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Home, BookOpen, HelpCircle, FileText, ExternalLink, Sparkles, ChevronDown, Search, Mail, Phone, MapPin, Bell, Clock, ShoppingCart, Briefcase, LogOut, Users } from "lucide-react";
import React, { useState, ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import AnnouncementPortal from "./AnnouncementPortal";

function Logo() {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center group cursor-pointer"
      role="img"
      aria-label="JO Students Logo"
    >
      <img 
        src="/logo.svg" 
        alt="JO Students Logo" 
        className="w-10 h-10 object-contain"
        referrerPolicy="no-referrer"
      />
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
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

    async function fetchAnnouncements() {
      if (!supabase) return;
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (data) {
        setAnnouncements(data);
        const seen = JSON.parse(localStorage.getItem('seen_announcements') || '[]');
        const unread = data.filter(a => !seen.includes(a.id)).length;
        setUnreadCount(unread);
      }
    }
    fetchAnnouncements();

    // Subscribe to new announcements
    if (supabase) {
      const channel = supabase.channel('layout_announcements')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload) => {
          if (payload.new.is_active) {
            setAnnouncements(prev => {
              const updated = [payload.new, ...prev];
              // Update unread count only if dropdown is not open
              const seen = JSON.parse(localStorage.getItem('seen_announcements') || '[]');
              if (!seen.includes(payload.new.id)) {
                setUnreadCount(updated.filter(a => !seen.includes(a.id)).length);
              }
              return updated;
            });
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, []);

  const markAllAsRead = () => {
    const currentSeen = JSON.parse(localStorage.getItem('seen_announcements') || '[]');
    const newSeen = [...new Set([...currentSeen, ...announcements.map(a => a.id)])];
    localStorage.setItem('seen_announcements', JSON.stringify(newSeen));
    setUnreadCount(0);
  };

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
    { 
      name: "الأكاديمية", 
      icon: <BookOpen className="w-4 h-4" />,
      children: [
        { name: "امتحانات تجريبية", path: "/mock-exams", icon: <BookOpen className="w-4 h-4" /> },
        { name: "بنك الأسئلة", path: "/questions", icon: <HelpCircle className="w-4 h-4" /> },
      ]
    },
    { 
      name: "الخدمات والمهن", 
      icon: <Briefcase className="w-4 h-4" />,
      children: [
        { name: "الأكاديمية المهنية", path: "/marketplace", icon: <ShoppingCart className="w-4 h-4" /> },
        { name: "خدماتنا المهنية", path: "/services", icon: <Sparkles className="w-4 h-4" /> },
        { name: "JOin (وظائف)", path: "/job-board", icon: <Briefcase className="w-4 h-4" /> },
      ]
    },
    { 
      name: "عن المنصة", 
      icon: <FileText className="w-4 h-4" />,
      children: [
        { name: "المراجعات", path: "/reviews", icon: <FileText className="w-4 h-4" /> },
        { name: "تواصل معنا", path: "/contact", icon: <Mail className="w-4 h-4" /> },
      ]
    },
  ];

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase!.auth.signOut();
    navigate('/');
  };

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getDashboardLink = () => {
    if (profile?.role === 'admin' || profile?.role === 'manager') return '/admin/dashboard';
    if (profile?.role === 'instructor') return '/instructor/dashboard';
    return '/student/dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 jordan-flag-gradient-soft" dir="rtl">
      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-6 left-6 z-[100] p-3 bg-red-600 text-white rounded-full shadow-2xl shadow-red-600/40 hover:bg-slate-900 transition-colors md:bottom-10 md:left-10"
            aria-label="Back to top"
          >
            <ChevronDown className="w-6 h-6 rotate-180" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* National Identity Bar */}
      <div className="h-1.5 w-full jordan-flag-accent sticky top-0 z-[60] shadow-sm" />
      
      {/* Announcements */}
      <AnnouncementPortal />
      
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-1.5 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20 items-center gap-4">
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
              {/* Notification Bell */}
              <div className="relative ml-2">
                <button 
                  onClick={() => { setShowNotifications(!showNotifications); if(!showNotifications) markAllAsRead(); }}
                  className={`p-2 rounded-xl transition-all relative group ${showNotifications ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {navItems.map((item) => (
                <div 
                  key={item.name} 
                  className="relative group"
                  onMouseEnter={() => item.children && setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.path ? (
                    <Link
                      to={item.path}
                      className={`px-3 py-2 rounded-lg text-[13px] font-bold transition-all relative flex items-center gap-2 ${
                        location.pathname === item.path ? "text-red-600 bg-red-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span>{item.name}</span>
                    </Link>
                  ) : (
                    <button
                      className={`px-3 py-2 rounded-lg text-[13px] font-bold transition-all relative flex items-center gap-1.5 ${
                        activeDropdown === item.name || (item.children?.some(child => location.pathname === child.path)) 
                          ? "text-red-600 bg-red-50" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span>{item.name}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {item.children && activeDropdown === item.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-[60] overflow-hidden"
                      >
                        <div className="px-3 pb-2 mb-1 border-b border-slate-50">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                        </div>
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                              location.pathname === child.path 
                                ? "text-red-600 bg-red-50 font-bold" 
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <div className={`${location.pathname === child.path ? "text-red-600" : "text-slate-400 group-hover:text-slate-600"}`}>
                              {child.icon}
                            </div>
                            <span>{child.name}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              
              {user ? (
                <div className="relative mr-3 group">
                   <button 
                     onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                     className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-red-600 transition-all"
                   >
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden lg:block text-right pr-2">
                        <div className="text-[10px] font-black text-slate-900 leading-none mb-1 truncate max-w-[100px]">
                          {profile?.full_name || user.email?.split('@')[0]}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 leading-none">
                          {profile?.role === 'admin' ? 'مدير النظام' : profile?.role === 'manager' ? 'مدير محتوى' : profile?.role === 'instructor' ? 'مدرب معتمد' : profile?.role === 'service_provider' ? 'مزود خدمة مهنية' : 'صاحب عمل'}
                        </div>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeDropdown === 'user' ? 'rotate-180' : ''}`} />
                   </button>

                   <AnimatePresence>
                     {activeDropdown === 'user' && (
                       <motion.div
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[60]"
                       >
                          <Link 
                            to={getDashboardLink()} 
                            className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
                            onClick={() => setActiveDropdown(null)}
                          >
                             <Sparkles className="w-4 h-4" />
                             لوحة التحكم
                          </Link>
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                          >
                             <LogOut className="w-4 h-4" />
                             تسجيل الخروج
                          </button>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="mr-3 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-red-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                >
                  تسجيل الدخول
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              {/* Notification Bell for Mobile */}
              <div className="relative">
                <button 
                  onClick={() => { setShowNotifications(!showNotifications); if(!showNotifications) markAllAsRead(); }}
                  className={`p-2 rounded-lg transition-all ${showNotifications ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
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

        {/* Global Notifications Dropdown (Desktop & Mobile Overlay) */}
        <AnimatePresence>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-[60] bg-black/5" onClick={() => setShowNotifications(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-4 right-4 md:left-auto md:right-0 md:w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[70] overflow-hidden mt-2 top-full"
            >
                <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Bell className="w-3 h-3 text-red-600" />
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">تنبيهات المنصة</span>
                   </div>
                   <button onClick={() => setShowNotifications(false)} className="md:hidden p-1 hover:bg-slate-200 rounded-full">
                     <X className="w-4 h-4 text-slate-400" />
                   </button>
                   <span className="hidden md:inline-block bg-white px-2 py-0.5 rounded-full text-[10px] font-black text-red-600 border border-red-50">{announcements.length} تنبيه</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                   {announcements.length === 0 ? (
                     <div className="p-10 text-center text-slate-300 font-bold text-xs">لا يوجد تنبيهات حالياً</div>
                   ) : announcements.map((ann, idx) => (
                     <div key={ann.id} className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group cursor-pointer" onClick={() => { if(ann.button_url) window.open(ann.button_url, '_blank'); }}>
                       <div className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ann.type === 'popup' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                             <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                             <h4 className="text-xs font-black text-slate-900 mb-1 truncate">{ann.title}</h4>
                             <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mb-2">{ann.content}</p>
                             <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-slate-400">
                                <Clock className="w-3 h-3" />
                                {new Date(ann.created_at).toLocaleDateString('ar-JO')}
                             </div>
                          </div>
                       </div>
                     </div>
                   ))}
                </div>
                <Link 
                  to="/contact" 
                  onClick={() => setShowNotifications(false)}
                  className="block p-4 text-center text-[10px] font-black text-slate-400 hover:text-red-600 border-t border-slate-50 transition-colors bg-slate-50/30"
                >
                  هل لديك استفسار؟ تواصل معنا
                </Link>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </nav>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white z-[80] shadow-2xl md:hidden overflow-y-auto flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <Logo />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-8 flex-grow">
                {/* Search in Drawer */}
                <form onSubmit={handleSearch} className="relative group">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="ابحث عن أسئلة أو مواضيع..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>

                <div className="space-y-6">
                  {navItems.map((item, idx) => (
                    <motion.div 
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + (idx * 0.05) }}
                      className="space-y-3"
                    >
                      {item.path ? (
                        <Link
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-bold transition-all ${
                            location.pathname === item.path
                              ? "bg-red-50 text-red-600 shadow-sm"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${location.pathname === item.path ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                            {item.icon}
                          </div>
                          <span>{item.name}</span>
                        </Link>
                      ) : (
                        <div className="space-y-2">
                           <div className="px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.name}</div>
                           <div className="grid grid-cols-1 gap-1">
                              {item.children?.map((child) => (
                                <Link
                                  key={child.path}
                                  to={child.path}
                                  onClick={() => setIsOpen(false)}
                                  className={`flex items-center gap-4 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all ${
                                    location.pathname === child.path
                                      ? "text-red-600 bg-red-50/50"
                                      : "text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className={`p-1.5 rounded-md ${location.pathname === child.path ? 'bg-red-100/50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {child.icon}
                                  </div>
                                  <span>{child.name}</span>
                                </Link>
                              ))}
                           </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3">
                {user ? (
                   <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200">
                         <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                           {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex-grow text-right">
                            <div className="text-sm font-black text-slate-900">{profile?.full_name || user.email?.split('@')[0]}</div>
                            <div className="text-[10px] font-bold text-slate-400">{profile?.role || 'مستخدم'}</div>
                         </div>
                      </div>
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-sm font-black bg-slate-900 text-white shadow-xl shadow-slate-900/10"
                      >
                        لوحة التحكم
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full py-4 rounded-2xl text-sm font-black text-red-600 bg-red-50"
                      >
                        تسجيل الخروج
                      </button>
                   </div>
                ) : (
                  <button
                    onClick={() => { setShowAuthModal(true); setIsOpen(false); }}
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-sm font-black bg-slate-900 text-white shadow-xl shadow-slate-900/20 active:scale-95 transition-transform"
                  >
                    <Sparkles className="w-5 h-5" />
                    تسجيل الدخول
                  </button>
                )}
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  جـو ستودنتس • بوابتك للمستقبل
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 border-b border-slate-800 pb-8">
            <div className="text-right">
              <div className="flex items-center gap-3 mb-4 justify-start">
                <img 
                  src="/logo.svg" 
                  alt="JO Students Logo" 
                  className="w-12 h-12 object-contain"
                  referrerPolicy="no-referrer"
                />
                 <span className="text-xl font-black text-white tracking-tight uppercase">JO Students</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {contactInfo.description}
              </p>
            </div>

            <div className="text-right">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4 border-r-4 border-red-600 pr-4">روابط سريعة</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/instructor-registration" className="text-slate-400 hover:text-white transition-all text-sm flex items-center gap-3 justify-start group">
                    <div className="w-1.5 h-1.5 bg-slate-700 group-hover:bg-red-600 rounded-full transition-all" />
                    <span className="group-hover:text-red-500 transition-colors">الانضمام كمدرب</span>
                  </Link>
                </li>
                <li>
                  <Link to="/service-provider-registration" className="text-slate-400 hover:text-white transition-all text-sm flex items-center gap-3 justify-start group">
                    <div className="w-1.5 h-1.5 bg-slate-700 group-hover:bg-red-600 rounded-full transition-all" />
                    <span className="group-hover:text-red-500 transition-colors">تسجيل مقدم خدمة</span>
                  </Link>
                </li>
                <li>
                  <Link to="/company-registration" className="text-slate-400 hover:text-white transition-all text-sm flex items-center gap-3 justify-start group">
                    <div className="w-1.5 h-1.5 bg-slate-700 group-hover:bg-red-600 rounded-full transition-all" />
                    <span className="group-hover:text-red-500 transition-colors">تسجيل شركة</span>
                  </Link>
                </li>
                <li>
                  <Link to="/instructor/login" className="text-slate-400 hover:text-white transition-all text-sm flex items-center gap-3 justify-start group">
                    <div className="w-1.5 h-1.5 bg-slate-700 group-hover:bg-blue-600 rounded-full transition-all" />
                    <span className="group-hover:text-blue-500 transition-colors">بوابة المدربين</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="text-right">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4 border-r-4 border-slate-700 pr-4">روابط الهيئة</h3>
              <ul className="space-y-2">
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
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4 border-r-4 border-emerald-600 pr-4">قنوات التواصل</h3>
              <ul className="space-y-4">
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
          <div className="mt-6 text-center text-slate-600 text-[10px] font-black tracking-[0.3em] uppercase">
            © {new Date().getFullYear()} JO Students. جميع الحقوق محفوظة
          </div>
        </div>
      </footer>

      {/* Auth Selection Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-red-50/50">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">تسجيل الدخول للمنصة</h2>
                <p className="text-sm font-bold text-slate-400 mb-8">اختر نوع الحساب للمتابعة إلى لوحة التحكم الخاصة بك</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    to="/login"
                    onClick={() => setShowAuthModal(false)}
                    className="group p-5 bg-red-600 border-2 border-transparent hover:bg-slate-900 rounded-3xl transition-all duration-300 text-right flex flex-col items-center sm:items-end"
                  >
                    <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="font-black text-white mb-1 text-sm">طالب / متدرب</div>
                    <div className="text-[10px] font-bold text-red-100">دخول الطلاب للخدمات والدورات</div>
                  </Link>

                  <Link
                    to="/instructor/login"
                    onClick={() => setShowAuthModal(false)}
                    className="group p-5 bg-slate-50 border-2 border-transparent hover:border-red-600 hover:bg-white rounded-3xl transition-all duration-300 text-right flex flex-col items-center sm:items-end"
                  >
                    <div className="w-10 h-10 bg-white border border-slate-200 text-slate-900 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="font-black text-slate-900 mb-1 text-sm">مدرب معتمد</div>
                    <div className="text-[10px] font-bold text-slate-400">إدارة الدورات والطلاب</div>
                  </Link>

                  <Link
                    to="/professional-services/login"
                    onClick={() => setShowAuthModal(false)}
                    className="group p-5 bg-slate-50 border-2 border-transparent hover:border-blue-600 hover:bg-white rounded-3xl transition-all duration-300 text-right flex flex-col items-center sm:items-end"
                  >
                    <div className="w-10 h-10 bg-white border border-slate-200 text-slate-900 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="font-black text-slate-900 mb-1 text-sm">مزود خدمات</div>
                    <div className="text-[10px] font-bold text-slate-400">خبراء مراجعة الـ CV والتدريب</div>
                  </Link>

                  <Link
                    to="/job-board"
                    onClick={() => setShowAuthModal(false)}
                    className="group p-5 bg-slate-50 border-2 border-transparent hover:border-emerald-600 hover:bg-white rounded-3xl transition-all duration-300 text-right flex flex-col items-center sm:items-end"
                  >
                    <div className="w-10 h-10 bg-white border border-slate-200 text-slate-900 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="font-black text-slate-900 mb-1 text-sm">أصحاب الشركات</div>
                    <div className="text-[10px] font-bold text-slate-400">نشر الوظائف والبحث عن مواهب</div>
                  </Link>
                </div>

                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="mt-8 text-xs font-black text-slate-400 hover:text-red-600 transition-colors uppercase tracking-widest"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
