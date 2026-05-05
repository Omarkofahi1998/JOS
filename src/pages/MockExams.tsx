import { useState } from "react";
import { CheckCircle2, Clock, Search, ChevronDown, ShieldCheck } from "lucide-react";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
  major: string;
}

const ALL_QUESTIONS: Question[] = [
  // عام
  { id: 1, text: "ما هي عاصمة الأردن؟", options: ["عمان", "إربد", "الزرقاء", "مادبا"], correct: 0, major: "عام" },
  { id: 2, text: "أي الهيئات التالية تدير الامتحانات التنافسية؟", options: ["هيئة الخدمة والإدارة العامة", "ديوان المحاسبة", "وزارة العمل", "البنك المركزي"], correct: 0, major: "عام" },
  
  // العلوم الطبية المخبرية
  { id: 601, text: "ما هو الفحص المخبري المستخدم للكشف عن مستويات السكر في الدم لفترة طويلة (3 أشهر)؟", options: ["Fasting Blood Sugar", "HBA1C", "Glucose Tolerance Test", "Random Blood Sugar"], correct: 1, major: "مختبرات" },
  { id: 602, text: "أي من الخلايا التالية تعتبر جزءاً من الجهاز المناعي وتنتج الأجسام المضادة؟", options: ["خلايا الدم الحمراء", "الصفائح الدموية", "الخلايا الليمفاوية B", "الخلايا المتعادلة"], correct: 2, major: "مختبرات" },

  // تمريض
  { id: 401, text: "ما هو المعدل الطبيعي لنبض الإنسان البالغ في حالة الراحة؟", options: ["40-60 نبضة/دقيقة", "60-100 نبضة/دقيقة", "100-120 نبضة/دقيقة", "120-140 نبضة/دقيقة"], correct: 1, major: "تمريض" },
  { id: 402, text: "أي وضعية هي الأنسب لمريض يعاني من ضيق شديد في التنفس؟", options: ["وضعية الاستلقاء الكامل", "وضعية فاولر (الجلوس النصفي)", "وضعية الركبة للصدر", "الاستلقاء على الجانب الأيسر"], correct: 1, major: "تمريض" },

  // قانون
  { id: 701, text: "كم مدة الدورة العادية لمجلس الأمة الأردني وفقاً للدستور؟", options: ["4 أشهر", "6 أشهر", "9 أشهر", "سنة واحدة"], correct: 1, major: "قانون" },
  { id: 702, text: "يعتبر القانون ساري المفعول في الأردن من تاريخ:", options: ["إقراره في مجلس النواب", "موافقة الملك عليه", "نشره في الجريدة الرسمية", "مرور 30 يوماً على توقيعه"], correct: 2, major: "قانون" },

  // معلم صف
  { id: 801, text: "أي من نظريات التعلم تركز على مفهوم 'التعزيز والعقاب'؟", options: ["النظرية المعرفية", "النظرية السلوكية", "النظرية البنائية", "النظرية الاجتماعية"], correct: 1, major: "معلم_صف" },
  { id: 802, text: "تعتبر 'الفروق الفردية' بين الطلاب عاملاً يجب مراعاته في:", options: ["وسائل التقييم فقط", "طرق التدريس", "توقيع العقوبات", "كل ما ذكر صحيح"], correct: 1, major: "معلم_صف" },
  { id: 301, text: "ما هو البروتوكول المستخدم لنقل الملفات عبر الإنترنت؟", options: ["HTTP", "STP", "FTP", "POP3"], correct: 2, major: "IT" },
];

const MAJORS = [
  { id: "all", name: "امتحان شامل" },
  { id: "عام", name: "ثقافة عامة" },
  { id: "مختبرات", name: "العلوم الطبية المخبرية" },
  { id: "تمريض", name: "تمريض" },
  { id: "قانون", name: "قانون" },
  { id: "معلم_صف", name: "معلم صف" },
  { id: "IT", name: "تكنولوجيا المعلومات" }
];

