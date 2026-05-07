import React, { useState, useEffect } from "react";
import { Send, Phone, Mail, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [contactInfo, setContactInfo] = useState({
     email: "",
     phone: "",
     address: ""
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  useEffect(() => {
     const fetchSettings = async () => {
        if (!supabase) return;
        const { data } = await supabase.from('site_settings').select('key, value');
        if (data) {
           const settings: any = {};
           data.forEach(item => settings[item.key] = item.value);
           setContactInfo({
              email: settings.contact_email || "info@jo-students.com",
              phone: settings.contact_phone || "07XXXXXXXX",
              address: settings.contact_address || "عمان، الأردن"
           });
        }
     };
     fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          ...formData,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setStatus({ type: 'success', msg: "تم إرسال رسالتك بنجاح. سنرد عليك في أقرب وقت ممكن." });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      console.error("Error sending message:", err);
      setStatus({ type: 'error', msg: "عذراً، حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة لاحقاً." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">تواصل معنا</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            نحن هنا للإجابة على استفساراتك ومساعدتك في رحلتك نحو التميز المهني.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-right">
              <div className="flex items-start gap-4 justify-end">
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">موقعنا</h3>
                  <p className="text-slate-500 text-sm">{contactInfo.address}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-right">
              <div className="flex items-start gap-4 justify-end">
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">اتصل بنا</h3>
                  <p className="text-slate-500 text-sm">{contactInfo.phone}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-right">
              <div className="flex items-start gap-4 justify-end">
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">بريدنا الإلكتروني</h3>
                  <p className="text-slate-500 text-sm">{contactInfo.email}</p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-sm">
              {status && (
                <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 justify-end text-right ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  <p className="font-bold">{status.msg}</p>
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <Send className="w-5 h-5 flex-shrink-0" />}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase">الاسم الكامل</label>
                    <input
                      type="text"
                      required
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 focus:bg-white text-right text-sm"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 focus:bg-white text-left text-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">الموضوع</label>
                  <input
                    type="text"
                    required
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 focus:bg-white text-right text-sm"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">رسالتك</label>
                  <textarea
                    required
                    rows={6}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-red-600 focus:bg-white text-right text-sm"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  إرسال الرسالة
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
