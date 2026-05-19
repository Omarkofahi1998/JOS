import { ArrowLeft, BookOpen, CheckCircle, Clock, Star, Users, Sparkles, HelpCircle, ShoppingCart, Megaphone } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";

interface Feature {
  id: number;
  title: string;
  description: string;
  icon_name: string;
  color_class: string;
  link_path: string;
}

export default function Home() {
  const [settings, setSettings] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_image: '',
    success_rate: '92'
  });

  const [stats, setStats] = useState({
    trainees: '...', // This will now represent Total Visitors
    questions: '...',
    exams: '...',
    majors: '...'
  });

  const [onlineCount, setOnlineCount] = useState<number>(0);

  const [featuresList, setFeaturesList] = useState<Feature[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<any>(null);

  useEffect(() => {
    // Visitor tracking is now handled globally in App.tsx 
    // This effect is kept for any specific home-only initialization if needed
  }, []);

  useEffect(() => {
    async function fetchAnnouncements() {
      if (!supabase) return;
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'banner')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data[0]) {
        setActiveAnnouncement(data[0]);
      }
    }
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    // Real-time tracking for active trainees
    if (supabase) {
      const channel = supabase.channel('online_users', {
        config: {
          presence: {
            key: 'user-' + Math.random().toString(36).substring(7),
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          // Total keys in state = total online users
          // We add a small offset or base if it's just 1 to make it look "active" 
          // but the user requested "actual". Let's show actual + a small randomization if needed, 
          // or just actual. Actually, many apps show actual.
          setOnlineCount(Object.keys(state).length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ online_at: new Date().toISOString() });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  useEffect(() => {
    async function fetchCriticalData() {
      if (!supabase) return;
      try {
        const { data: settingsData } = await supabase.from('site_settings').select('key, value');
        if (settingsData) {
          const newSettings: any = { ...settings };
          settingsData.forEach(item => {
            if (newSettings.hasOwnProperty(item.key)) {
              newSettings[item.key] = item.value;
            }
          });
          setSettings(newSettings);
        }
      } catch (err) {
        console.error("Critical fetch error:", err);
      }
    }

    async function fetchNonCriticalData() {
      if (!supabase) return;
      try {
        const [visitorRes, questionsRes, filesRes, featuresRes] = await Promise.all([
          supabase.from('visitor_stats').select('count', { count: 'exact' }).eq('id', 1).single(),
          supabase.from('questions').select('major'),
          supabase.from('question_files').select('*', { count: 'exact', head: true }),
          supabase.from('features').select('*').order('order_index', { ascending: true })
        ]);

        setStats({
          trainees: (visitorRes.data?.count || 0).toLocaleString() + '+',
          questions: (questionsRes.data?.length || 0).toLocaleString() + '+',
          exams: (filesRes.count || 0).toLocaleString() + '+',
          majors: Array.from(new Set(questionsRes.data?.map(q => q.major) || [])).length + '+'
        });

        if (featuresRes.data) {
          setFeaturesList(featuresRes.data);
        }
      } catch (err) {
        console.error("Non-critical fetch error:", err);
      }
    }

    fetchCriticalData().then(() => {
      setTimeout(fetchNonCriticalData, 100);
    });
  }, []);

  const getIcon = (name: string, colorClass: string) => {
    const IconComponent = (LucideIcons as any)[name];
    if (!IconComponent) return <HelpCircle className="w-6 h-6 text-slate-400" />;
    
    // Extract text color from color class if possible or use a default
    // e.g. "bg-red-50" -> we might want "text-red-600"
    const colorMap: Record<string, string> = {
      'bg-red-50': 'text-red-600',
      'bg-blue-50': 'text-blue-600',
      'bg-green-50': 'text-emerald-600',
      'bg-amber-50': 'text-amber-600',
      'bg-indigo-50': 'text-indigo-600',
      'bg-purple-50': 'text-purple-600',
      'bg-slate-50': 'text-slate-600'
    };
    
    const textColor = colorMap[colorClass] || 'text-slate-600';
    return <IconComponent className={`w-6 h-6 ${textColor}`} />;
  };

  return (
    <div className="space-y-12 pb-12 bg-slate-50">
      {/* Dynamic Announcement Banner */}
      {activeAnnouncement && (
        <div className="bg-red-600 text-white overflow-hidden relative group">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 text-center md:text-right relative z-10">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 animate-bounce" />
              <span className="font-black text-sm md:text-base">{activeAnnouncement.title}</span>
            </div>
            <p className="text-xs md:text-sm font-bold text-red-50 max-w-2xl">{activeAnnouncement.content}</p>
            {activeAnnouncement.button_text && (
              <a 
                href={activeAnnouncement.button_url || "#"} 
                className="bg-white text-red-600 px-6 py-1.5 rounded-full text-xs font-black hover:bg-slate-900 hover:text-white transition-all shadow-lg"
              >
                {activeAnnouncement.button_text}
              </a>
            )}
          </div>
          {/* Decorative shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] animate-[shimmer_3s_infinite]" />
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[450px] md:h-[550px] flex items-center bg-white border-b border-slate-200 overflow-hidden py-10 md:py-0">
        {/* Abstract National Colors Decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-red-600/5 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-green-600/5 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-right">
              <div className="flex items-center gap-2 mb-6 justify-center md:justify-end">
                <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  JO Students
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 text-slate-900 tracking-tight">
                {settings.hero_title}
              </h1>

              <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed font-medium max-w-sm md:max-w-lg mx-auto md:mr-0 md:ml-0">
                {settings.hero_subtitle}
              </p>

              <div className="flex flex-col sm:flex-row-reverse flex-wrap gap-3 md:gap-4 justify-center md:justify-start">
                <Link
                  to="/mock-exams"
                  className="w-full sm:w-auto bg-red-600 text-white px-6 py-3.5 rounded-xl font-bold text-base md:text-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5" />
                  ابدأ التدريب
                </Link>
                <Link
                  to="/marketplace"
                  className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold text-base md:text-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95"
                >
                  <ShoppingCart className="w-5 h-5 ml-1" />
                  الأكاديمية المهنية
                </Link>
                <Link
                  to="/services"
                  className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold text-base md:text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  <Sparkles className="w-5 h-5 ml-1" />
                  الخدمات المهنية
                </Link>
              </div>
            </div>

            <div className="mt-12 lg:mt-0 relative text-center">
              <div className="relative inline-block w-full max-w-xl">
                {settings.hero_image && (
                  <img 
                    src={settings.hero_image} 
                    alt="قاعة امتحانات عامة" 
                    className="w-full h-auto object-cover rounded-3xl shadow-2xl transition-all duration-500 hover:scale-[1.01]"
                    referrerPolicy="no-referrer"
                    fetchPriority="high"
                    loading="eager"
                    width="600"
                    height="400"
                  />
                )}
                <div className="absolute -bottom-6 -left-6 bg-white p-4 md:p-6 rounded-2xl shadow-xl border border-slate-100 text-center min-w-[120px] md:min-w-[150px]">
                  <div className="text-xl md:text-2xl font-black text-red-600">{settings.success_rate}%+</div>
                  <div className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">نسبة النجاح</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 bg-white p-4 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
           {[
             { label: 'متدرب نشط', val: (onlineCount > 0 ? onlineCount : 1).toLocaleString() },
             { label: 'سؤال تدريبي', val: stats.questions },
             { label: 'محاكاة كاملة', val: stats.exams },
             { label: 'تخصص مدعوم', val: stats.majors }
           ].map((stat, i) => (
             <div key={i} className="text-center">
               <div className="text-2xl md:text-3xl font-black text-slate-900 mb-1">{stat.val}</div>
               <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">{stat.label}</div>
             </div>
           ))}
           <div className="text-center col-span-2 lg:col-span-1 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-r border-slate-100 flex flex-col justify-center">
             <div className="text-2xl md:text-3xl font-black text-red-600 mb-1 font-mono">
               {stats.trainees}
             </div>
             <div className="text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1">
               <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
               زوار الموقع 
             </div>
           </div>
        </div>
      </section>

      {/* Tools of Success - Compact Vertical Ticker */}
      <section className="bg-white py-8 md:py-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* Header Part */}
          <div className="w-full md:w-1/3 text-center md:text-right">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black mb-3"
            >
              <Sparkles className="w-3 h-3" />
              <span>أدواتك للتميز</span>
            </motion.div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-2">أدوات النجاح</h2>
            <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed max-w-sm mx-auto md:mr-0">
              تعرف على أهم الأدوات التي صممناها لمساعدتك في رحلتك التعليمية.
            </p>
          </div>

          {/* Ticker Part */}
          <div className="w-full md:w-2/3">
            <div 
              className="bg-slate-50 rounded-[2rem] border border-slate-100 p-2 md:p-3 overflow-hidden h-32 md:h-32 relative group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {featuresList.length > 0 ? (
                <div className="h-full">
                  <motion.div
                    animate={{ 
                      y: isPaused ? undefined : ["0%", `-${(featuresList.length - 1) * 100}%`, "0%"]
                    }}
                    transition={{
                      duration: featuresList.length * 4,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                    className="flex flex-col h-full"
                  >
                    {featuresList.map((feature, idx) => (
                      <div 
                        key={`${feature.id}-${idx}`} 
                        className="h-full flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-2"
                        style={{ height: "100%" }}
                      >
                        <div className="flex items-center gap-4 md:gap-6 text-right w-full">
                          <div className={`w-12 h-12 md:w-14 md:h-14 ${feature.color_class} rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg shadow-current/10 group-hover:scale-105 transition-transform`}>
                            {getIcon(feature.icon_name, "w-6 h-6")}
                          </div>
                          <div className="min-w-0 flex-grow">
                            <h3 className="text-base md:text-xl font-black text-slate-900 mb-0.5 md:mb-1 truncate">{feature.title}</h3>
                            <p className="text-[10px] md:text-sm text-slate-500 font-medium line-clamp-2 leading-snug">
                              {feature.description}
                            </p>
                          </div>
                          <Link 
                            to={feature.link_path}
                            className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-red-600 font-black text-xs hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm hidden sm:flex items-center gap-2"
                          >
                            <span>استكشف</span>
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </Link>
                          <Link 
                            to={feature.link_path}
                            className="sm:hidden bg-white p-3 rounded-xl border border-slate-200 text-red-600 shadow-sm"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="flex items-center gap-4 px-6 opacity-30">
                    <div className="w-12 h-12 bg-slate-200 rounded-2xl animate-pulse" />
                    <div className="space-y-2">
                       <div className="w-32 h-4 bg-slate-200 rounded-full animate-pulse" />
                       <div className="w-48 h-3 bg-slate-200 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Fade effects */}
              <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-10" />
            </div>
          </div>
        </div>
      </section>


      {/* Join our Experts Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm group hover:border-red-600 transition-all">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">هل أنت مدرب معتمد؟</h3>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
              انضم إلى نخبة المدربين في الأردن، وقدم دوراتك واختباراتك لآلاف الطلاب والمهنيين المتحمسين للتعلم.
            </p>
            <Link 
              to="/instructor-registration" 
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all"
            >
              قدم طلب اعتماد مدرب
              <ArrowLeft className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm group hover:border-blue-600 transition-all">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">خبير في الخدمات المهنية؟</h3>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
              ساعد الآخرين في تحسين سيرهم الذاتية، الاستعداد للمقابلات، أو التخطيط لمسارهم الوظيفي كخبير معتمد.
            </p>
            <Link 
              to="/service-provider-registration" 
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all"
            >
              انضم كخبير مهني
              <ArrowLeft className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-6 md:p-12 text-center relative overflow-hidden text-white">
          <h2 className="text-3xl md:text-5xl font-black mb-4">استعد لمستقبلك المهني اليوم</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            انضم إلى آلاف المتقدمين الناجحين وابدأ التدريب الآن مع بنك الأسئلة الأحدث والخدمات الأكثر احترافية.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/mock-exams" className="bg-red-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-red-600/20">التدريب على الامتحانات</Link>
            <Link to="/contact" className="bg-green-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-green-600/20">تواصل معنا</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
