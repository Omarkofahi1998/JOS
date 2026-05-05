import { motion } from "motion/react";
import { ArrowLeft, BookOpen, CheckCircle, Clock, Star, Users } from "lucide-react";
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
      desc: "حاكي بيئة الامتحان الحقيقي بتوقيت محدد ونظام تصحيح فوري.",
      icon: <BookOpen className="w-8 h-8 text-blue-900" />,
      path: "/mock-exams",
      color: "bg-blue-50",
    },
    {
      title: "اسئلة شاملة",
      desc: "بنك اسئلة ضخم يغطي كافة التخصصات والمهارات المطلوبة.",
      icon: <Star className="w-8 h-8 text-green-600" />,
      path: "/questions",
      color: "bg-green-50",
    },
    {
      title: "مراجعات وملخصات",
      desc: "ملخصات مركزة تساعدك على مراجعة الأساسيات بسرعة.",
      icon: <CheckCircle className="w-8 h-8 text-amber-600" />,
      path: "/reviews",
      color: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[500px] md:h-[600px] overflow-hidden flex items-center bg-white border-b border-slate-100 py-12 md:py-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-100 text-blue-800 text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-6 inline-block"
            >
              مرحباً بك في البوابة التعليمية
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-6xl font-black leading-tight mb-6 md:mb-8 text-slate-900"
            >
              طريقك مع <span className="text-blue-900 underline decoration-blue-200 underline-offset-8">JO Students</span> للتميز الحكومي
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg text-slate-600 mb-8 md:mb-10 leading-relaxed font-light"
            >
              نقدم لك كافة الأدوات والأسئلة التدريبية المعتمدة لضمان نجاحك في المسار المهني في الخدمة العامة من خلال منصة JO Students.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row flex-wrap gap-4"
            >
              <Link
                to="/mock-exams"
                className="bg-blue-900 text-white px-8 py-4 rounded-lg font-bold text-center text-base md:text-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-900/20"
              >
                دخول المتقدمين
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://applyjobs.spac.gov.jo/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-slate-200 text-slate-600 px-8 py-4 rounded-lg font-bold text-center text-base md:text-lg hover:bg-slate-50 transition-all"
              >
                نظام الاستقطاب
              </a>
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
