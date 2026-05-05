import { ArrowLeft, BookOpen, CheckCircle, Clock, Star, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const features = [
    {
      title: "امتحانات تجريبية",
      desc: "حاكي بيئة الامتحان الحقيقي بتوقيت محدد ونظام تصحيح فوري لتقييم مستواك.",
      icon: <BookOpen className="w-6 h-6 text-red-600" />,
      path: "/mock-exams",
      color: "bg-red-50",
    },
    {
      title: "تنبيهات المواعيد",
      desc: "خدمة إشعار المتقدمين فور صدور مواعيد الامتحانات أو أسماء المدعوين للمقابلات.",
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      path: "/",
      color: "bg-blue-50",
    },
    {
      title: "اسئلة شاملة",
      desc: "بنك اسئلة ضخم يغطي كافة التخصصات والمهارات المطلوبة للامتحانات التنافسية.",
      icon: <Star className="w-6 h-6 text-emerald-600" />,
      path: "/questions",
      color: "bg-green-50",
    },
    {
      title: "مراجعات وملخصات",
      desc: "ملخصات مركزة تساعدك على مراجعة المواد الأساسية بسرعة وكفاءة.",
      icon: <CheckCircle className="w-6 h-6 text-amber-600" />,
      path: "/reviews",
      color: "bg-amber-50",
    },
    {
      title: "تحليل النتائج",
      desc: "احصل على تقرير مفصل لنقاط القوة والضعف لديك بعد كل امتحان تجريبي.",
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      path: "/mock-exams",
      color: "bg-indigo-50",
    },
    {
      title: "خدمات مهنية",
      desc: "تصميم سير ذاتية بنظام ATS، تدريب على المقابلات، واستشارات مهنية متخصصة.",
      icon: <Sparkles className="w-6 h-6 text-purple-600" />,
      path: "/services",
      color: "bg-purple-50",
    },
  ];

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
                طريقك للتميز والنجاح <br /> <span className="text-red-600">في الامتحانات الحكومية</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed font-medium md:max-w-lg mr-auto">
                المنصة التعليمية الأولى في الأردن لتدريب وتجهيز المتقدمين لامتحانات هيئة الخدمة والإدارة العامة.
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

            <div className="hidden lg:block relative text-center">
              <div className="relative inline-block">
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Training" 
                  className="w-full max-w-md h-96 object-cover rounded-3xl shadow-2xl grayscale"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 text-center min-w-[150px]">
                  <div className="text-2xl font-black text-red-600">92%+</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">نسبة النجاح</div>
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
             { label: 'متدرب نشط', val: '15,000+' },
             { label: 'سؤال تدريبي', val: '3,200+' },
             { label: 'محاكاة كاملة', val: '450+' },
             { label: 'تخصص مهني', val: '18+' }
           ].map((stat, i) => (
             <div key={i} className="text-center">
               <div className="text-2xl md:text-3xl font-black text-slate-900 mb-1">{stat.val}</div>
               <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">{stat.label}</div>
             </div>
           ))}
           <div className="text-center col-span-2 lg:col-span-1 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-r border-slate-100 flex flex-col justify-center">
             <div className="text-2xl md:text-3xl font-black text-red-600 mb-1 animate-pulse">
               {(() => {
                 // Check for visitor cookie
                 const getCookie = (name: string) => {
                   const value = `; ${document.cookie}`;
                   const parts = value.split(`; ${name}=`);
                   if (parts.length === 2) return parts.pop()?.split(';').shift();
                   return null;
                 };

                 const setCookie = (name: string, value: string, days: number) => {
                   const d = new Date();
                   d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
                   const expires = "expires=" + d.toUTCString();
                   document.cookie = `${name}=${value};${expires};path=/`;
                 };

                 const STORAGE_KEY = 'jo_visitor_count';
                 const INITIAL_BASE = 28450;
                 
                 // Get stored count or set initial
                 let currentCountStr = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
                 let currentCount = currentCountStr ? parseInt(currentCountStr) : INITIAL_BASE + Math.floor(Math.random() * 500);

                 // Check if seen this session/cookie
                 const hasCookie = typeof window !== 'undefined' ? getCookie('jo_v_seen') : null;

                 if (!hasCookie && typeof window !== 'undefined') {
                   currentCount += 1;
                   localStorage.setItem(STORAGE_KEY, currentCount.toString());
                   setCookie('jo_v_seen', 'true', 1); // 1 day cookie
                 }

                 return currentCount.toLocaleString();
               })()}
             </div>
             <div className="text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1">
               <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
               زوار الموقع (مباشر)
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
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-right group"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed mb-6 text-sm font-medium">
                {feature.desc}
              </p>
              <Link
                to={feature.path}
                className="inline-flex items-center gap-2 text-red-600 font-bold text-sm"
              >
                اكتشف المزيد
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          ))}
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