export default function MockExams() {
  const [started, setStarted] = useState(false);
  const [selectedMajors, setSelectedMajors] = useState<string[]>(["all"]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [majorSearch, setMajorSearch] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  const toggleMajor = (id: string) => {
    if (id === "all") {
      setSelectedMajors(["all"]);
      return;
    }

    setSelectedMajors(prev => {
      const filtered = prev.filter(m => m !== "all");
      if (filtered.includes(id)) {
        const next = filtered.filter(m => m !== id);
        return next.length === 0 ? ["all"] : next;
      } else {
        return [...filtered, id];
      }
    });
  };

  const prepareExam = () => {
    let filtered;
    if (selectedMajors.includes("all")) {
      filtered = [...ALL_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 10);
    } else {
      filtered = ALL_QUESTIONS.filter(q => selectedMajors.includes(q.major)).sort(() => 0.5 - Math.random()).slice(0, 15);
    }
    
    // Store data for the detached window
    const examData = {
      questions: filtered,
      majors: selectedMajors.map(id => MAJORS.find(m => m.id === id)?.name || id),
      startTime: new Date().getTime()
    };
    localStorage.setItem("current_exam", JSON.stringify(examData));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-900 mx-auto mb-6">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">الامتحانات التجريبية التخصصية</h1>
        <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
          اختر تخصصك لبدء امتحان محاكاة يطابق نمط أسئلة هيئة الخدمة والإدارة العامة. يمكنك اختيار عدة تخصصات في آن واحد.
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-12">
        <label className="block text-sm font-bold text-slate-400 mb-3 mr-2">تصفح التخصصات المتاحة:</label>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full min-h-[4rem] bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm hover:border-red-600 transition-all text-right"
          >
            <div className="flex flex-wrap gap-2">
              {selectedMajors.includes("all") ? (
                <span className="text-slate-900 font-bold">امتحان شامل (جميع التخصصات)</span>
              ) : (
                selectedMajors.map(id => (
                  <span key={id} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-red-600/10">
                    {MAJORS.find(m => m.id === id)?.name}
                  </span>
                ))
              )}
            </div>
            <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 left-0 mt-4 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث عن تخصص (قانون، تمريض، مختبرات...)"
                    className="w-full h-12 pr-12 pl-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-red-600 transition-all shadow-inner"
                    value={majorSearch}
                    onChange={(e) => setMajorSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {MAJORS.filter(m => m.name.includes(majorSearch)).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleMajor(m.id)}
                    className={`w-full p-5 text-right hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0 ${
                      selectedMajors.includes(m.id) ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-lg font-bold ${selectedMajors.includes(m.id) ? 'text-red-600' : 'text-slate-700'}`}>
                        {m.name}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">تحديث جديد 2026</span>
                    </div>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      selectedMajors.includes(m.id) ? 'bg-red-600 border-red-600' : 'border-slate-200'
                    }`}>
                      {selectedMajors.includes(m.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-5 bg-slate-900">
                <button 
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors"
                >
                  حفظ الاختيارات والبدء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isDropdownOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-900/10 backdrop-blur-[2px]" onClick={() => setIsDropdownOpen(false)} />
      )}

      <div className="text-center">
        <div className="inline-flex flex-col items-center gap-6">
          <a
            href={`${window.location.origin}${window.location.pathname}#/exam`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={prepareExam}
            className="bg-slate-900 text-white px-20 py-6 rounded-[2rem] font-black text-2xl hover:bg-red-600 transition-all shadow-2xl shadow-slate-900/30 hover:-translate-y-2 group flex items-center gap-4 no-underline"
          >
            <ShieldCheck className="w-8 h-8 text-red-500 group-hover:text-white transition-colors" />
            الدخول الى الامتحان
          </a>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold bg-slate-50 px-6 py-3 rounded-full border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              سيفتح التقييم في نافذة منفصلة لضمان الخصوصية والأمان
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
