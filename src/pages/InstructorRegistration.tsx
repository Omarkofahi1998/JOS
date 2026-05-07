import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Award, Users, Target } from "lucide-react";

export default function InstructorRegistration() {
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', major: '', experience: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('instructor_requests').insert({
        ...formData,
        status: 'pending',
        created_at: new Date().toISOString()
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
    <div className="min-h-screen bg-slate-50 py-12">
        {/* Benefits Section */}
        <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">{b.icon}</div>
                <h3 className="text-xl font-black mb-2">{b.title}</h3>
                <p className="text-slate-600">{b.description}</p>
                </div>
            ))}
            </div>
        </div>

        {/* Form Section */}
        <div className="max-w-2xl mx-auto px-4 pb-20">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
            <h2 className="text-3xl font-black mb-8 text-center">قدم طلب انضمامك الآن</h2>
            
            {submitted ? (
                <div className="text-center py-10">
                <div className="text-green-600 text-5xl mb-4">✓</div>
                <h3 className="text-2xl font-bold mb-2">تم استلام طلبك!</h3>
                <p className="text-slate-600">شكراً لاهتمامك، سيقوم فريقنا بمراجعة خبراتك والتواصل معك قريباً.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل</label>
                    <input required type="text" className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none" onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                        <input required type="email" className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none" onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                        <input required type="tel" className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none" onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">التخصص</label>
                    <input required type="text" className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none" onChange={e => setFormData({...formData, major: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">نبذة عن خبرتك</label>
                    <textarea required className="w-full p-4 border border-slate-200 rounded-xl h-32 focus:ring-2 focus:ring-red-600 outline-none" onChange={e => setFormData({...formData, experience: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95" disabled={isSubmitting}>
                    {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
                </button>
                </form>
            )}
            </div>
        </div>
    </div>
  );
}
