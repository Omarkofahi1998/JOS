import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, RotateCcw, Trophy, BookOpen, List } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
  major: string;
}

interface ExamModuleProps {
  questions: Question[];
  selectedMajors: string[];
  onClose: () => void;
}

export default function ExamModule({ questions, selectedMajors, onClose }: ExamModuleProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes in seconds

  useEffect(() => {
    if (finished || timeLeft <= 0) return;
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

  const next = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setFinished(true);
    }
  };

  const prev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const score = questions.reduce((acc, q, idx) => {
    return acc + (answers[idx] === q.correct ? 1 : 0);
  }, 0);

  if (finished) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center p-6" dir="rtl">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full text-center"
        >
          <div className="w-24 h-24 bg-yellow-100 rounded-3xl flex items-center justify-center text-yellow-600 mx-auto mb-8 shadow-xl shadow-yellow-100/50">
            <Trophy className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">انتهى الامتحان!</h2>
          <p className="text-slate-500 mb-10">النموذج التدريبي انتهى. إليك نتيجتك بناءً على المعايير الحالية.</p>
          
          <div className="flex justify-center gap-10 mb-12">
            <div>
              <div className="text-5xl font-black text-green-600">{score}</div>
              <div className="text-sm text-slate-500 font-medium">صح</div>
            </div>
            <div className="w-px h-16 bg-slate-100" />
            <div>
              <div className="text-5xl font-black text-slate-900">{questions.length}</div>
              <div className="text-sm text-slate-500 font-medium">الأسئلة</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onClose}
              className="bg-red-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-xl shadow-red-600/20"
            >
              العودة للخيارات
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col font-sans" dir="rtl">
      {/* Module Header */}
      <div className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">منظومة التقييم الذكي</h1>
            <p className="text-xs text-slate-500 mt-1 font-bold">
              الجلسة: {selectedMajors.join(" + ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400">الوقت المتبقي</span>
            <div className="flex items-center gap-2 text-slate-900 font-mono font-bold text-xl">
              <Clock className="w-5 h-5 text-red-600" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if(confirm("هل أنت متأكد من رغبتك في إنهاء الامتحان والخروج؟")) {
                onClose();
              }
            }}
            className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-all"
          >
            خروج من الجلسة
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-80 bg-white border-l border-slate-200 hidden lg:flex flex-col">
          <div className="p-6 border-b border-slate-50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <List className="w-4 h-4 text-red-600" />
              خريطة الأسئلة
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-4 gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-10 rounded-lg font-bold text-xs transition-all border ${
                    currentIdx === idx 
                      ? "bg-red-600 border-red-600 text-white shadow-md scale-110 z-10" 
                      : answers[idx] !== undefined 
                        ? "bg-green-100 border-green-200 text-green-700" 
                        : "bg-white border-slate-200 text-slate-400 hover:border-red-300"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-500">تمت الإجابة</span>
              <span className="text-slate-900">{Object.keys(answers).length} / {questions.length}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500" 
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-slate-50/50">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentIdx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
              >
                <div className="p-8 md:p-12">
                  <div className="flex items-center gap-2 mb-8">
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Question {currentIdx + 1}
                    </span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 mb-12 leading-relaxed text-right">
                    {q.text}
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    {q.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        className={`p-6 rounded-2xl border-2 text-right text-lg font-medium transition-all flex items-center justify-between group ${
                          answers[currentIdx] === idx
                            ? "border-red-600 bg-red-50 text-red-900"
                            : "border-slate-100 bg-white hover:border-red-200 text-slate-600"
                        }`}
                      >
                        <span className="flex-1">{opt}</span>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all mr-6 ${
                          answers[currentIdx] === idx ? "border-red-600 bg-red-600" : "border-slate-200 group-hover:border-red-300"
                        }`}>
                          {answers[currentIdx] === idx && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={prev}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-2 font-bold text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all p-3"
                  >
                    <ArrowRight className="w-5 h-5" />
                    السابق
                  </button>

                  <button
                    onClick={next}
                    disabled={answers[currentIdx] === undefined}
                    className={`px-12 py-4 rounded-xl font-bold transition-all flex items-center gap-2 shadow-xl ${
                      currentIdx === questions.length - 1 
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-green-600/20" 
                        : "bg-red-600 hover:bg-slate-900 text-white shadow-red-600/20"
                    } disabled:bg-slate-200 disabled:shadow-none disabled:cursor-not-allowed`}
                  >
                    {currentIdx === questions.length - 1 ? "إرسال الإجابات" : "السؤال التالي"}
                    <ArrowLeft className="w-5 h-5" />
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
