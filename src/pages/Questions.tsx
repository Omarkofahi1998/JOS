import { useState } from "react";
import { Search, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QnA {
  question: string;
  answer: string;
  category: string;
}

const QUESTIONS: QnA[] = [
  {
    category: "الإدارة العامة",
    question: "ما هي المبادئ الأساسية للخدمة المدنية؟",
    answer: "تشمل الجدارة، التكافؤ في الفرص، النزاهة، الشركية، والمساءلة.",
  },
  {
    category: "مهارات الحاسوب",
    question: "ما هي وظيفة الـ RAM في جهاز الحاسوب؟",
    answer: "هي ذاكرة الوصول العشوائي وتستخدم لتخزين البيانات المؤقتة التي يحتاجها المعالج أثناء التشغيل.",
  },
  {
    category: "الثقافة الوطنية",
    question: "متى استقلت المملكة الأردنية الهاشمية؟",
    answer: "في الخامس والعشرين من أيار عام 1946م.",
  },
  {
    category: "اللغة العربية",
    question: "ما هي كان وأخواتها؟",
    answer: "هي أفعال ناسخة تدخل على المبتدأ والخبر؛ فترفع المبتدأ ويسمى اسمها، وتنصب الخبر ويسمى خبرها.",
  },
];

export default function Questions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const filtered = QUESTIONS.filter(q => 
    q.question.includes(searchTerm) || q.answer.includes(searchTerm) || q.category.includes(searchTerm)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4">بنك الأسئلة الشامل</h1>
        <p className="text-slate-500 max-w-2xl mx-auto italic">
          تصفح مئات الأسئلة المجابة في مختلف المجالات المطلوبة للامتحان التنافسي.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto mb-16 group">
        <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="ابحث عن سؤال أو كلمة مفتاحية..."
          className="w-full h-16 pr-16 pl-8 rounded-full bg-white border border-slate-200 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-lg font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:shadow-lg hover:shadow-slate-500/5"
          >
            <button
              onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
              className="w-full p-6 text-right flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">{item.category}</span>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {item.question}
                  </h3>
                </div>
              </div>
              {activeIdx === idx ? (
                <ChevronUp className="w-5 h-5 text-slate-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-300" />
              )}
            </button>

            <AnimatePresence>
              {activeIdx === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pr-20">
                    <div className="p-6 bg-slate-50 rounded-2xl text-slate-600 leading-relaxed border-r-4 border-blue-900">
                      {item.answer}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-neutral-400">
            لا توجد نتائج تطابق بحثك.
          </div>
        )}
      </div>
    </div>
  );
}
