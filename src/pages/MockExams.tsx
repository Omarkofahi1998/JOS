import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, RotateCcw, Trophy } from "lucide-react";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "ما هي عاصمة الأردن؟",
    options: ["عمان", "اربد", "الزرقاء", "العقبة"],
    correct: 0,
  },
  {
    id: 2,
    text: "أي من هذه الهيئات مسؤولة عن إدارة الموارد البشرية في القطاع العام الأردني؟",
    options: ["هيئة النزاهة", "هيئة الخدمة والإدارة العامة", "مجلس الوزراء", "ديوان المحاسبة"],
    correct: 1,
  },
  {
    id: 3,
    text: "يتم الاستعلام عن الدور التنافسي من خلال:",
    options: ["موقع الوزارة", "ديوان المظالم", "نظام الاستعلام في هيئة الخدمة", "التقديم الورقي"],
    correct: 2,
  },
];

export default function MockExams() {
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);

  const startExam = () => {
    setStarted(true);
    setFinished(false);
    setCurrentIdx(0);
    setAnswers({});
  };

  const handleSelect = (idx: number) => {
    setAnswers({ ...answers, [currentIdx]: idx });
  };

  const next = () => {
    if (currentIdx < SAMPLE_QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setFinished(true);
    }
  };

  const prev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const score = SAMPLE_QUESTIONS.reduce((acc, q, idx) => {
    return acc + (answers[idx] === q.correct ? 1 : 0);
  }, 0);

  if (!started) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-900 mx-auto mb-8">
          <Clock className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-6">الامتحانات التجريبية</h1>
        <p className="text-slate-500 mb-10 leading-relaxed text-lg">
          ابدأ تجربة الامتحان التنافسي. يتكون هذا النموذج من اسئلة تحاكي النمط الحقيقي للامتحانات التي تجريها الهيئة.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-right">
            <h3 className="font-bold text-slate-900 mb-1">المدة</h3>
            <p className="text-slate-500 text-sm">60 دقيقة</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-right">
            <h3 className="font-bold text-slate-900 mb-1">عدد الأسئلة</h3>
            <p className="text-slate-500 text-sm">30 سؤال</p>
          </div>
        </div>
        <button
          onClick={startExam}
          className="bg-blue-900 text-white px-10 py-5 rounded-lg font-bold text-xl hover:bg-slate-900 transition-all shadow-xl shadow-blue-900/20"
        >
          ابدأ الامتحان الآن
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[2rem] border border-slate-200 shadow-sm"
        >
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-8">
            <Trophy className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">انتهى الامتحان!</h2>
          <p className="text-slate-500 mb-10">لقد أكملت كافة الأسئلة بنجاح.</p>
          
          <div className="flex justify-center gap-10 mb-12">
            <div>
              <div className="text-5xl font-black text-slate-900">{score}</div>
              <div className="text-sm text-slate-500 font-medium">الإجابات الصحيحة</div>
            </div>
            <div className="w-px h-16 bg-slate-100" />
            <div>
              <div className="text-5xl font-black text-slate-900">{SAMPLE_QUESTIONS.length}</div>
              <div className="text-sm text-slate-500 font-medium">إجمالي الأسئلة</div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={startExam}
              className="bg-blue-900 text-white px-8 py-4 rounded-lg font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              إعادة المحاولة
            </button>
            <button
              onClick={() => setStarted(false)}
              className="text-slate-500 font-bold hover:text-blue-900 transition-colors"
            >
              العودة للرئيسية
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const q = SAMPLE_QUESTIONS[currentIdx];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Progress */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">سؤال {currentIdx + 1} من {SAMPLE_QUESTIONS.length}</span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">التقدم المحرز</h2>
          </div>
          <span className="text-blue-900 font-mono font-bold">{Math.round(((currentIdx + 1) / SAMPLE_QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIdx + 1) / SAMPLE_QUESTIONS.length) * 100}%` }}
            className="h-full bg-blue-900 rounded-full"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-sm text-right">
        <h3 className="text-2xl font-bold text-slate-900 mb-10 leading-relaxed">
          {q.text}
        </h3>

        <div className="grid grid-cols-1 gap-4 mb-12">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`p-6 rounded-xl border-2 text-right text-lg font-medium transition-all flex items-center justify-between group ${
                answers[currentIdx] === idx
                  ? "border-blue-900 bg-blue-50 text-blue-900"
                  : "border-slate-50 hover:border-slate-200 text-slate-600"
              }`}
            >
              {opt}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                answers[currentIdx] === idx ? "border-blue-900 bg-blue-900" : "border-slate-200"
              }`}>
                {answers[currentIdx] === idx && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-slate-100">
          <button
            onClick={prev}
            disabled={currentIdx === 0}
            className="px-6 py-3 rounded-lg font-bold text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all flex items-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            السابق
          </button>
          <button
            onClick={next}
            disabled={answers[currentIdx] === undefined}
            className="bg-blue-900 text-white px-10 py-4 rounded-lg font-bold hover:bg-slate-950 disabled:bg-slate-200 disabled:cursor-not-allowed transition-all flex items-center gap-2 group"
          >
            {currentIdx === SAMPLE_QUESTIONS.length - 1 ? "إنهاء الامتحان" : "التالي"}
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
