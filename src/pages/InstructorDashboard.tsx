import React, { useState, useEffect } from "react";
import { 
  BookOpen, Users, DollarSign, 
  Settings, LogOut, Plus, Edit3, Trash2, 
  ChevronRight, Play, FileText, Calendar, MessageSquare, Sparkles, Star, Bell, X, Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'enrollment' | 'review' | 'support' | 'system';
  read: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [instructorProducts, setInstructorProducts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [stats, setStats] = useState([
    { label: "مجموع الطلاب", value: "0", icon: <Users />, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "الأرباح الكلية", value: "0 JOD", icon: <DollarSign />, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "متوسط التقييم", value: "0.0", icon: <Star />, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "الدورات النشطة", value: "0", icon: <BookOpen />, color: "text-slate-600", bg: "bg-slate-50" },
  ]);

  const [newService, setNewService] = useState({
    title: "",
    description: "",
    price: "",
    category: "دورات تدريبية",
    type: "course",
    thumbnail: ""
  });

  const addToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addToast("تمت قراءة جميع التنبيهات", "info");
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase!.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase!
        .from('products')
        .insert([{
          title: newService.title,
          description: newService.description,
          price: parseFloat(newService.price),
          category: newService.category,
          type: newService.type,
          instructor_id: user.id,
          instructor_name: profile?.full_name || user.email?.split('@')[0],
          status: 'pending'
        }]);

      if (error) throw error;

      addToast("تم تقديم طلب النشر بنجاح، سيتم مراجعته", "success");
      setShowAddModal(false);
      setNewService({ title: "", description: "", price: "", category: "دورات تدريبية", type: "course", thumbnail: "" });
      fetchInstructorData(user);
    } catch (err: any) {
      addToast(err.message || "حدث خطأ أثناء تقديم الطلب", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchInstructorData(session.user);
        
        // Ensure student role doesn't access instructor panel
        supabase?.from('profiles').select('role').eq('id', session.user.id).single()
          .then(({ data }) => {
            if (data?.role === 'user') {
              navigate("/student/dashboard");
            }
          });
      }
    });

    const timer = setTimeout(() => {
      if (!user) return;
      const newNotif: Notification = {
        id: Date.now().toString(),
        title: 'طالب جديد!',
        message: 'قام أحد الطلاب بالتسجيل في دورتك الآن',
        time: 'الآن',
        type: 'enrollment',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
      addToast("تسجيل طالب جديد في دورتك!", "success");
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const fetchInstructorData = async (user: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase!
        .from('products')
        .select('*');
      
      if (error) throw error;

      if (data) {
        setInstructorProducts(data);
        const totalStudents = data.reduce((acc, curr) => acc + (curr.students_count || 0), 0);
        const avgRating = data.length > 0 ? (data.reduce((acc, curr) => acc + (curr.rating || 0), 0) / data.length).toFixed(1) : "0.0";
        
        setStats([
          { label: "مجموع الطلاب", value: totalStudents.toLocaleString(), icon: <Users />, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "الأرباح الكلية", value: "0 JOD", icon: <DollarSign />, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "متوسط التقييم", value: avgRating, icon: <Star />, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "الدورات النشطة", value: data.length.toString(), icon: <BookOpen />, color: "text-slate-600", bg: "bg-slate-50" },
        ]);
      }
    } catch (err) {
      console.error("Error fetching instructor data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase!.auth.signOut();
    window.location.href = "/instructor/login";
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex overflow-hidden lg:flex-row-reverse" dir="rtl">
      {/* Sidebar - Precision Aesthetic */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 72 }}
        className="bg-white border-l border-slate-200 h-screen sticky top-0 overflow-hidden hidden md:flex flex-col z-40 transition-all duration-500 ease-out shadow-[1px_0_0_rgba(0,0,0,0.05)]"
      >
        <div className="p-5 border-b border-slate-100 mb-4">
           {sidebarOpen ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-2xl shadow-slate-900/20 ring-1 ring-white/10">
                   <Sparkles className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex flex-col">
                   <span className="font-black text-slate-900 text-xs uppercase tracking-widest leading-none">لوحة المدرب</span>
                   <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">الإصدار الاحترافي</span>
                </div>
             </motion.div>
           ) : (
             <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white mx-auto shadow-lg">
                <Sparkles className="w-5 h-5 text-red-500" />
             </div>
           )}
        </div>

        <nav className="px-3 space-y-1.5 flex-grow">
          {[
            { id: 'courses', name: 'إدارة المحتوى', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'students', name: 'قائمة المتدربين', icon: <Users className="w-4 h-4" />, badge: notifications.filter(n => n.type === 'enrollment' && !n.read).length },
            { id: 'finances', name: 'السجل المالي', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'reviews', name: 'تحليل التقييمات', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'settings', name: 'إعدادات الحساب', icon: <Settings className="w-4 h-4" /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative group ${
                activeTab === item.id 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                activeTab === item.id ? 'bg-white/10' : 'bg-slate-100 group-hover:bg-white border border-transparent group-hover:border-slate-200'
              }`}>
                {item.icon}
              </div>
              {sidebarOpen && <span className="text-xs font-bold flex-grow text-right">{item.name}</span>}
              {item.badge && item.badge > 0 && (
                <span className={`absolute ${sidebarOpen ? 'left-3' : 'top-2 right-2'} w-5 h-5 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
           {sidebarOpen && (
              <div className="flex items-center gap-3 p-3 mb-2 bg-slate-50 rounded-2xl">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                  {user?.email?.charAt(0).toUpperCase() || 'MA'}
                </div>
                <div className="flex flex-col min-w-0 text-right">
                  <span className="text-xs font-black text-slate-900 truncate">{user?.email || 'أ. محمد علي'}</span>
                  <span className="text-[10px] font-bold text-slate-400">حساب مدرب معتمد</span>
                </div>
              </div>
           )}
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-bold text-xs"
           >
              <LogOut className="w-4 h-4" />
              {sidebarOpen && <span>تسجيل الخروج</span>}
           </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto h-screen relative bg-[#FAFAFA]">
        <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-30 p-4 px-8 flex items-center justify-between flex-row-reverse" dir="ltr">
           <div className="flex items-center gap-4 flex-row-reverse">
              <div className="text-right hidden sm:block">
                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] leading-none mb-1">مساحة العمل الأكاديمية</h2>
                <p className="text-[10px] font-bold text-slate-400">جلسة شريك مصدق عليها</p>
              </div>

              <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />

              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 bg-white border border-slate-200 text-slate-500 rounded-xl flex items-center justify-center hover:border-slate-400 hover:text-slate-900 transition-all relative group shadow-sm"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-14 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden ring-1 ring-black/5"
                        dir="rtl"
                      >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                           <span className="text-xs font-black text-slate-900 uppercase tracking-widest">التنبيهات</span>
                           <button onClick={markAllAsRead} className="text-[10px] font-black text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg">إخفاء الكل</button>
                        </div>
                        <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                           {notifications.map(n => (
                             <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative ${!n.read ? 'bg-red-50/10' : ''}`}>
                                <div className="flex gap-4">
                                   <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${n.type === 'enrollment' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                      {n.type === 'enrollment' ? <Users className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                                   </div>
                                   <div className="flex-grow">
                                      <div className="text-[11px] font-black text-slate-900 mb-0.5">{n.title}</div>
                                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{n.message}</p>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 inline-block">{n.time}</span>
                                   </div>
                                   {!n.read && <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1" />}
                                </div>
                             </div>
                           ))}
                        </div>
                        <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                           <button className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-red-600 transition-colors">عرض السجل الكامل</button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="h-10 w-px bg-slate-200 hidden md:block" />
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-slate-900 text-white rounded-xl px-5 h-10 font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-red-600 transition-all duration-300 shadow-xl shadow-slate-900/10 hover:shadow-red-600/20"
              >
                  <Plus className="w-4 h-4" />
                  تقديم طلب نشر
              </button>
           </div>
        </header>

        {/* Improved Toast Layer */}
        <div className="fixed bottom-8 left-8 z-[100] flex flex-col gap-3">
           <AnimatePresence>
              {toasts.map(toast => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: -50, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(5px)', x: -20 }}
                  className="min-w-[300px] p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 flex items-start gap-4"
                >
                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      {toast.type === 'success' ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                   </div>
                   <div className="flex-grow text-right pr-2">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">تحديث المنصة</div>
                      <div className="text-xs font-bold leading-relaxed">{toast.message}</div>
                   </div>
                   <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                      <X className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                   </button>
                </motion.div>
              ))}
           </AnimatePresence>
        </div>

        <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto text-right">
           {/* High-Contrast Stats Section */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-slate-200/30 transition-all duration-500 group relative overflow-hidden"
                >
                   <div className="relative z-10">
                      <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4 mr-0 ml-auto transition-transform duration-500 group-hover:scale-110 shadow-sm`}>
                         {React.cloneElement(stat.icon as React.ReactElement, { className: "w-5 h-5" })}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
                      <div className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                   </div>
                   <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent -mr-12 -mt-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </motion.div>
              ))}
           </div>

           {/* Content Catalog Section */}
           <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                 <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                       <span className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_12px_rgba(220,38,38,0.5)]" />
                       كتالوج المحتوى
                    </h2>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">الوحدات التعليمية والمسارات النشطة</p>
                 </div>
                 <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm ring-1 ring-black/5">
                    <button className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all">مباشر ونشط</button>
                    <button className="px-5 py-2 text-slate-500 hover:text-slate-900 font-bold rounded-lg text-xs uppercase tracking-widest transition-all">قائمة المراجعة</button>
                    <button className="px-5 py-2 text-slate-500 hover:text-slate-900 font-bold rounded-lg text-xs uppercase tracking-widest transition-all">التحليلات</button>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                  {instructorProducts.map(product => (
                    <motion.div 
                      key={product.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white border border-slate-200 border-l-4 border-l-slate-900 group hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 rounded-2xl p-6 flex flex-col xl:flex-row-reverse items-start xl:items-center gap-8 relative overflow-hidden"
                    >
                       <div className="w-64 h-40 xl:w-32 xl:h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200/50 shadow-inner group-hover:shadow-none transition-all duration-500">
                          <img 
                            src={product.thumbnail_url || product.thumbnail || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=300&auto=format&fit=crop`} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0" 
                            referrerPolicy="no-referrer" 
                          />
                       </div>

                       <div className="flex-grow flex flex-col min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3 justify-end text-[9px] font-black uppercase tracking-tighter">
                             <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded border border-slate-200">المرجع: {product.id}</span>
                             <span className={`px-2 py-1 bg-red-50 text-red-600 border-red-100 rounded border uppercase`}>
                                {product.type}
                             </span>
                             <span className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
                                product.status === 'active' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                                product.status === 'rejected' ? 'text-red-600 bg-red-50 border-red-100' : 
                                'text-orange-600 bg-orange-50 border-orange-100'
                             }`}>
                                <span className={`w-1 h-1 rounded-full ${product.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`} />
                                {product.status === 'active' ? 'حالة نشطة' : product.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                             </span>
                          </div>
                          <h3 className="font-black text-slate-900 text-lg group-hover:text-red-700 transition-colors duration-500 leading-tight mb-2">{product.title}</h3>
                          <div className="flex items-center gap-5 text-slate-400 font-bold text-[11px] justify-end">
                             <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {new Date(product.created_at).toLocaleDateString('ar-JO')}</span>
                             <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> {product.students_count || 0} مشترك</span>
                             <span className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-yellow-500" /> {product.rating || 0.0}</span>
                          </div>
                       </div>

                       <div className="flex items-center gap-8 px-10 py-5 bg-slate-50/50 rounded-2xl border border-slate-200 shadow-inner hidden xl:flex">
                          <div className="text-center">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">الإيراد الشهري</span>
                             <span className="font-black text-slate-900 text-sm">0.00 JOD</span>
                          </div>
                       </div>

                       <div className="flex gap-3 w-full xl:w-auto xl:shrink-0 pt-4 xl:pt-0 border-t xl:border-t-0 border-slate-100 mt-2 xl:mt-0">
                          <button className="flex-grow xl:flex-none px-6 h-12 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-red-600 shadow-xl shadow-slate-900/10 hover:shadow-red-600/20 transition-all duration-500">
                             <Edit3 className="w-4 h-4" />
                             لوحة التحكم
                          </button>
                       </div>
                    </motion.div>
                  ))}

                  {instructorProducts.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                       <p className="font-bold text-slate-400">لا يوجد محتوى مضاف حتى الآن</p>
                    </div>
                  )}
              </div>
           </div>
        </div>
      </main>

      {/* Professional Full-Overlay Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[92vh] border border-white/20"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 text-right" dir="rtl">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-inner">
                      <Plus className="w-5 h-5" />
                   </div>
                   <div className="flex flex-col">
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none">تقديم طلب إضافة جديد</h2>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">بوابة إنشاء ونشر المحتوى التعليمي</span>
                   </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-full text-slate-400 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddService} className="p-8 space-y-6 text-right overflow-y-auto custom-scrollbar" dir="rtl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">معرف الدورة / العنوان</label>
                  <input 
                    type="text" 
                    required
                    className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-red-600 focus:bg-white transition-all duration-500 font-black text-sm shadow-inner focus:shadow-none"
                    placeholder="أدخل عنوان الدورة الاحترافي..."
                    value={newService.title}
                    onChange={e => setNewService({...newService, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">تحديد الفئة</label>
                    <div className="relative">
                       <select 
                         className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-red-600 focus:bg-white transition-all duration-500 font-bold text-xs appearance-none cursor-pointer"
                         value={newService.category}
                         onChange={e => setNewService({...newService, category: e.target.value})}
                       >
                         <option>مسار دورة مسجلة</option>
                         <option>جلسة تفاعل مباشرة</option>
                         <option>بنك تقييمات تقنية</option>
                       </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">القيمة التجارية (JOD)</label>
                    <input 
                      type="number" 
                      required
                      className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-red-600 focus:bg-white transition-all duration-500 font-black text-sm"
                      placeholder="نموذج التسعير..."
                      value={newService.price}
                      onChange={e => setNewService({...newService, price: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-right">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">بنية تقديم المحتوى</label>
                   <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'course', name: 'دورة رقمية', icon: <Play className="w-4 h-4" /> },
                        { id: 'live', name: 'فصل افتراضي', icon: <Calendar className="w-4 h-4" /> },
                        { id: 'file', name: 'حقيبة موارد', icon: <FileText className="w-4 h-4" /> },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNewService({...newService, type: t.id})}
                          className={`p-4 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center gap-2.5 font-black text-[10px] uppercase tracking-widest ${
                            newService.type === t.id ? 'border-slate-900 bg-slate-900 text-white shadow-2xl shadow-slate-900/30' : 'border-slate-100 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {t.icon}
                          {t.name}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">الوصف الاحترافي</label>
                  <textarea 
                    rows={4}
                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-red-600 focus:bg-white transition-all duration-500 font-medium text-xs leading-relaxed shadow-inner focus:shadow-none"
                    placeholder="قدم خارطة طريق مفصلة لمخرجات التعلم والمهارات المكتسبة..."
                    value={newService.description}
                    onChange={e => setNewService({...newService, description: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-red-600 transition-all duration-700 shadow-2xl shadow-slate-900/20 active:scale-95 mt-4 group disabled:opacity-50"
                >
                  {isSubmitting ? "جاري المعالجة..." : "تأكيد وبدء مراجعة المحتوى"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
