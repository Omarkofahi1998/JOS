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
  explanation?: string;
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
  const [showReview, setShowReview] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // Default 30 minutes
  const [securityAlert, setSecurityAlert] = useState(false);

  // Initialize Exam from local storage
  useEffect(() => {
    const rawData = localStorage.getItem("current_exam");
    if (!rawData) {
      navigate("/mock-exams");
      return;
    }
    
    try {
      const data = JSON.parse(rawData);
      setQuestions(data.questions);
      setSelectedMajors(data.majors);
      if (data.duration) {
        setTimeLeft(data.duration * 60);
      }
      // Optional: Clear after loading for "security" (one-time use data)
      // localStorage.removeItem("current_exam"); 
    } catch (e) {
      navigate("/mock-exams");
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

  const isRTL = (text: string) => /[\u0600-\u06FF]/.test(text);

  if (finished) {
    if (showReview) {
      return (
        <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-10" dir="rtl">
           <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                 <div className="text-right">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">مراجعة الإجابات</h2>
                    <p className="text-slate-500 font-bold">يمكنك الآن رؤية الإجابات الصحيحة والتفسير الخاص بكل سؤال.</p>
                 </div>
                 <button 
                   onClick={() => setShowReview(false)}
                   className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl font-black text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                 >
                   <ArrowRight className="w-4 h-4" /> العودة للنتيجة
                 </button>
              </div>

              <div className="space-y-6">
                 {questions.map((q, idx) => {
                   const isCorrect = answers[idx] === q.correct;
                   return (
                     <motion.div 
                       key={idx}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.05 }}
                       className={`bg-white rounded-3xl p-8 border shadow-sm ${isCorrect ? 'border-green-100 shadow-green-500/5' : 'border-red-100 shadow-red-500/5'}`}
                     >
                       <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-3">
                             <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                {idx + 1}
                             </span>
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                             </span>
                          </div>
                          <span className="text-[10px] font-black text-slate-300 uppercase">{q.major}</span>
                       </div>

                       <h3 className="text-lg font-bold text-slate-900 mb-6 leading-relaxed">{q.text}</h3>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                          {q.options.map((opt, oIdx) => {
                            const isUserSelection = answers[idx] === oIdx;
                            const isCorrectOption = q.correct === oIdx;
                            
                            return (
                              <div 
                                key={oIdx}
                                className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-between ${
                                  isCorrectOption 
                                    ? 'border-green-500 bg-green-50 text-green-900' 
                                    : isUserSelection 
                                      ? 'border-red-500 bg-red-50 text-red-900' 
                                      : 'border-slate-100 bg-slate-50 text-slate-400'
                                }`}
                              >
                                <span>{opt}</span>
                                {isCorrectOption && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                                {!isCorrect && isUserSelection && <AlertTriangle className="w-5 h-5 text-red-600" />}
                              </div>
                            );
                          })}
                       </div>

                       {(q.explanation && q.explanation.trim() !== "") && (
                         <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50">
                            <div className="flex items-center gap-2 text-blue-800 font-black text-xs mb-3">
                               <List className="w-4 h-4" /> تفسير الإجابة:
                            </div>
                            <p className="text-sm text-blue-700 leading-relaxed font-medium whitespace-pre-wrap">
                               {q.explanation}
                            </p>
                         </div>
                       )}
                     </motion.div>
                   );
                 })}
              </div>

              <div className="mt-12 text-center pb-20">
                 <button
                    onClick={() => window.close()}
                    className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-red-600 transition-all shadow-2xl"
                  >
                    إنهاء المراجعة وإغلاق البوابة
                  </button>
              </div>
           </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-white rounded-3xl p-8 md:p-10 text-center shadow-2xl border border-slate-100"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">اكتمل التقييم</h2>
          <p className="text-slate-500 mb-8 text-base">لقد أتممت نظام المحاكاة بنجاح. إليك التقرير النهائي:</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-6 rounded-2xl">
              <div className="text-4xl font-black text-green-600 mb-1">{score}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">إجابة صحيحة</div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <div className="text-4xl font-black text-slate-900 mb-1">{questions.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">إجمالي الأسئلة</div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
             <button
                onClick={() => setShowReview(true)}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-lg hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-3 group"
              >
                مراجعة إجاباتي وتفسيرها
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => window.close()}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all"
              >
                إغلاق بوابة الامتحان
              </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const q = questions[currentIdx];
  if (!q) return null;

  const currentIsRTL = isRTL(q.text);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none" dir="rtl">
      {/* Secure Header */}
      <div className="h-16 bg-white border-b border-slate-200 px-4 md:px-5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-600/10">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-none">بوابة الامتحان الآمنة</h1>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">مؤمن ومراقب برمجياً</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">المتبقي</span>
            <div className={`flex items-center gap-1.5 font-mono text-lg font-black leading-none ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="sm:hidden flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
             <Clock className={`w-3.5 h-3.5 ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
             <span className={`text-xs font-black font-mono ${timeLeft < 300 ? 'text-red-600' : 'text-slate-700'}`}>{formatTime(timeLeft)}</span>
          </div>
          
          <div className="h-8 w-px bg-slate-200 mx-1" />

          <button 
            onClick={() => {
              if(confirm("تحذير: الخروج سيؤدي إلى إلغاء جلستك الحالية. هل تود المتابعة؟")) {
                window.close();
              }
            }}
            className="bg-slate-100 text-slate-600 px-4 py-2.5 rounded-lg font-bold text-xs hover:bg-red-50 hover:text-red-600 transition-all"
          >
            خروج
          </button>
        </div>
      </div>

      {/* Security Alert Overlay */}
      <AnimatePresence>
        {securityAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 text-center"
          >
            <div className="max-w-sm w-full bg-white rounded-[2rem] p-8 shadow-2xl border-4 border-red-500">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-5">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-3">خرق أمني مكتشف</h2>
              <p className="text-slate-500 mb-6 text-sm font-medium leading-relaxed">
                لقد غادرت نافذة الامتحان أو حاولت التغيير بين النوافذ. تم تسجيل هذا النشاط ضمن سجلات النظام.
              </p>
              <button
                onClick={() => setSecurityAlert(false)}
                className="w-full bg-red-600 text-white py-3.5 rounded-lg font-bold text-base hover:bg-slate-900 transition-all shadow-lg shadow-red-600/20"
              >
                العودة للامتحان (تحذير نهائي)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="xl:hidden h-1.5 w-full bg-slate-100 relative overflow-hidden">
        <motion.div 
          className="absolute inset-y-0 right-0 bg-red-600"
          initial={{ width: 0 }}
          animate={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-64 bg-white border-l border-slate-200 hidden xl:flex flex-col shadow-inner">
          <div className="p-5 border-b border-slate-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <List className="w-3.5 h-3.5 text-red-600" />
                تصفح الأسئلة
              </h3>
              <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">
                {Object.keys(answers).length} / {questions.length}
              </span>
            </div>
            
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-10 rounded-lg font-black text-xs transition-all border ${
                    currentIdx === idx 
                      ? "border-red-600 bg-red-600 text-white shadow-lg shadow-red-600/20 scale-105" 
                      : answers[idx] !== undefined 
                        ? "border-green-500 bg-green-50 text-green-700" 
                        : "border-slate-100 bg-slate-50 text-slate-400 hover:border-red-200"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 mt-auto bg-slate-50">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 font-bold mb-1.5 text-xs">
                <AlertTriangle className="w-4 h-4" />
                إرشادات الأمن
              </div>
              <p className="text-[10px] text-blue-600 leading-tight font-medium">
                النظام يراقب حركة المؤشر والتفاعل. إغلاق النافذة أو محاولة التلاعب سيؤدي لإنهاء الجلسة تلقائياً.
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 md:p-8 relative overflow-hidden"
              >
                {/* Question Info Bar */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[10px]">
                      {currentIdx + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-0.5">التخصص</span>
                      <span className="text-[10px] font-black text-slate-800 leading-none">{q.major}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-30">
                    <BookOpen className="w-3 h-3 text-slate-300" />
                    <span className="text-[9px] font-bold text-slate-300 tracking-wider">Official Exam Log</span>
                  </div>
                </div>

                <div 
                  dir={currentIsRTL ? "rtl" : "ltr"}
                  className={`mb-4 ${currentIsRTL ? "text-right pr-3 border-r-4" : "text-left pl-3 border-l-4"} border-red-600`}
                >
                  <h2 className={`text-base md:text-lg font-bold text-slate-900 leading-snug`}>
                    {q.text}
                  </h2>
                </div>

                {q.image && q.image.trim() !== "" && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-slate-100 bg-slate-200/10">
                    <img src={q.image} alt="Question Visual Context" className="w-full max-h-48 object-contain mx-auto" referrerPolicy="no-referrer" />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      dir={currentIsRTL ? "rtl" : "ltr"}
                      className={`p-3 md:p-3.5 rounded-xl border font-bold transition-all flex items-center justify-between group ${
                        answers[currentIdx] === idx
                          ? "border-red-600 bg-red-50 text-red-900 shadow-sm"
                          : "border-slate-100 bg-slate-50/50 hover:border-red-100 text-slate-600"
                      }`}
                    >
                      <span className="flex-1 text-sm md:text-base">{opt}</span>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        currentIsRTL ? "mr-3" : "ml-3"
                      } ${
                        answers[currentIdx] === idx ? "border-red-600 bg-red-600" : "border-slate-200 group-hover:border-red-300"
                      }`}>
                        {answers[currentIdx] === idx && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Footer Nav */}
                <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between">
                  <button
                    onClick={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-1.5 font-bold text-slate-400 hover:text-slate-900 transition-all p-2 rounded-lg disabled:opacity-0 text-xs"
                  >
                    <ArrowRight className="w-4 h-4" />
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
                    className={`px-6 py-2.5 rounded-lg font-black text-sm transition-all flex items-center gap-1.5 shadow-lg ${
                      currentIdx === questions.length - 1 
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-green-600/20" 
                        : "bg-red-600 hover:bg-slate-950 text-white shadow-red-600/20"
                    } disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
                  >
                    {currentIdx === questions.length - 1 ? "إرسال وتصحيح" : "تأكيد واستمرار"}
                    <ArrowLeft className="w-4 h-4" />
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
