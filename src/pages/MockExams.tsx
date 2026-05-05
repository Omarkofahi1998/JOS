import { useState } from "react";
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
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-900 mx-auto mb-6">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">الامتحانات التجريبية</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          ابدأ تجربة الامتحان التنافسي. يتكون هذا النموذج من اسئلة تحاكي النمط الحقيقي للامتحانات.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 text-right">
            <h3 className="font-bold text-slate-900 mb-1 text-sm">المدة</h3>
            <p className="text-slate-500 text-xs text-left">60 دقيقة</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 text-right">
            <h3 className="font-bold text-slate-900 mb-1 text-sm">عدد الأسئلة</h3>
            <p className="text-slate-500 text-xs text-left">30 سؤال</p>
          </div>
        </div>
        <button
          onClick={startExam}
          className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-slate-900 transition-all shadow-lg shadow-red-600/20"
        >
          ابدأ الامتحان الآن
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-12 rounded-[2rem] border border-slate-200 shadow-sm">
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
              className="bg-red-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
            >
              <RotateCcw className="w-5 h-5" />
              إعادة المحاولة
            </button>
            <button
              onClick={() => setStarted(false)}
              className="text-slate-500 font-bold hover:text-red-600 transition-colors"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
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
          <div
            className="h-full bg-red-600 rounded-full"
            style={{ width: `${((currentIdx + 1) / SAMPLE_QUESTIONS.length) * 100}%` }}
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
            className={`px-10 py-4 rounded-lg font-bold transition-all flex items-center gap-2 group shadow-lg ${
              currentIdx === SAMPLE_QUESTIONS.length - 1 
                ? "bg-green-600 hover:bg-green-700 text-white shadow-green-600/20" 
                : "bg-red-600 hover:bg-slate-900 text-white shadow-red-600/20"
            } disabled:bg-slate-200 disabled:shadow-none disabled:cursor-not-allowed`}
          >
            {currentIdx === SAMPLE_QUESTIONS.length - 1 ? "إنهاء الامتحان" : "التالي"}
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
