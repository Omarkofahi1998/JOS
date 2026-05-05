import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, HelpCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface QnA {
  question: string;
  answer: string;
  category: string;
}

const QUESTIONS: QnA[] = [
  // مختبرات
  { category: "مختبرات", question: "ما هو الدور الرئيسي للهيموجلوبين في جسم الإنسان؟", answer: "نقل الأكسجين من الرئتين إلى أنسجة الجسم ونقل ثاني أكسيد الكربون من الأنسجة إلى الرئتين." },
  { category: "مختبرات", question: "ما هو الفرق بين مصل الدم (Serum) وبلازما الدم؟", answer: "البلازما تحتوي على عوامل التجلط (مثل الفيبرينوجين)، بينما المصل هو الجزء السائل المتبقي من الدم بعد حدوث التجلط (أي بلازما بدون عوامل تجلط)." },
  
  // تمريض
  { category: "تمريض", question: "كيف يتم التعامل مع مريض يعاني من هبوط حاد في السكر؟", answer: "إذا كان واعياً، يتم إعطاؤه سوائل سكرية فوراً. إذا كان فاقداً للوعي، يتم تجنّب وضع أي شيء في فمه واستدعاء الطوارئ لإعطائه الجلوكوز وريدياً." },
  
  // قانون
  { category: "قانون", question: "من هم أصحاب الحق في اقتراح القوانين في المملكة؟", answer: "مجلس الوزراء وكيلا مجلسي الأعيان والنواب (بما لا يقل عن عشرة أعضاء)." },
  { category: "قانون", question: "ما هي المحكمة المختصة بالفصل في صحة نيابة أعضاء مجلس النواب؟", answer: "محكمة الاستئناف التي تقع الدائرة الانتخابية للمرشح ضمن اختصاصها." },
  
  // معلم صف
  { category: "معلم صف", question: "ما هي الأهداف السلوكية (SMART)؟", answer: "هي أهداف يجب أن تكون محددة، قابلة للقياس، قابلة للتحقيق، واقعية، ومحددة بزمن." },

  // إدارة عامة
  { category: "الإدارة العامة", question: "ما هو نظام 'إسأل' في هيئة الخدمة والإدارة العامة؟", answer: "هو نظام إلكتروني مخصص لاستفسارات وشكاوي المتقدمين لطلبات التوظيف والنتائج." },
];

const CATEGORIES = ["الكل", "مختبرات", "تمريض", "قانون", "معلم صف", "IT", "الإدارة العامة"];

export default function Questions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const location = useLocation();

  const filteredCategories = CATEGORIES.filter(cat => 
    cat.toLowerCase().includes(catSearch.toLowerCase())
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("search");
    if (query) {
      setSearchTerm(query);
    }
  }, [location.search]);
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setIsLoading(false);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filtered = QUESTIONS.filter(q => {
    const matchesSearch = q.question.includes(debouncedTerm) || q.answer.includes(debouncedTerm) || q.category.includes(debouncedTerm);
    const matchesCategory = activeCategory === "الكل" || q.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4">بنك الأسئلة الشامل</h1>
        <p className="text-slate-500 max-w-2xl mx-auto italic">
          تصفح مئات الأسئلة المجابة في مختلف المجالات المطلوبة للامتحان التنافسي.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto mb-12">
        <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-400">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          type="text"
          placeholder="ابحث عن سؤال أو كلمة مفتاحية..."
          className="w-full h-14 pr-14 pl-6 rounded-xl bg-white border border-slate-200 shadow-sm focus:outline-none focus:border-red-600 transition-all text-base font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Select Category (Specialty) Dropdown */}
      <div className="max-w-md mx-auto mb-10 relative">
        <label className="block text-sm font-bold text-slate-400 mb-2 mr-2">اختر التخصص:</label>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full h-12 bg-white border border-slate-200 rounded-xl px-5 flex items-center justify-between shadow-sm hover:border-red-600 transition-all text-slate-800 font-bold"
        >
          {activeCategory}
          <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-3 border-b border-slate-50 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن تخصص..."
                  className="w-full h-10 pr-9 pl-4 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-red-600 transition-all"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full p-4 text-right hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    activeCategory === cat ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-600'
                  }`}
                >
                  {cat}
                  {activeCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                </button>
              ))}
              {filteredCategories.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                  لا توجد تخصصات تطابق بحثك
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for closing dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-[90]" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

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
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">{item.category}</span>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
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

            {activeIdx === idx && (
              <div className="overflow-hidden">
                <div className="px-6 pb-6 pr-20">
                  <div className="p-6 bg-slate-50 rounded-2xl text-slate-600 leading-relaxed border-r-4 border-red-600">
                    {item.answer}
                  </div>
                </div>
              </div>
            )}
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
