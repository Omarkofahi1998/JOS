import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  LayoutDashboard, Plus, LogOut, FileText, HelpCircle, Loader2, 
  CheckCircle2, AlertCircle, Sparkles, Trash2, Edit3, Layers, 
  Search, X, MessageSquare, Shield, Settings, Menu, Bell, User, Clock, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'files' | 'services' | 'settings' | 'features' | 'reviews' | 'contacts'>('questions');
  const [subTab, setSubTab] = useState<'add' | 'list' | 'bulk'>('list');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const navigate = useNavigate();

  // Records Lists
  const [questions, setQuestions] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit State
  const [editingId, setEditingId] = useState<number | string | null>(null);

  // Form States - Collections
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [qMajor, setQMajor] = useState("عام");
  const [qImage, setQImage] = useState("");
  const [bulkText, setBulkText] = useState("");

  const [fTitle, setFTitle] = useState("");
  const [fCategory, setFCategory] = useState("مختبرات");
  const [fUrl, setFUrl] = useState("");
  const [fSize, setFSize] = useState("1.0 MB");

  const [sTitle, setSTitle] = useState("");
  const [sDesc, setSDesc] = useState("");
  const [sIcon, setSIcon] = useState("Settings");
  const [sColor, setSColor] = useState("bg-slate-50");

  const [featTitle, setFeatTitle] = useState("");
  const [featDesc, setFeatDesc] = useState("");
  const [featIcon, setFeatIcon] = useState("BookOpen");
  const [featColor, setFeatColor] = useState("bg-red-50");
  const [featPath, setFeatPath] = useState("/");
  const [featOrder, setFeatOrder] = useState(0);

  const [rTitle, setRTitle] = useState("");
  const [rDesc, setRDesc] = useState("");
  const [rAuthor, setRAuthor] = useState("Jo Students");
  const [rReadTime, setRReadTime] = useState("٥ دقائق");
  const [rDate, setRDate] = useState("");

  const [siteSet, setSiteSet] = useState({
    hero_title: "",
    hero_subtitle: "",
    hero_image: "",
    visitor_count: "0",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    success_rate: "92"
  });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/admin/login");
      setSession(session);
    });
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [q, f, s, settings, feat, rev, con, stats] = await Promise.all([
        supabase.from('questions').select('*').order('id', { ascending: false }),
        supabase.from('question_files').select('*').order('id', { ascending: false }),
        supabase.from('services').select('*').order('id', { ascending: false }),
        supabase.from('site_settings').select('key, value'),
        supabase.from('features').select('*').order('order_index', { ascending: true }),
        supabase.from('reviews').select('*').order('id', { ascending: false }),
        supabase.from('contact_messages').select('*').order('id', { ascending: false }),
        supabase.from('visitor_stats').select('count').eq('id', 1).single()
      ]);
      if (q.data) setQuestions(q.data);
      if (f.data) setFiles(f.data);
      if (s.data) setServices(s.data);
      if (feat.data) setFeatures(feat.data);
      if (rev.data) setReviews(rev.data);
      if (con.data) setContacts(con.data);
      
      if (settings.data) {
        const obj: any = {};
        settings.data.forEach(item => obj[item.key] = item.value);
        setSiteSet({
          hero_title: obj.hero_title || "",
          hero_subtitle: obj.hero_subtitle || "",
          hero_image: obj.hero_image || "",
          visitor_count: stats.data?.count?.toString() || "0",
          contact_email: obj.contact_email || "",
          contact_phone: obj.contact_phone || "",
          contact_address: obj.contact_address || "",
          success_rate: obj.success_rate || "92"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (table: string, id: any) => {
    if (!supabase || !window.confirm("هل أنت متأكد من حذف هذا السجل بشكل نهائي؟")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      setStatus({ type: 'success', msg: 'تم حذف السجل بنجاح' });
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: "فشل الحذف: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setEditingId(null);
    setQText("");
    setQOptions(["", "", "", ""]);
    setQCorrect(0);
    setQMajor("عام");
    setQImage("");
    setBulkText("");
    setFTitle("");
    setFUrl("");
    setSTitle("");
    setSDesc("");
    setFeatTitle("");
    setFeatDesc("");
    setRTitle("");
    setRDesc("");
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    navigate("/admin/login");
  };

  // Form Handlers
  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const payload = { text: qText, options: qOptions, correct: qCorrect, major: qMajor, image_url: qImage };
      let error;
      if (editingId) ({ error } = await supabase.from('questions').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('questions').insert(payload));
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت إضافة السؤال بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const data = JSON.parse(bulkText);
      if (!Array.isArray(data)) throw new Error("يجب أن يكون النص مصفوفة JSON [{}, {}]");
      
      const { error } = await supabase.from('questions').insert(data);
      if (error) throw error;
      
      setStatus({ type: 'success', msg: `تم رفع ${data.length} سؤال بنجاح` });
      setBulkText("");
      setSubTab('list');
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: "خطأ في التنسيق: تأكد من صحة نص JSON" });
    } finally {
      setLoading(false);
    }
  };

  const addFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
      const payload = { title: fTitle, category: fCategory, url: fUrl, file_size: fSize, file_date: today };
      let error;
      if (editingId) ({ error } = await supabase.from('question_files').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('question_files').insert({ ...payload, download_count: 0 }));
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت إضافة الملف بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const payload = { title: sTitle, description: sDesc, icon_name: sIcon, bg_color: sColor };
      let error;
      if (editingId) ({ error } = await supabase.from('services').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('services').insert(payload));
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت إضافة الخدمة بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const addFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const payload = { title: featTitle, description: featDesc, icon_name: featIcon, color_class: featColor, link_path: featPath, order_index: featOrder };
      let error;
      if (editingId) ({ error } = await supabase.from('features').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('features').insert(payload));
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت إضافة الأداة بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const addReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const today = new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' });
      const payload = { title: rTitle, description: rDesc, author: rAuthor, read_time: rReadTime, file_date: rDate || today };
      let error;
      if (editingId) ({ error } = await supabase.from('reviews').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('reviews').insert(payload));
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تم إضافة المراجعة بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const siteSettingsData = {
        hero_title: siteSet.hero_title,
        hero_subtitle: siteSet.hero_subtitle,
        hero_image: siteSet.hero_image,
        contact_email: siteSet.contact_email,
        contact_phone: siteSet.contact_phone,
        contact_address: siteSet.contact_address,
        success_rate: siteSet.success_rate
      };
      
      const updates = Object.entries(siteSettingsData).map(([key, value]) => 
        supabase.from('site_settings').upsert({ key, value })
      );
      
      // Update visitor stats
      const statsUpdate = supabase.from('visitor_stats').upsert({ id: 1, count: parseInt(siteSet.visitor_count) });
      
      await Promise.all([...updates, statsUpdate]);
      setStatus({ type: 'success', msg: 'تم حفظ الإعدادات بنجاح' });
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const sidebarItems = [
    { id: 'questions', name: 'بنك الأسئلة', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'files', name: 'بنك الملفات', icon: <FileText className="w-5 h-5" /> },
    { id: 'services', name: 'الخدمات المهنية', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'features', name: 'أدوات التفوق', icon: <Layers className="w-5 h-5" /> },
    { id: 'reviews', name: 'المراجعات', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'contacts', name: 'الرسائل الواردة', icon: <Bell className="w-5 h-5" /> },
    { id: 'settings', name: 'بناء الهوية', icon: <Settings className="w-5 h-5" /> },
  ];

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-row-reverse overflow-hidden font-sans" dir="rtl">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-white border-l border-slate-200 h-screen sticky top-0 flex flex-col z-50 shadow-sm"
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-50">
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-xl text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-black text-slate-900 tracking-tight">لوحة الإشراف</span>
            </motion.div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setSubTab('list'); resetForms(); }}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all relative group ${
                activeTab === item.id ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className={activeTab === item.id ? 'text-red-600' : 'text-slate-400 group-hover:text-red-600'}>{item.icon}</div>
              {sidebarOpen && <span className="font-bold text-sm whitespace-nowrap">{item.name}</span>}
              {activeTab === item.id && <motion.div layoutId="activeTab" className="absolute left-0 w-1.5 h-6 bg-red-600 rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative custom-scrollbar">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-8 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                 <LayoutDashboard className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                 {sidebarItems.find(i => i.id === activeTab)?.name}
              </h2>
           </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">تاريخ الجلسة</span>
              <span className="text-xs font-bold text-slate-900 mt-1">{new Date().toLocaleDateString('ar-JO')}</span>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
               <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Action Tabs */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-2">
              {activeTab !== 'settings' && activeTab !== 'contacts' && (
                <>
                  <button 
                    onClick={() => setSubTab('list')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                      subTab === 'list' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    عرض الكل
                  </button>
                  <button 
                    onClick={() => { setSubTab('add'); resetForms(); }}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                      subTab === 'add' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {editingId ? 'تعديل الحالي' : 'إضافة سجل'}
                  </button>
                  {activeTab === 'questions' && (
                    <button 
                      onClick={() => setSubTab('bulk')}
                      className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                        subTab === 'bulk' ? 'bg-red-600 text-white border-red-600 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      إضافة بالجملة (JSON)
                    </button>
                  )}
                </>
              )}
            </div>
            
            {subTab === 'list' && activeTab !== 'settings' && activeTab !== 'contacts' && (
              <div className="relative w-64">
                 <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                   type="text" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="بحث..." 
                   className="w-full h-10 pr-10 pl-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 text-sm font-medium"
                 />
              </div>
            )}
          </div>

          {/* Status Alert */}
          <AnimatePresence>
            {status && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className={`mb-8 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {status.msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Content */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-sm min-h-[600px] overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <div className="bg-white p-6 rounded-3xl shadow-2xl flex items-center gap-4">
                  <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                  <span className="font-black text-slate-900">جاري المعالجة...</span>
                </div>
              </div>
            )}

            <div className="p-8">
              {/* LIST VIEW */}
              {subTab === 'list' && activeTab !== 'settings' && activeTab !== 'contacts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(activeTab === 'questions' ? questions : activeTab === 'files' ? files : activeTab === 'services' ? services : activeTab === 'features' ? features : reviews)
                    .filter(item => 
                      (item.text || item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (item.major || item.category || item.description || "").toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((item, idx) => (
                      <motion.div 
                        key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                        className="p-6 bg-white border border-slate-100 rounded-3xl hover:border-red-100 hover:shadow-xl hover:shadow-red-500/5 transition-all group flex flex-col h-full"
                      >
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => {
                                  if(activeTab === 'questions') { setEditingId(item.id); setQText(item.text); setQOptions(item.options); setQCorrect(item.correct); setQMajor(item.major); setSubTab('add'); }
                                  else if(activeTab === 'files') { setEditingId(item.id); setFTitle(item.title); setFCategory(item.category); setFUrl(item.url); setFSize(item.file_size); setSubTab('add'); }
                                  else if(activeTab === 'services') { setEditingId(item.id); setSTitle(item.title); setSDesc(item.description); setSIcon(item.icon_name || "Settings"); setSColor(item.bg_color || "bg-slate-50"); setSubTab('add'); }
                                  else if(activeTab === 'features') { setEditingId(item.id); setFeatTitle(item.title); setFeatDesc(item.description); setFeatIcon(item.icon_name || "BookOpen"); setFeatColor(item.color_class || "bg-red-50"); setFeatPath(item.link_path || "/"); setFeatOrder(item.order_index || 0); setSubTab('add'); }
                                  else if(activeTab === 'reviews') { setEditingId(item.id); setRTitle(item.title); setRDesc(item.description); setRAuthor(item.author || "Jo Students"); setRReadTime(item.read_time || "٥ دقائق"); setRDate(item.file_date || ""); setSubTab('add'); }
                                }}
                                className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl"
                              ><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => deleteItem(activeTab === 'files' ? 'question_files' : activeTab, item.id)} className="p-2 bg-red-50 text-red-300 hover:text-red-600 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                           </div>
                           <span className="text-[10px] font-black text-slate-300 uppercase"># {item.id}</span>
                        </div>
                        <h4 className="font-black text-slate-900 mb-2 truncate">{item.title || item.major || item.category || 'سجل جديد'}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-6 flex-grow">{item.text || item.description || item.url}</p>
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
                           <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.created_at || Date.now()).toLocaleDateString('ar-JO')}</div>
                           <ChevronRight className="w-3 h-3" />
                        </div>
                      </motion.div>
                  ))}
                </div>
              )}

              {/* MESSAGES VIEW */}
              {activeTab === 'contacts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {contacts.length === 0 ? <p className="col-span-full text-center text-slate-300 font-bold py-20">لا يوجد رسائل</p> : contacts.map((msg) => (
                     <div key={msg.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 group hover:bg-white hover:shadow-2xl transition-all">
                      <div className="flex justify-between items-start mb-6">
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={async () => {
                                   const { error } = await supabase!.from('contact_messages').update({ is_read: !msg.is_read }).eq('id', msg.id);
                                   if(!error) fetchData();
                                }}
                                className={`p-2 rounded-xl transition-all ${msg.is_read ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}
                                title={msg.is_read ? "تحديد كغير مقروء" : "تحديد كمقروء"}
                              >
                                 <CheckCircle2 className="w-5 h-5" />
                              </button>
                              <button onClick={() => deleteItem('contact_messages', msg.id)} className="p-2 bg-red-50 text-red-300 hover:text-red-600 rounded-xl">
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                           <div className="text-right">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                 {!msg.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                                 <h3 className="font-black text-slate-900 text-lg">{msg.name}</h3>
                              </div>
                              <span className="text-sm text-red-600 font-bold">{msg.email}</span>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div className="bg-white p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-300 uppercase mb-1">الموضوع</p><p className="text-sm font-bold text-slate-900">{msg.subject}</p></div>
                           <div className="bg-white p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-300 uppercase mb-1">الرسالة</p><p className="text-sm text-slate-600 leading-relaxed">{msg.message}</p></div>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {/* SETTINGS VIEW */}
              {activeTab === 'settings' && (
                <form onSubmit={saveSettings} className="space-y-10 max-w-2xl mx-auto py-12">
                   <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl mb-8 text-right">
                      <h3 className="text-blue-900 font-black mb-2 flex items-center justify-end gap-2 text-sm">
                         إرشادات بناء الهوية
                         <Shield className="w-4 h-4" />
                      </h3>
                      <p className="text-blue-700 text-xs leading-relaxed font-medium">
                         من هنا يمكنك التحكم في المحتوى الأساسي للواجهة، تأكد من استخدام روابط صور مباشرة لضمان سرعة التحميل.
                      </p>
                   </div>

                   <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-200 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-slate-400 uppercase">عنوان الموقع الرئيسي</label>
                          <input type="text" value={siteSet.hero_title} onChange={e => setSiteSet({...siteSet, hero_title: e.target.value})} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" />
                        </div>
                        <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-slate-400 uppercase">عداد الزوار</label>
                          <input type="number" value={siteSet.visitor_count} onChange={e => setSiteSet({...siteSet, visitor_count: e.target.value})} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" />
                        </div>
                        <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-slate-400 uppercase">نسبة النجاح (%)</label>
                          <input type="text" value={siteSet.success_rate} onChange={e => setSiteSet({...siteSet, success_rate: e.target.value})} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" />
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">رابط صورة الغلاف (URL)</label>
                        <input type="text" value={siteSet.hero_image} onChange={e => setSiteSet({...siteSet, hero_image: e.target.value})} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-mono text-xs" />
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase">معلومات التواصل المباشر</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <input type="text" value={siteSet.contact_email} onChange={e => setSiteSet({...siteSet, contact_email: e.target.value})} className="h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 text-sm" placeholder="البريد الإلكتروني" />
                           <input type="text" value={siteSet.contact_phone} onChange={e => setSiteSet({...siteSet, contact_phone: e.target.value})} className="h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 text-sm" placeholder="رقم الهاتف" />
                           <input type="text" value={siteSet.contact_address} onChange={e => setSiteSet({...siteSet, contact_address: e.target.value})} className="h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 text-sm" placeholder="العنوان" />
                        </div>
                      </div>

                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">الرسالة الترحيبية (وصف الهوية)</label>
                        <textarea rows={4} value={siteSet.hero_subtitle} onChange={e => setSiteSet({...siteSet, hero_subtitle: e.target.value})} className="w-full p-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-medium" />
                      </div>
                   </div>
                   <button type="submit" disabled={loading} className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                      تحديث بيانات الهوية البصرية
                   </button>
                </form>
              )}

              {/* ADD/EDIT FORM FOR QUESTIONS */}
              {subTab === 'add' && activeTab === 'questions' && (
                <form onSubmit={addQuestion} className="space-y-10 max-w-4xl mx-auto py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-6">
                        <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">نص السؤال</label><textarea required rows={8} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:bg-white focus:border-red-600 text-base" value={qText} onChange={e => setQText(e.target.value)} /></div>
                        <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">رابط الصورة (URL)</label><input type="text" className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-600 font-mono text-xs" value={qImage} onChange={e => setQImage(e.target.value)} placeholder="https://example.com/image.png" /></div>
                        <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-slate-400 uppercase">تخصص السؤال (أو اكتب تخصص جديد)</label>
                          <input 
                            type="text" 
                            list="majors-list"
                            className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-600 font-bold" 
                            value={qMajor} 
                            onChange={e => setQMajor(e.target.value)} 
                          />
                          <datalist id="majors-list">
                            {Array.from(new Set(questions.map(q => q.major))).map(m => (
                              <option key={m} value={m} />
                            ))}
                          </datalist>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase block mb-6">الخيارات المتاحة (حدد الجواب الصحيح)</label>
                        {qOptions.map((opt, i) => (
                           <div key={i} className="flex items-center gap-4">
                              <input type="radio" checked={qCorrect === i} onChange={() => setQCorrect(i)} className="accent-red-600 w-6 h-6" />
                              <input type="text" required placeholder={`الخيار المتوقع رقم ${i+1}`} className="flex-1 h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white" value={opt} onChange={e => { const n = [...qOptions]; n[i] = e.target.value; setQOptions(n); }} />
                           </div>
                        ))}
                     </div>
                  </div>
                  <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl">{editingId ? 'تأكيد التعديل' : 'إضافة السؤال للبنك'}</button>
                </form>
              )}

              {/* ADD/EDIT FORM FOR FILES */}
              {subTab === 'add' && activeTab === 'files' && (
                <form onSubmit={addFile} className="space-y-8 max-w-2xl mx-auto py-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                      <div className="space-y-2 col-span-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">اسم الملف</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={fTitle} onChange={e => setFTitle(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">رابط التحميل</label><input type="url" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none font-mono" value={fUrl} onChange={e => setFUrl(e.target.value)} /></div>
                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">الفئة (أو اكتب فئة جديدة)</label>
                        <input 
                          type="text" 
                          list="cats-list"
                          className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" 
                          value={fCategory} 
                          onChange={e => setFCategory(e.target.value)} 
                        />
                        <datalist id="cats-list">
                          {Array.from(new Set(files.map(f => f.category))).map(c => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                   </div>
                   <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl">حفظ وإدراج الملف</button>
                </form>
              )}
              
              {/* ADD/EDIT FORM FOR SERVICES */}
              {subTab === 'add' && activeTab === 'services' && (
                <form onSubmit={addService} className="space-y-8 max-w-2xl mx-auto py-6">
                   <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">عنوان الخدمة</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={sTitle} onChange={e => setSTitle(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">الوصف التفصيلي</label><textarea rows={6} required className="w-full p-6 bg-white border border-slate-200 rounded-3xl outline-none focus:border-red-600" value={sDesc} onChange={e => setSDesc(e.target.value)} /></div>
                      
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">الأيقونة</label>
                            <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={sIcon} onChange={e => setSIcon(e.target.value)}>
                               <option value="Settings">إعدادات</option>
                               <option value="Sparkles">بريق</option>
                               <option value="Star">نجمة</option>
                               <option value="Award">جائزة</option>
                               <option value="Tool">أداة</option>
                            </select>
                         </div>
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">لون الخلفية</label>
                            <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={sColor} onChange={e => setSColor(e.target.value)}>
                               <option value="bg-slate-50">رمادي فاتح</option>
                               <option value="bg-red-50">أحمر فاتح</option>
                               <option value="bg-blue-50">أزرق فاتح</option>
                               <option value="bg-emerald-50">أخضر فاتح</option>
                            </select>
                         </div>
                      </div>
                   </div>
                   <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl">تحديث الخدمات</button>
                </form>
              )}

               {/* ADD/EDIT FORM FOR REVIEWS */}
               {subTab === 'add' && activeTab === 'reviews' && (
                <form onSubmit={addReview} className="space-y-8 max-w-2xl mx-auto py-6">
                   <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">عنوان المراجعة</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={rTitle} onChange={e => setRTitle(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">الكاتب</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={rAuthor} onChange={e => setRAuthor(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">النص</label><textarea rows={6} required className="w-full p-6 bg-white border border-slate-200 rounded-3xl outline-none focus:border-red-600" value={rDesc} onChange={e => setRDesc(e.target.value)} /></div>
                   </div>
                   <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl">حفظ المراجعة</button>
                </form>
              )}

              {/* ADD/EDIT FORM FOR FEATURES */}
              {subTab === 'add' && activeTab === 'features' && (
                <form onSubmit={addFeature} className="space-y-8 max-w-2xl mx-auto py-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                      <div className="space-y-2 col-span-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">اسم الأداة</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={featTitle} onChange={e => setFeatTitle(e.target.value)} /></div>
                      <div className="space-y-2 col-span-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">الوصف</label><textarea rows={3} required className="w-full p-6 bg-white border border-slate-200 rounded-3xl outline-none focus:border-red-600" value={featDesc} onChange={e => setFeatDesc(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">المسار (Path)</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none font-mono" value={featPath} onChange={e => setFeatPath(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">الترتيب</label><input type="number" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={featOrder} onChange={e => setFeatOrder(parseInt(e.target.value))} /></div>
                      
                      <div className="space-y-2 text-right">
                         <label className="text-xs font-black text-slate-400 uppercase">الأيقونة</label>
                         <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={featIcon} onChange={e => setFeatIcon(e.target.value)}>
                            <option value="BookOpen">كتاب</option>
                            <option value="Clock">ساعة</option>
                            <option value="HelpCircle">سؤال</option>
                            <option value="FileText">ملف</option>
                            <option value="Sparkles">بريق</option>
                         </select>
                      </div>
                      <div className="space-y-2 text-right">
                         <label className="text-xs font-black text-slate-400 uppercase">اللون (Class)</label>
                         <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={featColor} onChange={e => setFeatColor(e.target.value)}>
                            <option value="bg-red-50">أحمر</option>
                            <option value="bg-blue-50">أزرق</option>
                            <option value="bg-emerald-50">أخضر</option>
                            <option value="bg-amber-50">برتقالي</option>
                         </select>
                      </div>
                   </div>
                   <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl">حفظ الأداة</button>
                </form>
              )}
              {/* BULK ADD VIEW */}
              {subTab === 'bulk' && activeTab === 'questions' && (
                <form onSubmit={handleBulkAdd} className="space-y-8 animate-in fade-in duration-500">
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl text-right">
                    <h3 className="text-amber-900 font-black mb-2 flex items-center justify-end gap-2 text-sm">
                      تعليمات الرفع الجماعي
                      <AlertCircle className="w-4 h-4" />
                    </h3>
                    <p className="text-amber-700 text-xs leading-relaxed">
                      يجب أن يكون النص بصيغة مصفوفة JSON صحيحة. مثال: <br/>
                      <code className="bg-white/50 p-1 rounded font-mono text-[10px]">
                        [{ "{" } "text": "السؤال؟", "options": ["أ", "ب", "ج", "د"], "correct": 0, "major": "عام", "image_url": "رابط الصورة" { "}" }]
                      </code>
                    </p>
                  </div>
                  <textarea 
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    required
                    placeholder="الصق نص JSON هنا..."
                    className="w-full h-[400px] p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:bg-white focus:border-red-600 font-mono text-sm leading-relaxed"
                  />
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-16 bg-red-600 text-white rounded-[2rem] font-black hover:bg-slate-900 transition-all shadow-2xl flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                    رفع ومعالجة جميع الأسئلة الآن
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
}
