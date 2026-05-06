import { ArrowLeft, BookOpen, CheckCircle, Clock, Star, Users, Sparkles, HelpCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
    trainees: '2,500+',
    questions: '3,200+',
    exams: '450+',
    majors: '18+'
  });

  const [featuresList, setFeaturesList] = useState<Feature[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;
      
      try {
        // Fetch Settings
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

        // Fetch Stats
        const { data: visitorData } = await supabase.from('visitor_stats').select('count', { count: 'exact' }).eq('id', 1).single();
        const { count: qCount, data: qData } = await supabase.from('questions').select('major', { count: 'exact' });
        const { count: fCount } = await supabase.from('question_files').select('*', { count: 'exact', head: true });

        setStats({
          trainees: (visitorData?.count || 2500).toLocaleString() + '+',
          questions: (qCount || 0).toLocaleString() + '+',
          exams: (fCount || 0).toLocaleString() + '+',
          majors: Array.from(new Set(qData?.map(q => q.major) || [])).length + '+'
        });

        // Fetch Features
        const { data: featuresData } = await supabase
          .from('features')
          .select('*')
          .order('order_index', { ascending: true });
        
        if (featuresData) {
          setFeaturesList(featuresData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }
    fetchData();
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
    <div className="space-y-20 pb-20 bg-slate-50">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center bg-white border-b border-slate-200 overflow-hidden">
        {/* Abstract National Colors Decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-red-600/5 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-green-600/5 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-right">
              <div className="flex items-center gap-2 mb-6 justify-end">
                <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  JO Students
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 text-slate-900 tracking-tight">
                {settings.hero_title}
              </h1>

              <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed font-medium md:max-w-lg mr-auto">
                {settings.hero_subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Link
                  to="/mock-exams"
                  className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                >
                  ابدأ التدريب
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <Link
                  to="/services"
                  className="bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-800 transition-all shadow-lg shadow-green-700/10"
                >
                  الخدمات المهنية
                </Link>
              </div>
            </div>

            <div className="mt-12 lg:mt-0 relative text-center">
              <div className="relative inline-block w-full max-w-xl">
                <img 
                  src={settings.hero_image} 
                  alt="قاعة امتحانات هيئة الخدمة والإدارة العامة" 
                  className="w-full h-auto object-cover rounded-3xl shadow-2xl transition-all duration-500 hover:scale-[1.01]"
                  referrerPolicy="no-referrer"
                />
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 bg-white p-10 rounded-2xl border border-slate-200 shadow-sm">
           {[
             { label: 'متدرب نشط', val: stats.trainees },
             { label: 'سؤال تدريبي', val: stats.questions },
             { label: 'محاكاة كاملة', val: stats.exams },
             { label: 'تخصص مهني', val: stats.majors }
           ].map((stat, i) => (
             <div key={i} className="text-center">
               <div className="text-2xl md:text-3xl font-black text-slate-900 mb-1">{stat.val}</div>
               <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">{stat.label}</div>
             </div>
           ))}
           <div className="text-center col-span-2 lg:col-span-1 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-r border-slate-100 flex flex-col justify-center">
             <div className="text-2xl md:text-3xl font-black text-red-600 mb-1 animate-pulse">
               {stats.trainees}
             </div>
             <div className="text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1">
               <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
               زوار الموقع (حقيقي)
             </div>
           </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
        <div className="mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-4">أدوات تفوقك</h2>
          <div className="w-16 h-1 bg-red-600 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresList.map((feature, index) => (
            <div
              key={feature.id}
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-right group"
            >
              <div className={`w-12 h-12 ${feature.color_class} rounded-xl flex items-center justify-center mb-6`}>
                {getIcon(feature.icon_name, feature.color_class)}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed mb-6 text-sm font-medium">
                {feature.description}
              </p>
              <Link
                to={feature.link_path}
                className="inline-flex items-center gap-2 text-red-600 font-bold text-sm"
              >
                اكتشف المزيد
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          ))}
          {featuresList.length === 0 && !supabase && (
             <div className="col-span-full p-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-3xl">
                بانتظار ربط قاعدة البيانات لعرض الأدوات...
             </div>
          )}
        </div>
      </section>

      {/* Simple CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden text-white">
          <h2 className="text-3xl md:text-5xl font-black mb-6">استعد لمستقبلك المهني اليوم</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            انضم إلى آلاف المتقدمين الناجحين وابدأ التدريب الآن مع بنك الأسئلة الأحدث والخدمات الأكثر احترافية.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/mock-exams" className="bg-red-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-red-600/20">التسجيل في الامتحانات</Link>
            <Link to="/services" className="bg-green-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-green-600/20">تواصل معنا</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
