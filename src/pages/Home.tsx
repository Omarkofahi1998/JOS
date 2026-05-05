import { motion } from "motion/react";
import { ArrowLeft, BookOpen, CheckCircle, Clock, Star, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const stats = [
    { label: "متقدم مسجل", value: "+15,000", icon: <Users className="w-5 h-5" /> },
    { label: "سؤال تدريبي", value: "+2,500", icon: <CheckCircle className="w-5 h-5" /> },
    { label: "ساعة مراجعة", value: "+500", icon: <Clock className="w-5 h-5" /> },
  ];

  const features = [
    {
      title: "امتحانات تجريبية",
      desc: "حاكي بيئة الامتحان الحقيقي بتوقيت محدد ونظام تصحيح فوري لتقييم مستواك.",
      icon: <BookOpen className="w-8 h-8 text-blue-900" />,
      path: "/mock-exams",
      color: "bg-blue-50",
    },
    {
      title: "تنبيهات المواعيد",
      desc: "خدمة إشعار المتقدمين فور صدور مواعيد الامتحانات أو أسماء المدعوين للمقابلات.",
      icon: <Clock className="w-8 h-8 text-red-600" />,
      path: "/",
      color: "bg-red-50",
    },
    {
      title: "اسئلة شاملة",
      desc: "بنك اسئلة ضخم يغطي كافة التخصصات والمهارات المطلوبة للامتحانات التنافسية.",
      icon: <Star className="w-8 h-8 text-green-600" />,
      path: "/questions",
      color: "bg-green-50",
    },
    {
      title: "مراجعات وملخصات",
      desc: "ملخصات مركزة تساعدك على مراجعة المواد الأساسية بسرعة وكفاءة.",
      icon: <CheckCircle className="w-8 h-8 text-amber-600" />,
      path: "/reviews",
      color: "bg-amber-50",
    },
    {
      title: "تحليل النتائج",
      desc: "احصل على تقرير مفصل لنقاط القوة والضعف لديك بعد كل امتحان تجريبي.",
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      path: "/mock-exams",
      color: "bg-indigo-50",
    },
    {
      title: "خدمات مهنية",
      desc: "تصميم سير ذاتية بنظام ATS، تدريب على المقابلات، واستشارات مهنية متخصصة.",
      icon: <Sparkles className="w-8 h-8 text-purple-600" />,
      path: "/services",
      color: "bg-purple-50",
    },
    {
      title: "إرشاد التوظيف",
      desc: "نصائح حول كيفية التعامل مع المقابلات الشخصية والاختبارات السيكومترية.",
      icon: <ArrowLeft className="w-8 h-8 text-slate-600" />,
      path: "/services",
      color: "bg-slate-50",
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[600px] md:h-[800px] overflow-hidden flex items-center bg-white border-b border-slate-100 py-12 md:py-0">
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-white/70 md:bg-white/40 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Collaboration Context" 
            className="w-full h-full object-cover scale-110"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full mt-10 md:mt-0">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-600 text-white text-[10px] md:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 inline-block shadow-lg shadow-red-600/20"
            >
              المنصة رقم #1 للمتقدمين في الأردن
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-7xl font-black leading-tight mb-6 md:mb-10 text-slate-900 drop-shadow-sm"
            >
              طريقك مع <span className="text-red-600">JO Students</span> <br className="hidden md:block" /> للتميز والنجاح الحكومي
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-slate-700 mb-8 md:mb-12 leading-relaxed font-medium md:max-w-2xl"
            >
              نوفر لك كافة الأدوات، الامتحانات التجريبية، والخدمات المهنية المتكاملة لضمان تفوقك في امتحان ديوان الخدمة (هيئة الخدمة العامة).
            </motion.p>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row flex-wrap gap-4"
            >
              <Link
                to="/mock-exams"
                className="bg-red-600 text-white px-8 py-5 rounded-xl font-bold text-center text-base md:text-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-3 group shadow-xl shadow-red-600/30"
              >
                ابدأ رحلة النجاح الآن
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
              </Link>
              <Link
                to="/services"
                className="bg-white/80 backdrop-blur-md border border-slate-200 text-slate-900 px-8 py-5 rounded-xl font-bold text-center text-base md:text-lg hover:bg-white transition-all shadow-lg"
              >
                استعرض خدماتنا المهنية
              </Link>
            </motion.div>
          </div>
        </div>
        {/* Background Decoration */}
        <div className="absolute left-[-10%] top-[-20%] w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[100px] -z-10" />
        <div className="absolute right-[60%] bottom-0 w-[400px] h-[400px] bg-slate-100 rounded-full blur-[80px] -z-10" />
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-wrap justify-center md:justify-between gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-blue-900 ring-1 ring-slate-100">
                {stat.icon}
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">ماذا نوفر لك؟</h2>
          <p className="text-slate-500">مجموعة من الأدوات التعليمية المصممة خصيصاً لتناسب نمط امتحانات هيئة الخدمة والإدارة العامة.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
          {features.map((f, i) => (
            <Link
              key={i}
              to={f.path}
              className="group bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all"
            >
              <div className={`w-16 h-16 ${f.color} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {f.desc}
              </p>
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                استعرض الآن
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-2xl p-12 relative overflow-hidden">
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">استعد لمستقبلك المهني اليوم</h2>
            <p className="text-slate-400 mb-10 leading-relaxed">
              لا تدع الفرصة تفوتك. ابدأ المراجعة والتدريب الآن مع مئات المتقدمين الذين اختاروا منصتنا للتحضير لامتحاناتهم.
            </p>
            <Link
              to="/mock-exams"
              className="inline-flex bg-blue-600 text-white px-10 py-5 rounded-lg font-bold text-lg hover:bg-white hover:text-slate-950 transition-all shadow-lg shadow-blue-600/20"
            >
              ابدأ الآن مجاناً
            </Link>
          </div>
          {/* Geometric Accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
      </section>
    </div>
  );
}
