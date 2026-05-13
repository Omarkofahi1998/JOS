import React, { useState, useRef } from "react";
import { Award, Users, Target, CheckCircle2, Sparkles, Briefcase, Rocket, ArrowRight, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";

export default function ServiceProviderRegistration() {
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    phone: '', 
    serviceCategory: 'كتابة السير الذاتية', 
    portfolioLink: '', 
    experience: '',
    yearsInField: '',
    previousClients: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let fileUrl = null;
    try {
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const { data, error: uploadError } = await supabase.storage
              .from('submissions')
              .upload(fileName, file);
            
            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
            fileUrl = publicUrlData.publicUrl;
        }

        const { error } = await supabase.from('system_submissions').insert([
            {
                type: 'service_provider',
                full_name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                content: formData.experience,
                metadata: {
                  service_category: formData.serviceCategory,
                  portfolio_link: formData.portfolioLink,
                  years_in_field: formData.yearsInField,
                  previous_clients: formData.previousClients,
                  certificate_url: fileUrl
                },
                status: 'pending'
            }
        ]);

        if (error) throw error;
        setSubmitted(true);
    } catch (err: any) {
        alert("Error submitting registration: " + err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const categories = [
    "كتابة السير الذاتية",
    "التدريب المهني (Coaching)",
    "إعداد المقابلات",
    "تصميم الملف الشخصي (LinkedIn)",
    "الاستشارات الوظيفية",
    "أخرى"
  ];

  const benefits = [
    { icon: <Sparkles className="w-8 h-8 text-emerald-500" />, title: "فرص نمو مستمرة", description: "قدم خدماتك لآلاف الطلاب والمهنيين في الأردن والوطن العربي." },
    { icon: <Briefcase className="w-8 h-8 text-blue-500" />, title: "دخل إضافي مميز", description: "احصل على عوائد مجزية مقابل خبراتك وخدماتك المهنية." },
    { icon: <Rocket className="w-8 h-8 text-purple-500" />, title: "بناء سمعتك", description: "كن جزءاً من فريق خبراء منصة JO Students الرائدة." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12" dir="rtl">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 text-center mt-8 mb-16">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-black text-slate-900 mb-6"
            >
                انضم إلى فريق <span className="text-emerald-600">الخبراء</span>
            </motion.h1>
            <p className="text-lg text-slate-600 font-bold max-w-2xl mx-auto">
                هل تمتلك الخبرة في تقديم الخدمات المهنية؟ كن جزءاً من عائلتنا وساعد الآخرين في بناء مستقبلهم.
            </p>
        </div>

        {/* Benefits Section */}
        <div className="max-w-7xl mx-auto px-4 mb-20">
            <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
                <motion.div 
                    key={i} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all"
                >
                    <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">{b.icon}</div>
                    <h3 className="text-xl font-black mb-2">{b.title}</h3>
                    <p className="text-slate-600 text-sm font-bold leading-relaxed">{b.description}</p>
                </motion.div>
            ))}
            </div>
        </div>

        {/* Form Section */}
        <div className="max-w-3xl mx-auto px-4 pb-20">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100">
            <h2 className="text-2xl font-black mb-10 text-center text-slate-800">بيانات مزود الخدمة</h2>
            
            {submitted ? (
                <div className="text-center py-10">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-slate-900">تم إرسال طلبك بنجاح!</h3>
                    <p className="text-slate-600 font-bold mb-8">شكراً لرغبتك في الانضمام إلينا. سيقوم فريق الخدمات المهنية بمراجعة ملفك وإثباتات الخبرة والتواصل معك قريباً عبر البريد الإلكتروني.</p>
                    <Link to="/" className="inline-flex items-center gap-2 text-blue-600 font-black text-sm hover:underline">
                        العودة للرئيسية
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">الاسم الكامل *</label>
                        <input 
                            required 
                            type="text" 
                            placeholder="الاسم الرباعي"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold" 
                            onChange={e => setFormData({...formData, fullName: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">نوع الخدمة الأساسية *</label>
                        <select 
                            required 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold appearance-none" 
                            onChange={e => setFormData({...formData, serviceCategory: e.target.value})}
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">البريد الإلكتروني *</label>
                        <input 
                            required 
                            type="email" 
                            placeholder="example@email.com"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold" 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">رقم الهاتف التواصل *</label>
                        <input 
                            required 
                            type="tel" 
                            placeholder="07XXXXXXXX"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold" 
                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">سنوات الخبرة في هذا المجال *</label>
                        <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold" placeholder="مثلاً: 3" onChange={e => setFormData({...formData, yearsInField: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">رابط أعمالك / LinkedIn (مهم جداً) *</label>
                        <input 
                            required
                            type="url" 
                            placeholder="https://..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold" 
                            onChange={e => setFormData({...formData, portfolioLink: e.target.value})} 
                        />
                    </div>
                </div>

                {/* Verification Proofs */}
                <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">إثباتات الخبرة ونماذج الأعمال</h3>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase mr-1">شهادات خبرة أو نماذج أعمال (PDF/صور) *</span>
                        <input type="file" ref={fileInputRef} onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                        <div 
                           className="flex flex-col items-center justify-center w-full h-32 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 cursor-pointer transition-all"
                           onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud className="w-6 h-6 text-slate-300 mb-2" />
                            <span className="text-xs font-bold text-slate-400">{file ? file.name : "تحميل ملف"}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">أهم 3 عملاء أو جهات تعاملت معها سابقاً</label>
                    <input 
                        type="text" 
                        placeholder="فرد، شركة س، مؤسسة ص..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold" 
                        onChange={e => setFormData({...formData, previousClients: e.target.value})} 
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2 mr-1">وصف تفصيلي للخبرات والمهارات *</label>
                    <textarea 
                        required 
                        placeholder="اشرح لنا مهاراتك والنتائج التي حققتها لعملائك السابقين..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-40 focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold" 
                        onChange={e => setFormData({...formData, experience: e.target.value})} 
                    />
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 font-bold leading-relaxed">
                        بتقديمك لهذا الطلب، أنت تتعهد بصحة كافة البيانات المرفقة وتوافق على مراجعة فريقنا المهني لملفك لضمان جودة الخدمات المقدمة لمستخدمينا.
                    </p>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50" 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "جاري المعالجة..." : "إرسال طلب الانضمام كخبير"}
                </button>

                <div className="text-center mt-6">
                  <p className="text-xs font-bold text-slate-400 mb-2">هل لديك حساب بالفعل؟</p>
                  <Link to="/professional-services/login" className="text-blue-600 font-black text-sm hover:underline">
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
