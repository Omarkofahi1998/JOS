import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Trophy, BookOpen, List, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
  major: string;
  image?: string;
}

export default function ExamPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [securityAlert, setSecurityAlert] = useState(false);

  // Initialize Exam from local storage
  useEffect(() => {
    const rawData = localStorage.getItem("current_exam");
    if (!rawData) {
      window.location.href = "/#/mock-exams";
      return;
    }
    
    try {
      const data = JSON.parse(rawData);
      setQuestions(data.questions);
      setSelectedMajors(data.majors);
      // Optional: Clear after loading for "security" (one-time use data)
      // localStorage.removeItem("current_exam"); 
    } catch (e) {
      window.location.href = "/#/mock-exams";
    }

    // Security: Prevent Right Click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    // Security: Prevent Copy/Cut/Paste
    const handleCopyPaste = (e: ClipboardEvent) => e.preventDefault();
    
    const handleBlur = () => {
      setSecurityAlert(true);
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
    };
  }, []);

  useEffect(() => {
    if (finished || timeLeft <= 0) {
        if(timeLeft <= 0) setFinished(true);
        return;
    };
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [finished, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelect = (optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: optionIdx }));
  };

  const score = questions.reduce((acc, q, idx) => {
    return acc + (answers[idx] === q.correct ? 1 : 0);
  }, 0);

  if (finished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans" dir="rtl">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-slate-100"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-8">
            <Trophy className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4">اكتمل التقييم</h2>
          <p className="text-slate-500 mb-10 text-lg">لقد أتممت نظام المحاكاة بنجاح. إليك التقرير النهائي:</p>
          
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-slate-50 p-8 rounded-3xl">
              <div className="text-5xl font-black text-green-600 mb-2">{score}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">إجابة صحيحة</div>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl">
              <div className="text-5xl font-black text-slate-900 mb-2">{questions.length}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">إجمالي الأسئلة</div>
            </div>
          </div>

          <button
            onClick={() => window.close()}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-xl hover:bg-red-600 transition-all shadow-xl"
          >
            إغلاق بوابة الامتحان
          </button>
        </motion.div>
      </div>
    );
  }

  const q = questions[currentIdx];
  if (!q) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none" dir="rtl">
      {/* Secure Header */}
      <div className="h-24 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-600/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">بوابة الامتحان الآمنة</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">الحالة: مؤمن ومراقب برمجياً</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase">الوقت المتبقي</span>
            <div className={`flex items-center gap-2 font-mono text-2xl font-black ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="h-10 w-px bg-slate-200 mx-2" />

          <button 
            onClick={() => {
              if(confirm("تحذير: الخروج سيؤدي إلى إلغاء جلستك الحالية. هل تود المتابعة؟")) {
                window.close();
              }
            }}
            className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-all"
          >
            خروج اضطراري
          </button>
        </div>
      </div>

      {/* Security Alert Overlay */}
      <AnimatePresence>
        {securityAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border-4 border-red-500">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-4">خرق أمني مكتشف</h2>
              <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                لقد غادرت نافذة الامتحان أو حاولت التغيير بين النوافذ. تم تسجيل هذا النشاط ضمن سجلات النظام.
              </p>
              <button
                onClick={() => setSecurityAlert(false)}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 transition-all shadow-lg shadow-red-600/20"
              >
                العودة للامتحان (تحذير نهائي)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-96 bg-white border-l border-slate-200 hidden xl:flex flex-col shadow-inner">
          <div className="p-8 border-b border-slate-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <List className="w-5 h-5 text-red-600" />
                تصفح الأسئلة
              </h3>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-500">
                {Object.keys(answers).length} / {questions.length} مكتمل
              </span>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-12 rounded-xl font-black text-sm transition-all border-2 ${
                    currentIdx === idx 
                      ? "border-red-600 bg-red-600 text-white shadow-lg shadow-red-600/20 scale-110" 
                      : answers[idx] !== undefined 
                        ? "border-green-500 bg-green-50 text-green-700" 
                        : "border-slate-50 bg-slate-50 text-slate-400 hover:border-red-200"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 mt-auto bg-slate-50">
            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3 text-blue-700 font-bold mb-2">
                <AlertTriangle className="w-5 h-5" />
                إرشادات الأمن
              </div>
              <p className="text-[11px] text-blue-600 leading-relaxed font-medium">
                النظام يراقب حركة المؤشر والتفاعل. إغلاق النافذة أو محاولة التلاعب سيؤدي لإنهاء الجلسة تلقائياً.
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 md:p-20 bg-slate-50/50">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl p-10 md:p-16 relative overflow-hidden"
              >
                {/* Question Info Bar */}
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                      {currentIdx + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">التخصص المختار</span>
                      <span className="text-sm font-black text-slate-800">{q.major}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-300" />
                    <span className="text-xs font-bold text-slate-300">سجل الامتحان الرسمي</span>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-10 leading-relaxed text-right md:pr-4 border-r-8 border-red-600">
                  {q.text}
                </h2>

                {q.image && (
                  <div className="mb-10 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={q.image} alt="Question Visual Context" className="w-full max-h-96 object-contain mx-auto shadow-inner" />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5">
                  {q.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      className={`p-8 rounded-3xl border-2 text-right text-xl font-bold transition-all flex items-center justify-between group ${
                        answers[currentIdx] === idx
                          ? "border-red-600 bg-red-50 text-red-900 shadow-xl shadow-red-600/5 ring-4 ring-red-50"
                          : "border-slate-100 bg-white hover:border-red-200 text-slate-600"
                      }`}
                    >
                      <span className="flex-1">{opt}</span>
                      <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all mr-10 ${
                        answers[currentIdx] === idx ? "border-red-600 bg-red-600 shadow-lg shadow-red-600/30" : "border-slate-200 group-hover:border-red-300"
                      }`}>
                        {answers[currentIdx] === idx && <CheckCircle2 className="w-6 h-6 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Footer Nav */}
                <div className="mt-20 pt-10 border-t border-slate-50 flex items-center justify-between">
                  <button
                    onClick={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-3 font-black text-slate-400 hover:text-slate-900 transition-all p-5 rounded-2xl disabled:opacity-0"
                  >
                    <ArrowRight className="w-6 h-6" />
                    السؤال السابق
                  </button>

                  <button
                    onClick={() => {
                      if (currentIdx < questions.length - 1) {
                        setCurrentIdx(currentIdx + 1);
                      } else {
                        setFinished(true);
                      }
                    }}
                    disabled={answers[currentIdx] === undefined}
                    className={`px-16 py-6 rounded-2xl font-black text-xl transition-all flex items-center gap-3 shadow-2xl ${
                      currentIdx === questions.length - 1 
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-green-600/30" 
                        : "bg-red-600 hover:bg-slate-950 text-white shadow-red-600/30"
                    } disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
                  >
                    {currentIdx === questions.length - 1 ? "إرسال وتصحيح" : "تأكيد واستمرار"}
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
