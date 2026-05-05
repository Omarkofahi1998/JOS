import { motion } from "motion/react";
import { FileUser, Settings, Briefcase, UserCheck, MessageSquare, Sparkles, ArrowLeft } from "lucide-react";

const SERVICES = [
  {
    title: "تصميم وتعديل السيرة الذاتية (ATS)",
    desc: "نصمم لك سيرة ذاتية احترافية تتوافق مع أنظمة الفرز الآلي (ATS) لزيادة فرصك في القبول.",
    icon: <FileUser className="w-10 h-10 text-blue-600" />,
    color: "bg-blue-50",
  },
  {
    title: "تحسين الملف الشخصي المهني",
    desc: "مراجعة وتحسين ملفاتك المهنية على المنصات المختلفة لتظهر بشكل احترافي أمام جهات التوظيف.",
    icon: <UserCheck className="w-10 h-10 text-emerald-600" />,
    color: "bg-emerald-50",
  },
  {
    title: "التدريب على المقابلات الشخصية",
    desc: "جلسات محاكاة للمقابلات الشخصية (Mock Interviews) مع خبراء لمساعدتك على تجاوز الرهبة.",
    icon: <MessageSquare className="w-10 h-10 text-red-600" />,
    color: "bg-red-50",
  },
  {
    title: "إرشاد التوظيف في القطاع العام",
    desc: "توجيه كامل حول كيفية التعامل مع نظام الاستقطاب والدور التنافسي في الأردن.",
    icon: <Briefcase className="w-10 h-10 text-amber-600" />,
    color: "bg-amber-50",
  },
  {
    title: "ورش عمل متخصصة",
    desc: "ورش عمل دورية عن مهارات الحاسوب، اللغة العربية، والذكاء المطلوب في الامتحانات.",
    icon: <Settings className="w-10 h-10 text-indigo-600" />,
    color: "bg-indigo-50",
  },
  {
    title: "تحليل الشخصية الوظيفي",
    desc: "اختبارات سيكومترية تساعدك على فهم ميولك المهنية وكيفية ابراز نقاط قوتك.",
    icon: <Sparkles className="w-10 h-10 text-purple-600" />,
    color: "bg-purple-50",
  },
];

export default function Services() {
  return (
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* Header Section */}
      <section className="bg-slate-950 text-white py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black mb-6"
          >
            خدماتنا المهنية والداعمة
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            نحن هنا لنكون شريكك في رحلة التوظيف. لا نكتفي بالتدريب، بل نسعى لتمكينك بكافة الأدوات المهنية اللازمة.
          </motion.p>
        </div>
        {/* Geometric Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-0" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] -z-0" />
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-4 mb-16 justify-center">
          {SERVICES.map((s, i) => (
            <a 
              key={i} 
              href={`#service-${i}`}
              className="px-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold hover:border-red-600 hover:text-red-600 transition-all shadow-sm"
            >
              {s.title}
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((s, i) => (
            <motion.div
              key={i}
              id={`service-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white p-10 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all text-right relative overflow-hidden scroll-mt-24"
            >
              <div className={`w-20 h-20 ${s.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                {s.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{s.title}</h3>
              <p className="text-slate-600 leading-relaxed text-base mb-8">
                {s.desc}
              </p>
              <button className="flex items-center gap-2 text-blue-900 font-bold hover:gap-4 transition-all">
                طلب الخدمة
                <ArrowLeft className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Info Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-600 rounded-3xl p-10 md:p-16 text-white flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">هل تحتاج إلى خدمة مخصصة؟</h2>
            <p className="text-blue-100 text-lg">
              فريقنا من الخبراء جاهز لمساعدتك في أي استفسار يخص مسارك المهني أو امتحاناتك القادمة. تواصل معنا الآن للحصول على استشارة مجانية.
            </p>
          </div>
          <button className="bg-white text-blue-600 px-10 py-5 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all whitespace-nowrap shadow-xl">
            تواصل مع الخبراء
          </button>
        </div>
      </section>
    </div>
  );
}
