import { useState, useEffect } from "react";
import { FileText, Download, Bookmark, Clock, Eye, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Reviews() {
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function fetchReviews() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*');
        
        if (data && !error) {
          const mapped = data.map(r => ({
            id: r.id,
            title: r.title,
            desc: r.description || r.desc,
            date: r.file_date || r.date,
            author: r.author,
            readTime: r.read_time || r.readTime
          }));
          setReviewsList(mapped);
        }
      } catch (err) {
        console.error("Supabase Error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, []);
  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16 border-b border-neutral-100 pb-12">
        <div className="max-w-xl">
          <h1 className="text-4xl font-black text-neutral-900 mb-4">مراجعات ومصادر شاملة</h1>
          <p className="text-neutral-500">مجموعة من الملخصات والمقالات التوجيهية لمساعدتك في مرحلة التحضير النهائية قبل موعد الامتحان.</p>
        </div>
        <div className="flex bg-neutral-100 rounded-full p-1 self-start">
          <button className="bg-white text-neutral-900 px-6 py-2 rounded-full font-bold text-sm shadow-sm">الأحدث</button>
          <button className="text-neutral-500 px-6 py-2 rounded-full font-bold text-sm hover:text-neutral-900 transition-colors">الأكثر قراءة</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reviewsList.map((r) => (
          <article key={r.id} className="bg-white rounded-3xl border border-neutral-100 overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-neutral-500/5 transition-all">
            <div className="h-48 bg-neutral-100 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-neutral-200 to-transparent group-hover:scale-110 transition-transform duration-500" />
               <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                  <FileText className="w-16 h-16 opacity-50" />
               </div>
               <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-900 border border-white/20">
                 {r.author}
               </div>
            </div>
            
            <div className="p-8 flex-grow">
              <div className="flex items-center gap-4 text-xs text-neutral-400 font-bold mb-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {r.readTime}
                </div>
                <div className="w-1 h-1 bg-neutral-300 rounded-full" />
                <div>{r.date}</div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-900 transition-colors">
                {r.title}
              </h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                {r.desc}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <button className="flex items-center gap-2 text-slate-950 font-bold text-sm hover:bg-slate-50 px-4 py-2 rounded-lg transition-all border border-slate-100 shadow-sm">
                  <Eye className="w-4 h-4" />
                  قراءة
                </button>
                <button className="p-2 text-slate-400 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-all" title="حفظ للمراجعة">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Featured Resource Banner */}
      <div className="mt-20 bg-amber-50 rounded-2xl p-10 border border-amber-100 flex flex-col md:flex-row items-center gap-10 text-right">
        <div className="w-20 h-20 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
          <Download className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">الدليل الإرشادي الرسمي للامتحانات</h3>
          <p className="text-slate-600 leading-relaxed mb-4">يحتوي هذا الملف على كافة التعليمات والضوابط الخاصة بتقديم الامتحانات التنافسية والإجراءات المتبعة في الهيئة.</p>
          <button className="bg-amber-600 text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20">تحميل الدليل (PDF)</button>
        </div>
      </div>
    </div>
  );
}
