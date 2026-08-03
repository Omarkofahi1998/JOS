import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { Award, Users, Target } from "lucide-react";

export default function InstructorRegistration() {
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    phone: '', 
    major: '', 
    experience: '', 
    yearsOfExperience: '', 
    linkedin: '', 
    degree: 'بكالوريوس' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsSubmitting(true);
    try {
      let finalCvUrl = "";
      if (cvFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', cvFile);
        formDataUpload.append('folder', 'uploads/instructors');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        const text = await response.text();
        if (text.trim().startsWith("<") || text.trim().startsWith("The page")) {
          throw new Error("خطأ في الاتصال بالخادم عند رفع الملف. يرجى فتح التطبيق في علامة تبويب مستقلة لتجاوز قيود المتصفح الأمنية.");
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("حدث خطأ أثناء قراءة استجابة الخادم لرفع الملف.");
        }

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        finalCvUrl = data.publicUrl;
      }

      const { error } = await supabase.from('system_submissions').insert({
        type: 'instructor',
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        content: formData.experience,
        metadata: {
          major: formData.major,
          degree: formData.degree,
          years_of_experience: formData.yearsOfExperience,
          linkedin_url: formData.linkedin,
          file_url: finalCvUrl
        },
        status: 'pending'
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      alert("حدث خطأ أثناء الإرسال: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: <Award className="w-8 h-8 text-red-500" />, title: "التطوير المهني", description: "عزز مكانتك كخبير في تخصصك وشارك في مشاريع تعليمية رائدة." },
    { icon: <Users className="w-8 h-8 text-green-500" />, title: "مجتمع المبدعين", description: "انضم إلى نخبة من المدربين والمعلمين في مختلف التخصصات." },
    { icon: <Target className="w-8 h-8 text-blue-500" />, title: "تطوير المحتوى", description: "ساهم في بناء مستقبل التعليم الرقمي بأحدث الأساليب." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12" dir="rtl">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 text-center mt-8 mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
                سجل كمدرب <span className="text-red-600">أكاديمي</span>
            </h1>
            <p className="text-lg text-slate-600 font-bold max-w-2xl mx-auto">
                ساعد في بناء جيل المستقبل وشارك خبراتك الأكاديمية مع آلاف الطلاب.
            </p>
        </div>

        {/* Benefits Section */}
        <div className="max-w-7xl mx-auto px-4 mb-20">
            <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">{b.icon}</div>
                <h3 className="text-xl font-black mb-2">{b.title}</h3>
                <p className="text-slate-600 text-sm font-bold">{b.description}</p>
                </div>
            ))}
            </div>
        </div>

        {/* Form Section */}
        <div className="max-w-3xl mx-auto px-4 pb-20">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100">
            <h2 className="text-2xl font-black mb-8 text-center text-slate-800">طلب اعتماد مدرس/مدرب</h2>
            
            {submitted ? (
                <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-green-600 text-4xl font-bold">✓</div>
                </div>
                <h3 className="text-2xl font-bold mb-2">تم استلام طلبك بنجاح!</h3>
                <p className="text-slate-600 font-bold leading-relaxed">شكراً لاهتمامك بالانضمام إلينا. سيقوم القسم الأكاديمي بمراجعة السيرة الذاتية والشهادات المرفقة، وسنتواصل معك خلال أيام العمل القادمة.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 mr-1">الاسم الكامل *</label>
                        <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold" placeholder="الاسم رباعي" onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 mr-1">أعلى درجة علمية *</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-bold" onChange={e => setFormData({...formData, degree: e.target.value})}>
                            <option>بكالوريوس</option>
                            <option>ماجستير</option>
                            <option>دكتوراة</option>
                            <option>دبلوم عالي</option>
                        </select>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 mr-1">البريد الإلكتروني *</label>
                        <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold" placeholder="example@email.com" onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 mr-1">رقم الهاتف *</label>
                        <input required type="tel" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold" placeholder="07XXXXXXXX" onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 mr-1">التخصص الأكاديمي *</label>
                        <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold" placeholder="مثلاً: لغة عربية، فيزياء..." onChange={e => setFormData({...formData, major: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 mr-1">عدد سنوات الخبرة *</label>
                        <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold" placeholder="مثلاً: 5" onChange={e => setFormData({...formData, yearsOfExperience: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 mr-1">رابط حساب LinkedIn أو CV (رابط)</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold" placeholder="https://linkedin.com/in/... أو رابط السيرة الذاتية" onChange={e => setFormData({...formData, linkedin: e.target.value})} />
                </div>

                {/* Proof Section */}
                <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <h3 className="text-sm font-black mb-4 text-slate-700 flex items-center gap-2">الشهادات والخبرات (PDF/صور)</h3>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase mr-1">الشهادة الجامعية أو شهادات الخبرة *</span>
                        <label className="flex flex-col items-center justify-center w-full h-24 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 cursor-pointer transition-all relative overflow-hidden">
                            {isUploading ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-red-600 rounded-full animate-spin" />
                                <span className="text-[10px] font-bold text-slate-400">جاري الرفع...</span>
                              </div>
                            ) : cvFile ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-bold text-slate-700">{cvFileName}</span>
                                <span className="text-[10px] text-slate-400 truncate max-w-[200px]">تم اختيار الملف</span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-400">انقر لتحميل ملف (PDF/JPG)</span>
                            )}
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,image/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setCvFile(file);
                                  setCvFileName(file.name);
                                }
                              }}
                            />
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">تحدث عن أساليبك التدريسية وخبراتك السابقة *</label>
                    <textarea required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-40 focus:ring-2 focus:ring-red-600 outline-none transition-all font-bold" placeholder="اكتب بالتفصيل عن خبراتك والجهات التي عملت معها..." onChange={e => setFormData({...formData, experience: e.target.value})} />
                </div>

                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                    <p className="text-xs text-red-700 font-bold text-center">
                        ملاحظة: طلبكم يخضع لمعايير الجودة الأكاديمية والمهنية الخاصة بالمنصة.
                    </p>
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-red-600 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50" disabled={isSubmitting}>
                    {isSubmitting ? "جاري الإرسال..." : "تقديم طلب الاعتماد"}
                </button>

                <div className="text-center mt-6">
                  <p className="text-xs font-bold text-slate-400 mb-2">هل لديك حساب بالفعل؟</p>
                  <Link to="/instructor/login" className="text-red-600 font-black text-xs hover:underline">
                    تسجيل الدخول
                  </Link>
                </div>
                </form>
            )}
            </div>
        </div>
    </div>
  );
}
