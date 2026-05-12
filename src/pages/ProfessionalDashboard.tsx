import React, { useState, useEffect } from "react";
import { 
  Briefcase, MessageSquare, DollarSign, 
  Settings, LogOut, Plus, Edit3, 
  ChevronRight, FileText, Calendar, Sparkles, Star, Bell, X, Check, ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";

interface ServiceRequest {
  id: string;
  client_name: string;
  service_type: string;
  status: 'pending' | 'processing' | 'completed';
  date: string;
  amount: string;
}

export default function ProfessionalDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    price: '',
    category: 'تعديل سيرة ذاتية'
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    earnings: 0
  });

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchRequests(session.user.id);
        fetchServices(session.user.id);
        fetchStats(session.user.id);
      } else {
        window.location.href = "/professional-services/login";
      }
    });
  }, []);

  const fetchServices = async (userId: string) => {
    const { data, error } = await supabase!
      .from('services')
      .select('*')
      .eq('provider_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error && data) setServices(data);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmittingService(true);
    try {
      const { error } = await supabase!
        .from('services')
        .insert([{
          provider_id: user.id,
          title: newService.title,
          description: newService.description,
          price: parseFloat(newService.price),
          category: newService.category,
          icon_name: 'Sparkles',
          bg_color: 'bg-blue-50',
          status: 'pending' // Force pending status for admin approval
        }]);

      if (error) throw error;
      
      setShowAddServiceModal(false);
      setNewService({ title: '', description: '', price: '', category: 'تعديل سيرة ذاتية' });
      fetchServices(user.id);
    } catch (err) {
      console.error("Error adding service:", err);
      alert("حدث خطأ أثناء إضافة الخدمة");
    } finally {
      setIsSubmittingService(false);
    }
  };

  const fetchRequests = async (userId: string) => {
    const { data, error } = await supabase!
      .from('service_requests')
      .select('*')
      .eq('provider_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error && data) setRequests(data);
  };

  const fetchStats = async (userId: string) => {
    const { data, error } = await supabase!
      .from('service_requests')
      .select('amount, status')
      .eq('provider_id', userId);

    if (!error && data) {
      const total = data.length;
      const pending = data.filter(r => r.status === 'pending').length;
      const earnings = data.reduce((acc, curr) => acc + parseInt(curr.amount) || 0, 0);
      setStats({ total, pending, earnings });
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase!.auth.signOut();
    window.location.href = "/professional-services/login";
  };

  if (loading) return <div className="h-screen flex items-center justify-center">جاري تحميل اللوحة...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row-reverse text-right" dir="rtl">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-l border-slate-200 p-6 flex flex-col">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-xs uppercase tracking-widest">بوابة الخبراء</h2>
            <p className="text-[10px] font-bold text-slate-400">مزود خدمات مهني</p>
          </div>
        </div>

        <nav className="space-y-2 flex-grow">
          {[
            { name: 'الرئيسية', icon: <Sparkles className="w-4 h-4" />, active: true },
            { name: 'طلبات الخدمات', icon: <FileText className="w-4 h-4" /> },
            { name: 'سجل الأرباح', icon: <DollarSign className="w-4 h-4" /> },
            { name: 'المحادثات', icon: <MessageSquare className="w-4 h-4" /> },
            { name: 'الإعدادات', icon: <Settings className="w-4 h-4" /> },
          ].map(item => (
            <button key={item.name} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all ${item.active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-all">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-black text-slate-900">أهلاً بك، {profile?.full_name || 'زميلنا الخبير'} 👋</h1>
            <p className="text-slate-500 font-medium mt-1">لديك {stats.pending} طلبات جديدة تحتاج للمراجعة اليوم.</p>
          </div>
          <button 
            onClick={() => setShowAddServiceModal(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة خدمة جديدة
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'إجمالي الطلبات', value: stats.total.toString(), icon: <FileText />, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'أرباح محققة', value: `${stats.earnings} JOD`, icon: <DollarSign />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'طلبات معلقة', value: stats.pending.toString(), icon: <Bell />, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'الخدمات النشطة', value: services.length.toString(), icon: <Sparkles />, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Requests Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">أحدث الطلبات الواردة</h3>
              <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">عرض الكل</button>
            </div>
            <div className="overflow-x-auto">
              {requests.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-bold text-sm">
                  لا توجد طلبات واردة حالياً
                </div>
              ) : (
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="p-4">العميل</th>
                      <th className="p-4">الخدمة</th>
                      <th className="p-4">المبلغ</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {requests.map((req: any) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 text-sm">{req.client_name}</div>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-600">{req.service_type}</td>
                        <td className="p-4 text-sm font-black text-slate-900">{req.amount}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            req.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                            req.status === 'processing' ? 'bg-blue-50 text-blue-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                            {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'processing' ? 'جاري العمل' : 'مكتمل'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-blue-600">
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Active Services List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-fit">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">خدماتي النشطة</h3>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="p-4 space-y-4">
              {services.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-bold text-xs">
                  لم تقم بإضافة أي خدمات بعد
                </div>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-600 transition-all relative overflow-hidden">
                    {service.status === 'pending' && (
                      <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter">
                        تحت المراجعة
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-black text-slate-900 text-xs">{service.title}</h4>
                       <span className="text-xs font-black text-blue-600">{service.price} JOD</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold line-clamp-2 mb-3">{service.description}</p>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] bg-white px-2 py-1 rounded-lg border border-slate-200 font-black text-slate-400 uppercase tracking-widest">
                         {service.category}
                       </span>
                       <div className="flex items-center gap-1">
                         {service.status === 'active' ? (
                           <Check className="w-3.5 h-3.5 text-emerald-500" />
                         ) : (
                           <Settings className="w-3.5 h-3.5 text-slate-300 animate-spin-slow" />
                         )}
                         <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                           <Edit3 className="w-3.5 h-3.5" />
                         </button>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Service Modal */}
      <AnimatePresence>
        {showAddServiceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddServiceModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                   <div className="text-right">
                     <h2 className="text-xl font-black text-slate-900">تسجيل خدمة جديدة</h2>
                     <p className="text-xs font-bold text-slate-400 mt-1">املأ البيانات المطلوبة لنشر عرضك المهني</p>
                   </div>
                   <button onClick={() => setShowAddServiceModal(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all">
                     <X className="w-5 h-5" />
                   </button>
                </div>

                <form onSubmit={handleAddService} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mr-1">عنوان الخدمة</label>
                    <input 
                      required
                      type="text" 
                      className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm"
                      placeholder="مثلاً: تعديل سيرة ذاتية للأنظمة الإلكترونية"
                      value={newService.title}
                      onChange={e => setNewService({...newService, title: e.target.value})}
                    />
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mr-1">وصف موجز للمميزات</label>
                     <textarea 
                       required
                       className="w-full h-24 p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm resize-none"
                       placeholder="اشرح ما سيحصل عليه العميل..."
                       value={newService.description}
                       onChange={e => setNewService({...newService, description: e.target.value})}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mr-1">السعر (JOD)</label>
                      <input 
                        required
                        type="number" 
                        className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm"
                        placeholder="25"
                        value={newService.price}
                        onChange={e => setNewService({...newService, price: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mr-1">التصنيف</label>
                      <select 
                        required
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-xs appearance-none"
                        value={newService.category}
                        onChange={e => setNewService({...newService, category: e.target.value})}
                      >
                        <option value="تعديل سيرة ذاتية">تعديل سيرة ذاتية</option>
                        <option value="جلسة استشارية">جلسة استشارية</option>
                        <option value="تحسين LinkedIn">تحسين LinkedIn</option>
                        <option value="تدريب مقابلات">تدريب مقابلات</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingService}
                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all duration-300 shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    {isSubmittingService ? "جاري النشر..." : "نشر الخدمة الآن"}
                    <Check className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
