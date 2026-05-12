import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  BookOpen, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  User,
  LogOut,
  Loader2,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { motion } from "motion/react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      fetchData(session.user.id);
    });
  }, [navigate]);

  async function fetchData(uid: string) {
    try {
      setLoading(true);
      
      // Fetch Profile
      const { data: prof } = await supabase!.from('profiles').select('*').eq('id', uid).single();
      if (prof) {
        setProfile(prof);
        // If not a student/user, might want to redirect? 
        // But users can be both, let's just show student view here.
      }

      // Fetch All Bookings (Courses & Services)
      const { data: bookings } = await supabase!
        .from('user_bookings')
        .select(`
          *,
          products:item_id (title),
          services:item_id (title)
        `)
        .eq('client_id', uid)
        .order('created_at', { ascending: false });
      
      if (bookings) {
        setEnrollments(bookings.filter((b: any) => b.item_type === 'course'));
        setServiceRequests(bookings.filter((b: any) => b.item_type === 'service'));
      }
      
    } catch (err) {
      console.error("Error fetching student data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Profile Section */}
      <div className="bg-white border-b border-slate-200 pt-32 pb-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 text-right">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 overflow-hidden border-4 border-white shadow-2xl">
              <img 
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'Student'}&background=random`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center border-4 border-white">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
              <Sparkles className="w-3 h-3" />
              حساب متدرب معتمد
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">{profile?.full_name}</h1>
            <p className="text-slate-500 font-bold flex items-center justify-center md:justify-end gap-2">
              <span>{user?.email}</span>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              <span>مرحبا بك في مساحتك التعليمية</span>
            </p>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-2xl font-black text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Quick Info */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
            <h3 className="font-black text-slate-900 mb-6 text-lg">ملخص النشاط</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
                <div className="text-right">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">الدورات المسجلة</div>
                  <div className="text-xl font-black text-indigo-600">{enrollments.length}</div>
                </div>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
                <div className="text-right">
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">طلبات الخدمات</div>
                  <div className="text-xl font-black text-emerald-600">{serviceRequests.length}</div>
                </div>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <h3 className="font-black text-lg mb-4 relative z-10">هل تحتاج مساعدة؟</h3>
            <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6 relative z-10">
              فريق الدعم الفني متواجد لمساعدتك في أي استفسار يخص الدورات أو الخدمات المهنية.
            </p>
            <button className="w-full h-12 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all relative z-10">
              تواصل معنا
            </button>
          </div>
        </div>

        {/* Right Column: Activity Lists */}
        <div className="lg:col-span-2 space-y-8 text-right">
          {/* Services Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate('/services')} className="text-xs font-black text-red-600 flex items-center gap-1 hover:gap-2 transition-all">
                <ArrowLeft className="w-3 h-3" />
                استكشف الخدمات
              </button>
              <h3 className="text-xl font-black text-slate-900">طلبات الخدمات المهنية</h3>
            </div>

            {serviceRequests.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-300 text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-bold">لا يوجد طلبات خدمات حالياً</p>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceRequests.map((req) => (
                  <motion.div 
                    key={req.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-red-200 transition-all group"
                  >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-center md:justify-end gap-3 mb-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            req.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-orange-50 text-orange-600 border-orange-100'
                          }`}>
                            {req.status === 'completed' ? 'مكتمل' : req.status === 'processing' ? 'قيد العمل' : 'بانتظار المراجعة'}
                          </span>
                          <h4 className="font-black text-slate-900">
                            {req.services?.title || req.item_type}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 font-bold">طلب في: {new Date(req.created_at).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <div className="text-center md:text-left">
                        <div className="text-lg font-black text-slate-900">{req.amount} JOD</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">تكلفة الخدمة</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Courses Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate('/marketplace')} className="text-xs font-black text-red-600 flex items-center gap-1 hover:gap-2 transition-all">
                <ArrowLeft className="w-3 h-3" />
                تصفح الدورات
              </button>
              <h3 className="text-xl font-black text-slate-900">دوراتي التدريبية</h3>
            </div>

            {enrollments.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-300 text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-bold mb-4">لم تقم بالتسجيل في أي دورة بعد</p>
                <button 
                  onClick={() => navigate('/marketplace')}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-red-600 transition-all"
                >
                  تصفح المتجر الآن
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((enr) => (
                  <motion.div 
                    key={enr.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-center gap-6 text-right">
                       <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                          <BookOpen className="w-6 h-6" />
                       </div>
                       <div className="flex-1">
                          <h4 className="font-black text-slate-900 mb-1">{enr.products?.title || 'دورة تدريبية'}</h4>
                          <div className="flex items-center justify-end gap-3">
                             <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                               enr.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                             }`}>
                                {enr.status === 'active' ? 'نشط' : 'قيد المراجعة'}
                             </span>
                             <span className="text-[10px] text-slate-400 font-bold">{new Date(enr.created_at).toLocaleDateString('ar-EG')}</span>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
