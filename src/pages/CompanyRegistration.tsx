import React, { useState } from "react";
import { Building2, Globe, Mail, User, ShieldCheck, MapPin, CheckCircle2, Search, Briefcase, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";

export default function CompanyRegistration() {
  const [formData, setFormData] = useState({ 
    companyName: '', 
    industry: '', 
    website: '', 
    contactPerson: '', 
    email: '', 
    location: '',
    about: '',
    employeesCount: '1-10',
    hrPhone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileName, setLogoFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        let finalLogoUrl = "";
        if (logoFile) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', logoFile);
          formDataUpload.append('folder', 'uploads/companies');

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const data = await response.json();
          finalLogoUrl = data.publicUrl;
        }

        const { error } = await supabase.from('system_submissions').insert([
            {
                type: 'business',
                full_name: formData.contactPerson,
                email: formData.email,
                phone: formData.hrPhone,
                content: formData.about,
                metadata: {
                  company_name: formData.companyName,
                  industry: formData.industry,
                  website: formData.website,
                  location: formData.location,
                  logo_url: finalLogoUrl
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

  return (
    <div className="min-h-screen bg-[#F3F2EF] py-12" dir="rtl">
        {/* Header Section */}
        <div className="max-w-4xl mx-auto px-4 text-center mt-8 mb-12">
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-20 h-20 bg-[#0A66C2] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20"
            >
                <Building2 className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black text-[#0A66C2] mb-4"
            >
                سجل شركتك في <span className="text-slate-900 underline decoration-4 decoration-blue-200">JOin</span>
            </motion.h1>
            <p className="text-slate-600 font-bold max-w-xl mx-auto">
                استقطب أفضل الكفاءات الأكاديمية والمهنية الأردنية مباشرة من خلال منصتنا الموثوقة.
            </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-start">
            {/* Benefits Content */}
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-[#0A66C2]">
                        <Building2 className="w-6 h-6 text-emerald-500" />
                        نشر الوظائف على JOin
                    </h3>
                    <p className="text-sm text-slate-500 font-bold mb-6 leading-relaxed">
                        استفد من منصتنا للوصول للطلاب والمهنيين المميزين في الأردن.
                    </p>
                    <div className="space-y-6">
                        {[
                            { title: "وصول مباشر للطلاب", desc: "نربطك بآلاف الطلاب والخريجين الذين يبحثون عن فرص." },
                            { title: "سهولة إدارة الوظائف", desc: "نظام بسيط لنشر وتعديل ومتابعة طلبات التوظيف." },
                            { title: "تعزيز حضورك الرقمي", desc: "صفحة مخصصة لمنشأتك تظهر مشاريعك وثقافتك العملية." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /></div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-sm">{item.title}</h4>
                                    <p className="text-xs text-slate-500 font-bold">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#E7F3FF] p-6 rounded-3xl text-center border border-blue-100">
                        <div className="text-3xl font-black text-[#0A66C2] mb-1">5K+</div>
                        <div className="text-xs font-black text-slate-600 uppercase tracking-wider">مستخدم نشط</div>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-3xl text-center border border-emerald-100">
                        <div className="text-3xl font-black text-emerald-600 mb-1">200+</div>
                        <div className="text-xs font-black text-slate-600 uppercase tracking-wider">شركة مسجلة</div>
                    </div>
                </div>
            </div>

            {/* Registration Form */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-200">
                {submitted ? (
                    <div className="text-center py-10">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-black mb-2 text-slate-900">تم استلام طلب التسجيل!</h3>
                        <p className="text-slate-500 font-bold leading-relaxed px-4">
                            شكراً لتزويدنا ببيانات المنشأة. سيقوم فريقنا بمراجعة طلبك وتفعيل حسابك خلال يوم عمل لتبدأ بنشر الوظائف.
                        </p>
                        <button 
                            onClick={() => window.location.href = '/job-board'}
                            className="mt-8 bg-[#0A66C2] text-white px-8 py-3 rounded-full font-black hover:bg-[#004182] transition-all"
                        >
                            العودة لصفحة الوظائف
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h2 className="text-lg font-black mb-6 text-slate-800 border-r-4 border-[#0A66C2] pr-4">بيانات المنشأة</h2>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 mr-1 flex items-center gap-1.5">
                                    <Building2 className="w-3 h-3" /> اسم الشركة الرسمي *
                                </label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0A66C2] outline-none transition-all font-bold text-sm" onChange={e => setFormData({...formData, companyName: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 mr-1 flex items-center gap-1.5">
                                    <Briefcase className="w-3 h-3" /> قطاع العمل *
                                </label>
                                <input required type="text" placeholder="مثلاً: تكنولوجيا، تعليم..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0A66C2] outline-none transition-all font-bold text-sm" onChange={e => setFormData({...formData, industry: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 mr-1 flex items-center gap-1.5">
                                    <Globe className="w-3 h-3" /> الموقع الإلكتروني
                                </label>
                                <input type="url" placeholder="www.example.com" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0A66C2] outline-none transition-all font-bold text-sm" onChange={e => setFormData({...formData, website: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 mr-1 flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3" /> العنوان الرئيسي *
                                </label>
                                <input required type="text" placeholder="مثلاً: عمان، شارع مكة" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0A66C2] outline-none transition-all font-bold text-sm" onChange={e => setFormData({...formData, location: e.target.value})} />
                            </div>
                        </div>

                        {/* Documents Section */}
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                            <h3 className="text-[11px] font-black text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-wide">الملفات (اختياري)</h3>
                            <div className="space-y-1">
                                <label className="p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition-all border-dashed text-center block relative">
                                    {isUploading ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                                        <span className="text-[10px] font-bold text-slate-400">جاري الرفع...</span>
                                      </div>
                                    ) : logoFile ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        <span className="text-[10px] font-bold text-slate-900 truncate max-w-[150px]">{logoFileName}</span>
                                      </div>
                                    ) : (
                                      <>
                                        <Sparkles className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                                        <span className="text-[10px] font-bold text-slate-400 block">شعار الشركة (PNG/JPG)</span>
                                      </>
                                    )}
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setLogoFile(file);
                                          setLogoFileName(file.name);
                                        }
                                      }}
                                    />
                                </label>
                            </div>
                        </div>

                        <h2 className="text-lg font-black mb-6 text-slate-800 border-r-4 border-[#0A66C2] pr-4 mt-8">بيانات ضابط الارتباط (HR)</h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 mr-1 flex items-center gap-1.5">
                                    <User className="w-3 h-3" /> اسم المسؤول *
                                </label>
                                <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0A66C2] outline-none transition-all font-bold text-sm" onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 mr-1 flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" /> البريد الإلكتروني المهني *
                                </label>
                                <input required type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0A66C2] outline-none transition-all font-bold text-sm" onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 mr-1 flex items-center gap-1.5">
                                <Search className="w-3 h-3" /> نبذة عن المنشأة ومشاريعها *
                            </label>
                            <textarea required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-24 focus:ring-2 focus:ring-[#0A66C2] outline-none transition-all font-bold text-sm" placeholder="تحدث بإيجاز عن طبيعة عمل الشركة..." onChange={e => setFormData({...formData, about: e.target.value})} />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting || isUploading}
                            className="w-full bg-[#0A66C2] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#004182] transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSubmitting ? "جاري إرسال البيانات..." : (
                                <>
                                    <Building2 className="w-5 h-5" />
                                    تسجيل المنشأة الآن
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    </div>
  );
}
