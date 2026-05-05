import { motion } from "motion/react";
import { ArrowLeft, BookOpen, CheckCircle, Clock, Star, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const features = [
    {
      title: "امتحانات تجريبية",
      desc: "حاكي بيئة الامتحان الحقيقي بتوقيت محدد ونظام تصحيح فوري لتقييم مستواك.",
      icon: <BookOpen className="w-8 h-8 text-red-600" />,
      path: "/mock-exams",
      color: "bg-red-50",
    },
    {
      title: "تنبيهات المواعيد",
      desc: "خدمة إشعار المتقدمين فور صدور مواعيد الامتحانات أو أسماء المدعوين للمقابلات.",
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      path: "/",
      color: "bg-blue-50",
    },
    {
      title: "اسئلة شاملة",
      desc: "بنك اسئلة ضخم يغطي كافة التخصصات والمهارات المطلوبة للامتحانات التنافسية.",
      icon: <Star className="w-8 h-8 text-emerald-600" />,
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
  ];

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[600px] md:h-[850px] overflow-hidden flex items-center bg-white border-b border-slate-100 py-12 md:py-0">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1], 
              rotate: [0, 90, 0],
              x: [0, 50, 0],
              y: [0, 30, 0] 
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-red-100 rounded-full blur-[100px] opacity-40" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              x: [0, -40, 0],
              y: [0, -60, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-40" 
          />
        </div>

        {/* Background Image / Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-white/60 md:bg-white/20 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Collaboration Context" 
            className="w-full h-full object-cover grayscale opacity-10"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full mt-10 md:mt-0">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-8"
            >
              <span className="bg-red-600 text-white text-[10px] md:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-red-600/20">
                المنصة رقم #1 للمتقدمين في الأردن
              </span>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-black leading-[1.1] mb-8 text-slate-900 drop-shadow-sm"
            >
              طريقك مع <span className="text-red-600">JO Students</span> <br className="hidden md:block" /> للتميز <span className="relative inline-block">الحكومي<div className="absolute bottom-4 left-0 w-full h-4 bg-red-600/10 -z-10" /></span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-2xl text-slate-700 mb-10 md:mb-14 leading-relaxed font-medium md:max-w-2xl px-2"
            >
              نحن لسنا مجرد منصة، نحن رفيقك المهني. نوفر لك الأمان المعرفي من خلال امتحانات محاكاة وخدمات مهنية متكاملة.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row flex-wrap gap-5"
            >
              <Link
                to="/mock-exams"
                className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-center text-lg md:text-xl hover:bg-red-600 transition-all flex items-center justify-center gap-4 group shadow-2xl shadow-slate-900/20"
              >
                دخول بوابة التدريب
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
              </Link>
              <Link
                to="/services"
                className="bg-white border-2 border-slate-200 text-slate-900 px-10 py-5 rounded-2xl font-bold text-center text-lg md:text-xl hover:border-red-600 hover:text-red-600 transition-all shadow-sm"
              >
                استكشف الخدمات المهنية
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 bg-white p-12 rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 items-center">
           {[
             { label: 'طالب متدرب', val: '15K+' },
             { label: 'سؤال معتمد', val: '2500+' },
             { label: 'نسبة النجاح', val: '92%' },
             { label: 'خدمة مهنية', val: '12' }
           ].map((stat, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, scale: 0.5 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="text-center"
             >
               <div className="text-3xl md:text-5xl font-black text-red-600 mb-2">{stat.val}</div>
               <div className="text-slate-500 font-bold text-sm uppercase tracking-widest">{stat.label}</div>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-slate-900 mb-6"
          >
            لماذا يختارنا المتقدمون؟
          </motion.h2>
          <div className="w-24 h-1.5 bg-red-600 mx-auto rounded-full" />
        </div>

        <motion.div
           variants={containerVariants}
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true }}
           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-900/5 transition-all text-right relative overflow-hidden group border-b-4 border-b-transparent hover:border-b-red-600"
            >
              <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed mb-6 font-medium">
                {feature.desc}
              </p>
              <Link
                to={feature.path}
                className="inline-flex items-center gap-2 text-slate-900 font-bold group-hover:text-red-600 transition-colors"
              >
                ابدأ الآن
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-950 rounded-[40px] p-12 md:p-24 text-center overflow-hidden relative"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-7xl font-black text-white mb-8 leading-tight">جاهز للتميز في مسارك المهني القادم؟</h2>
            <p className="text-slate-400 text-lg md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              انضم إلى آلاف المتقدمين الناجحين وابدأ التدريب اليوم مع بنك الأسئلة الأحدث والخدمات الأكثر احترافية.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/mock-exams" className="bg-red-600 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20">التسجيل في الامتحانات</Link>
              <Link to="/services" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-white/20 transition-all">باقة الخدمات الكاملة</Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
