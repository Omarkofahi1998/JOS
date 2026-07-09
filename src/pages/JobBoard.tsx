import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  Search, MapPin, Briefcase, Bookmark, Bell, 
  ChevronRight, ExternalLink, Building2, Clock, 
  Filter, CheckCircle2, Star, Share2, MoreHorizontal,
  X, ArrowRight, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Job {
  id: string;
  title: string;
  company_name: string;
  logo_url?: string;
  location: string;
  type: string;
  posted_at: string;
  applicants_count?: number;
  salary?: string;
  description: string;
  requirements?: string[];
  is_easy_apply?: boolean;
}

export default function JobBoard() {
  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobList, setJobList] = useState<Job[]>([]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('posted_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setJobList(data);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setJobList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    type: 'دوام كامل',
    description: '',
    salary: '',
    experience: '',
    contact: ''
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session?.user) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) fetchUserProfile(session.user.id);
      else setUserProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setUserProfile(data);
  };

  const handlePostJobClick = () => {
    if (isLoggedIn) {
      setShowPostModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (authError) throw authError;

      // Verify role
      const { data: profile, error: profileError } = await supabase!
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError || profile?.role !== 'employer') {
        await supabase!.auth.signOut();
        throw new Error("عذراً، هذا الحساب غير مسجل كصاحب عمل.");
      }

      setShowAuthModal(false);
      setShowPostModal(true);
    } catch (err: any) {
      setAuthError(err.message || "حدث خطأ أثناء الدخول");
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: sessionData } = await supabase!.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const response = await fetch('/api/add-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newJob.title,
          company_name: newJob.company,
          location: newJob.location,
          type: newJob.type,
          description: newJob.description,
          salary_range: newJob.salary,
          experience: newJob.experience,
          contact: newJob.contact,
          is_active: false // Admin must approve
        })
      });

      if (!response.ok) {
        const text = await response.text();
        if (text.trim().startsWith("<") || text.trim().startsWith("The page")) {
          throw new Error("خطأ في الاتصال بالخادم. يرجى محاولة فتح التطبيق في علامة تبويب جديدة أو التأكد من الصلاحيات.");
        }
        try {
          const result = JSON.parse(text);
          throw new Error(result.error || "حدث خطأ أثناء الإضافة");
        } catch {
          throw new Error("حدث خطأ أثناء الإضافة: " + text.substring(0, 50));
        }
      }

      setShowPostModal(false);
      setShowSuccessMessage(true);
      setNewJob({ title: '', company: '', location: '', type: 'دوام كامل', description: '', salary: '', experience: '', contact: '' });
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    } catch (err: any) {
      alert("Error posting job: " + err.message);
    }
  };

  const handleJobClick = (id: string) => {
    setActiveJob(id);
    if (window.innerWidth < 1024) {
      setIsMobileDetailOpen(true);
    }
  };

  // --- Search & Recommendation Algorithm ---
  const normalizeArabic = (text: string) => {
    return text
      .replace(/[إأآا]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .trim()
      .toLowerCase();
  };

  const calculateJobScore = (job: Job, query: string) => {
    if (!query) return 1; // Default score if no search
    
    const normalizedQuery = normalizeArabic(query);
    const keywords = normalizedQuery.split(/\s+/).filter(k => k.length > 1);
    let score = 0;

    const fields = [
      { text: normalizeArabic(job.title), weight: 10 },
      { text: normalizeArabic(job.company_name), weight: 5 },
      { text: normalizeArabic(job.description), weight: 2 },
      { text: normalizeArabic(job.location), weight: 4 }
    ];

    keywords.forEach(keyword => {
      fields.forEach(field => {
        if (field.text.includes(keyword)) {
          score += field.weight;
          // Bonus for exact match in phrase
          if (field.text === keyword) score += field.weight * 2;
        }
      });
    });

    return score;
  };

  const publishedJobs = jobList
    .map(job => ({ ...job, matchScore: calculateJobScore(job, searchQuery) }))
    .filter(job => searchQuery === "" || job.matchScore > 0)
    .sort((a, b) => {
      // Sort by relevance score first, then by "postedAt" (simulated recency)
      if (searchQuery && b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      // Simple recency sort based on ID or simulated order
      return parseInt(b.id) - parseInt(a.id);
    });

  const selectedJobId = activeJob || (publishedJobs.length > 0 ? publishedJobs[0].id : null);
  const selectedJob = jobList.find(j => j.id === selectedJobId) || (jobList.length > 0 ? jobList[0] : null);

  return (
    <div className="min-h-screen bg-[#F3F2EF] pb-10" dir="rtl">
      {/* LinkedIn Search Header */}
      <div className="bg-white border-b border-[#E0E0E0] sticky top-[70px] md:top-[86px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-2 md:py-3 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-grow flex items-center bg-[#EDF3F8] rounded h-10 px-3 border border-transparent focus-within:border-[#0A66C2] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#0A66C2] transition-all w-full">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input 
              type="text" 
              placeholder="ابحث عن وظيفة في JOin..."
              className="bg-transparent border-none outline-none w-full p-2 text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handlePostJobClick}
              className="bg-[#0A66C2] text-white px-8 py-2 rounded-full font-bold text-sm hover:bg-[#004182] transition-all whitespace-nowrap flex-grow md:flex-none h-10"
            >
              نشر وظيفة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar - Profile Summary */}
        <aside className="hidden lg:block lg:col-span-3 space-y-2">
          <div className="bg-white rounded-lg border border-[#E0E0E0] overflow-hidden shadow-sm">
            <div className="h-14 bg-[#A0B1C0]" />
            <div className="px-3 pb-4">
               <div className="relative -mt-10 mb-4">
                  <div className="w-16 h-16 bg-white rounded-full p-1 border border-[#E0E0E0] mx-auto overflow-hidden">
                     <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center text-slate-400 font-black text-xl uppercase">
                        {userProfile?.full_name?.charAt(0) || userProfile?.email?.charAt(0) || "U"}
                     </div>
                  </div>
               </div>
               <div className="text-center mb-4">
                  <h3 className="font-bold text-slate-900 hover:underline cursor-pointer">
                    {userProfile?.full_name || "اسم المستخدم"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {userProfile?.role === 'admin' ? 'مدير النظام' : userProfile?.role === 'instructor' ? 'مدرب معتمد' : userProfile?.role === 'employer' ? 'صاحب عمل' : 'مستخدم المنصة'}
                  </p>
               </div>
               <div className="border-t border-[#E0E0E0] py-3 space-y-1">
                  <div className="flex justify-between text-xs px-1">
                     <span className="text-slate-500 font-bold">من شاهد ملفك الشخصي</span>
                     <span className="text-[#0A66C2] font-bold">45</span>
                  </div>
                  <div className="flex justify-between text-xs px-1">
                     <span className="text-slate-500 font-bold">مشاهدات لآخر منشور</span>
                     <span className="text-[#0A66C2] font-bold">120</span>
                  </div>
               </div>
               <div className="border-t border-[#E0E0E0] pt-3">
                  <button className="w-full flex items-center gap-2 p-1 text-slate-600 hover:bg-slate-50 transition-all text-right">
                     <Bookmark className="w-4 h-4 text-slate-400" />
                     <span className="text-xs font-bold">عناصري المحفوظة</span>
                  </button>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E0E0E0] p-3 shadow-sm">
             <h4 className="text-xs font-bold text-slate-900 mb-4">تنبيهات الوظائف</h4>
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-50 text-[#0A66C2] rounded font-bold text-[10px]">React</div>
                   <div className="flex-grow text-[11px] font-bold text-slate-600">وظائف React في عمان</div>
                   <Bell className="w-3.5 h-3.5 text-slate-400" />
                </div>
             </div>
          </div>
        </aside>

        {/* Main Feed - Jobs */}
        <main className="lg:col-span-5 space-y-2">
           <div className="bg-white rounded-lg border border-[#E0E0E0] shadow-sm overflow-hidden mb-4">
              <div className="p-3 border-b border-[#E0E0E0] flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">الوظائف الموصى بها لك</h2>
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </div>
              
              <div className="divide-y divide-[#E0E0E0]">
                {publishedJobs.map((job) => (
                  <div 
                    key={job.id}
                    onClick={() => handleJobClick(job.id)}
                    className={`p-4 cursor-pointer transition-colors relative ${selectedJobId === job.id ? 'bg-[#EDF3F8]' : 'bg-white hover:bg-[#F9F9F9]'}`}
                  >
                    <div className="flex gap-4">
                      <div className="w-12 h-12 flex-shrink-0">
                        <img src={job.logo_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=100&auto=format&fit=crop"} alt={job.company_name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#0A66C2] hover:underline leading-tight truncate">{job.title}</h3>
                        </div>
                        <div className="text-xs text-slate-900 mt-1 font-medium">{job.company_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{job.location} ({job.type})</div>
                        
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                           <span className="text-emerald-600 font-bold">نشطة</span>
                           <span>•</span>
                           <span>{new Date(job.posted_at).toLocaleDateString('ar-JO')} • {job.applicants_count || 0} متقدم</span>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-slate-900 transition-colors shrink-0">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {publishedJobs.length === 0 && !loading && (
                   <div className="p-10 text-center text-slate-400 font-bold">
                      لا توجد وظائف متاحة حالياً
                   </div>
                )}
              </div>
           </div>
        </main>

        {/* Right Pane - Details */}
        <aside className="lg:col-span-4 sticky top-[128px] h-[calc(100vh-150px)] hidden lg:block overflow-hidden">
           {selectedJob ? (
             <AnimatePresence mode="wait">
               <motion.div 
                 key={selectedJob.id}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="bg-white rounded-lg border border-[#E0E0E0] shadow-sm h-full flex flex-col"
               >
                  <div className="p-5 border-b border-[#E0E0E0]">
                     <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 border border-[#E0E0E0] rounded overflow-hidden">
                           <img src={selectedJob.logo_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=100&auto=format&fit=crop"} alt={selectedJob.company_name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex gap-1">
                           <button className="p-2 hover:bg-slate-50 rounded-full text-slate-500 transition-all"><Share2 className="w-5 h-5" /></button>
                           <button className="p-2 hover:bg-slate-50 rounded-full text-slate-500 transition-all"><Bookmark className="w-5 h-5" /></button>
                        </div>
                     </div>
  
                     <h2 className="text-lg font-bold text-slate-900 leading-tight mb-2 hover:underline cursor-pointer">{selectedJob.title}</h2>
                     <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-600 mb-4">
                        <span className="text-slate-900 hover:underline cursor-pointer">{selectedJob.company_name}</span>
                        <span>•</span>
                        <span>{selectedJob.location}</span>
                        <span>•</span>
                        <span className="text-slate-400">{new Date(selectedJob.posted_at).toLocaleDateString('ar-JO')} • {selectedJob.applicants_count || 0} متقدم</span>
                     </div>
  
                     <div className="flex items-center gap-2">
                        <button className="flex-grow bg-[#0A66C2] text-white h-9 rounded-full font-bold text-sm hover:bg-[#004182] transition-all flex items-center justify-center gap-1.5 px-6">
                          التقدم للوظيفة
                        </button>
                        <button className="h-9 px-4 border border-[#0A66C2] text-[#0A66C2] rounded-full font-bold text-sm hover:bg-[#EDF3F8] transition-all">حفظ</button>
                     </div>
                  </div>
  
                  <div className="flex-grow overflow-y-auto p-5 custom-scrollbar space-y-6">
                     <section>
                        <h3 className="text-sm font-bold text-slate-900 mb-3">تفاصيل الوظيفة</h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="block text-[10px] text-slate-500 font-bold uppercase">الخبرة المطلوبة</span>
                            <span className="text-sm font-bold text-slate-800">{selectedJob.experience || 'غير محدد'}</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="block text-[10px] text-slate-500 font-bold uppercase">الراتب المتوقع</span>
                            <span className="text-sm font-bold text-slate-800">{selectedJob.salary || 'حسب الكفاءة'}</span>
                          </div>
                        </div>
                        
                        <h3 className="text-sm font-bold text-slate-900 mb-3">عن الوظيفة</h3>
                        <p className="text-xs text-slate-600 leading-relaxed font-bold whitespace-pre-wrap">
                          {selectedJob.description}
                        </p>
                     </section>
  
                     <section>
                        <h3 className="text-sm font-bold text-slate-900 mb-3">معلومات التواصل</h3>
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs font-bold text-[#0A66C2]">
                          {selectedJob.contact || 'الرجاء الضغط على "تقديم" لمعرفة المزيد'}
                        </div>
                     </section>
  
                     <section>
                        <div className="bg-slate-50 border border-[#E0E0E0] rounded-lg p-3">
                           <div className="flex items-center gap-3">
                              <Building2 className="w-5 h-5 text-slate-400" />
                              <div>
                                 <div className="text-xs font-bold text-slate-900">حول {selectedJob.company_name}</div>
                                 <div className="text-[10px] text-slate-500 font-bold">تكنولوجيا المعلومات والخدمات • 201-500 موظف</div>
                              </div>
                           </div>
                        </div>
                     </section>
                  </div>
               </motion.div>
             </AnimatePresence>
           ) : (
             <div className="bg-white rounded-lg border border-[#E0E0E0] shadow-sm h-full flex items-center justify-center p-10 text-center text-slate-400 font-bold">
               {loading ? 'جاري التحميل...' : 'اختر وظيفة لعرض التفاصيل'}
             </div>
           )}
        </aside>

        {/* Mobile Detail Modal (Drawer) */}
        <AnimatePresence>
          {isMobileDetailOpen && selectedJob && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileDetailOpen(false)}
                className="fixed inset-0 bg-black/50 z-[100] lg:hidden"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 h-[90vh] bg-white rounded-t-xl z-[101] lg:hidden flex flex-col"
              >
                 <div className="flex items-center justify-between p-4 border-b">
                    <button onClick={() => setIsMobileDetailOpen(false)}><X className="w-6 h-6 text-slate-600" /></button>
                    <div className="flex gap-4">
                       <Share2 className="w-5 h-5 text-slate-600" />
                       <Bookmark className="w-5 h-5 text-slate-600" />
                    </div>
                 </div>
                 <div className="flex-grow overflow-y-auto p-4">
                    <div className="flex flex-col items-center text-center mb-6">
                       <img src={selectedJob.logo_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=100&auto=format&fit=crop"} alt={selectedJob.company_name} className="w-16 h-16 object-contain border rounded mb-3" />
                       <h2 className="text-xl font-bold">{selectedJob.title}</h2>
                       <p className="text-blue-600 font-bold mt-1">{selectedJob.company_name}</p>
                       <p className="text-slate-500 text-sm">{selectedJob.location}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">{selectedJob.description}</p>
                    
                    <div className="mt-10 space-y-4">
                       <button className="w-full bg-[#0A66C2] text-white py-3 rounded-full font-bold">تقديم</button>
                       <button className="w-full border border-[#0A66C2] text-[#0A66C2] py-3 rounded-full font-bold">حفظ</button>
                    </div>
                 </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Auth Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-black text-slate-800">تسجيل دخول الشركات</h3>
                  <button onClick={() => setShowAuthModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                
                <form onSubmit={handleLogin} className="p-8 space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-[#0A66C2]" />
                    </div>
                    <p className="text-sm text-slate-500 font-bold">يجب تسجيل الدخول بحساب المنشأة لنشر وظيفة جديدة</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 mr-1 text-right">البريد الإلكتروني للشركة</label>
                      <input 
                        required 
                        type="email" 
                        placeholder="example@company.com" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0A66C2] outline-none font-bold text-sm text-right" 
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 mr-1 text-right">كلمة المرور</label>
                      <input 
                        required 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0A66C2] outline-none font-bold text-sm text-right" 
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
                      {authError}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={authLoading}
                    className="w-full bg-[#0A66C2] text-white py-3.5 rounded-2xl font-black hover:bg-[#004182] transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                  >
                    {authLoading ? "جاري الدخول..." : "دخول ونشر الوظيفة"}
                  </button>

                  <div className="pt-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-bold mb-3">ليس لديك حساب منشأة؟</p>
                    <Link 
                      to="/company-registration"
                      className="text-[#0A66C2] font-black text-sm hover:underline"
                    >
                      سجل شركتك الآن مجاناً
                    </Link>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Post Job Modal */}
        <AnimatePresence>
          {showPostModal && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPostModal(false)}
                className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white rounded-xl shadow-2xl z-[201] overflow-hidden"
              >
                <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                  <h2 className="font-bold text-slate-900">نشر وظيفة جديدة</h2>
                  <button onClick={() => setShowPostModal(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <form onSubmit={handlePostJob} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">مسمى الوظيفة *</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] outline-none text-sm"
                        placeholder="مثلاً: مطور برمجيات"
                        value={newJob.title}
                        onChange={e => setNewJob({...newJob, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">اسم الشركة *</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] outline-none text-sm"
                        placeholder="اسم شركتك"
                        value={newJob.company}
                        onChange={e => setNewJob({...newJob, company: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">الموقع *</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] outline-none text-sm"
                        placeholder="عمان، الأردن"
                        value={newJob.location}
                        onChange={e => setNewJob({...newJob, location: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">الراتب (اختياري)</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] outline-none text-sm"
                        placeholder="مثلاً: 800 - 1000 JOD"
                        value={newJob.salary}
                        onChange={e => setNewJob({...newJob, salary: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">الخبرة المطلوبة *</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] outline-none text-sm"
                        placeholder="مثلاً: سنتين"
                        value={newJob.experience}
                        onChange={e => setNewJob({...newJob, experience: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">نوع الدوام</label>
                      <select 
                        className="w-full p-2 border rounded focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] outline-none text-sm bg-white"
                        value={newJob.type}
                        onChange={e => setNewJob({...newJob, type: e.target.value})}
                      >
                        <option>دوام كامل</option>
                        <option>دوام جزئي</option>
                        <option>عن بعد</option>
                        <option>تدريب</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">معلومات التواصل *</label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] outline-none text-sm"
                      placeholder="رقم هاتف أو بريد إلكتروني"
                      value={newJob.contact}
                      onChange={e => setNewJob({...newJob, contact: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">الوصف الوظيفي *</label>
                    <textarea 
                      rows={4}
                      required
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] outline-none text-sm"
                      placeholder="اكتب تفاصيل الوظيفة هنا..."
                      value={newJob.description}
                      onChange={e => setNewJob({...newJob, description: e.target.value})}
                    />
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4">
                    <p className="text-[11px] text-yellow-800 font-bold text-center">
                      ملاحظة: سيتم مراجعة إعلانك من قبل الإدارة قبل النشره للعامة.
                    </p>
                  </div>
                  <button type="submit" className="w-full bg-[#0A66C2] text-white py-2.5 rounded-full font-bold text-sm hover:bg-[#004182] transition-all">
                    إرسال للمراجعة
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-4 rounded-xl shadow-2xl z-[300] flex items-center gap-4 border border-slate-700 min-w-[320px]"
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-none">تم إرسال الوظيفة بنجاح!</h4>
                <p className="text-[10px] text-slate-400 mt-1">طلبك قيد المراجعة حالياً، سنقوم بنشره قريباً.</p>
              </div>
              <button onClick={() => setShowSuccessMessage(false)} className="ml-2 hover:bg-slate-800 p-1 rounded-full">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

