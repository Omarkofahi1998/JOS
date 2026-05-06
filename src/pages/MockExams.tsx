import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Clock, Search, ChevronDown, ShieldCheck, Loader2, Share2, Check } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
  major: string;
  image?: string;
}

const MAJORS = [
  { id: "عام", name: "ثقافة عامة" },
  { id: "مختبرات", name: "العلوم الطبية المخبرية" },
  { id: "تمريض", name: "تمريض" },
  { id: "قانون", name: "قانون" },
  { id: "معلم_صف", name: "معلم صف" },
  { id: "IT", name: "تكنولوجيا المعلومات" }
];

export default function MockExams() {
  const { majorId } = useParams();
  const [selectedMajor, setSelectedMajor] = useState<string>("عام");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [majorSearch, setMajorSearch] = useState("");
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const handleShare = async (majorId: string, majorName: string) => {
    const url = `${window.location.origin}/mock-exams/${encodeURIComponent(majorId)}`;
    const shareData = {
      title: `امتحان تجريبي - ${majorName}`,
      text: `ألقِ نظرة على الامتحان التجريبي لتخصص ${majorName} على جـو ستودنتس!`,
      url: url
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyToClipboard(url, majorName);
      }
    } else {
      copyToClipboard(url, majorName);
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setShareStatus(id);
    setTimeout(() => setShareStatus(null), 2000);
  };

  useEffect(() => {
    // Handle URL parameters from dynamic route
    if (majorId) {
      const found = MAJORS.find(m => m.id === majorId || m.name === majorId);
      if (found) setSelectedMajor(found.id);
    } else {
      // Fallback to query params if any
      const params = new URLSearchParams(window.location.search);
      const majorParam = params.get('major');
      if (majorParam) {
        const found = MAJORS.find(m => m.name === majorParam || m.id === majorParam);
        if (found) setSelectedMajor(found.id);
      }
    }
  }, [majorId]);

  useEffect(() => {
    async function fetchQuestions() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*');
        
        if (data && !error) {
          const mapped = data.map(q => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correct: q.correct,
            major: q.major,
            image: q.image_url || q.image
          }));
          setQuestionsList(mapped);
        }
      } catch (err) {
        console.error("Supabase Error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  const selectMajor = (id: string) => {
    setSelectedMajor(id);
    setIsDropdownOpen(false);
  };

  const prepareExam = () => {
    let filtered = questionsList.filter(q => q.major === selectedMajor).sort(() => 0.5 - Math.random()).slice(0, 15);
    if (filtered.length === 0) {
      filtered = questionsList.filter(q => q.major === "عام").slice(0, 10);
    }
    
    // Store data for the detached window
    const examData = {
      questions: filtered,
      majors: [MAJORS.find(m => m.id === selectedMajor)?.name || selectedMajor],
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
          اختر التخصص الذي ترغب في التدرب عليه لبدء امتحان محاكاة يطابق نمط أسئلة هيئة الخدمة والإدارة العامة.
        </p>
      </div>

      <div className="max-w-xs mx-auto mb-12">
        <label className="block text-[10px] font-black text-slate-400 mb-2 mr-2 uppercase tracking-widest">اختر التخصص:</label>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 flex items-center justify-between shadow-sm hover:border-red-600 transition-all text-right"
          >
            <span className="text-sm font-bold text-slate-900">
              {MAJORS.find(m => m.id === selectedMajor)?.name}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform mr-2 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2.5 border-b border-slate-50 bg-slate-50/50">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث..."
                    className="w-full h-8 pr-8 pl-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-red-600 transition-all"
                    value={majorSearch}
                    onChange={(e) => setMajorSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {MAJORS.filter(m => m.name.includes(majorSearch)).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectMajor(m.id)}
                    className={`w-full p-3 text-right hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0 ${
                      selectedMajor === m.id ? 'bg-red-50 text-red-600' : 'text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold">{m.name}</span>
                    {selectedMajor === m.id && <div className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                  </button>
                ))}
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
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
               <ChevronDown className="w-5 h-5 -rotate-90" />
            </div>
          </a>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold bg-slate-50 px-6 py-3 rounded-full border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              سيتم بدء امتحان: {MAJORS.find(m => m.id === selectedMajor)?.name}
            </div>

            <button
              onClick={() => handleShare(selectedMajor, MAJORS.find(m => m.id === selectedMajor)?.name || selectedMajor)}
              className="group flex items-center justify-center gap-3 text-slate-500 hover:text-red-600 font-black text-sm transition-all"
            >
              <div className={`p-2 rounded-xl transition-all relative ${
                shareStatus ? 'bg-green-50 text-green-600' : 'bg-slate-100 group-hover:bg-red-50'
              }`}>
                {shareStatus ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {shareStatus && (
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-full whitespace-nowrap animate-in fade-in zoom-in">
                    تم نسخ رابط المشاركة!
                  </span>
                )}
              </div>
              مشاركة هذا الامتحان مع الزملاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
