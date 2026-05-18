import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ArrowRight, Phone, Mail, MessageSquare, 
  Sparkles, ShieldCheck, Clock, Share2, 
  ChevronLeft, Star, ExternalLink, CheckCircle2 
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    async function fetchServiceData() {
      if (!id || !supabase) return;
      
      try {
        setLoading(true);
        // Fetch service details
        const { data: serviceData, error: sError } = await supabase
          .from('services')
          .select('*')
          .eq('id', id)
          .single();

        if (sError) throw sError;
        setService(serviceData);

        // Fetch provider profile
        if (serviceData.provider_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', serviceData.provider_id)
            .single();
          setProvider(profileData);
        }
      } catch (err) {
        console.error("Error fetching service:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchServiceData();
  }, [id]);

  const handleContact = () => {
    if (!service) return;

    const { contact_method, contact_info } = service;

    if (contact_method === 'whatsapp') {
      const cleanPhone = contact_info.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    } else if (contact_method === 'email') {
      window.location.href = `mailto:${contact_info}?subject=طلب خدمة: ${service.title}`;
    } else if (contact_method === 'phone') {
      window.location.href = `tel:${contact_info}`;
    } else {
      // Default fallback if no method specified
      alert("طريقة التواصل غير محددة، يرجى المحاولة لاحقاً");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-4">عذراً، الخدمة غير موجودة</h2>
        <button onClick={() => navigate('/services')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold">العودة للخدمات</button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-right" dir="rtl">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-[50]">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/services')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة للخدمات</span>
          </button>
          <div className="flex items-center gap-4">
             <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-all border border-slate-100">
               <Share2 className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* Main Info Section */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-red-50 text-red-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                  {service.category}
                </span>
                <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  خدمة احترافية معتمدة
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6">
                {service.title}
              </h1>

              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                  {service.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
                 {[
                   { icon: <ShieldCheck className="w-5 h-5" />, text: "ضمان الجودة", sub: "مراجعة احترافية" },
                   { icon: <Clock className="w-5 h-5" />, text: "تسليم سريع", sub: "خلال 24-48 ساعة" },
                   { icon: <Star className="w-5 h-5" />, text: "دعم مخصص", sub: "تعديلات غير محدودة" }
                 ].map((item, i) => (
                   <div key={i} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 text-center flex flex-col items-center">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 mb-3 shadow-sm">
                       {item.icon}
                     </div>
                     <p className="text-sm font-black text-slate-900">{item.text}</p>
                     <p className="text-[10px] font-bold text-slate-400 mt-0.5">{item.sub}</p>
                   </div>
                 ))}
              </div>
            </motion.div>

            {/* Steps / Process */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-slate-950 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-red-500" />
                  كيف تعمل الخدمة؟
                </h3>
                <div className="space-y-8">
                   {[
                     { step: "01", title: "تواصل مع الخبير", desc: "اضغط على زر احجز الآن وابدأ محادثة لمناقشة احتياجاتك." },
                     { step: "02", title: "مراجعة المتطلبات", desc: "سيطلب منك الخبير تزويده بالملفات أو التفاصيل اللازمة." },
                     { step: "03", title: "استلام العمل", desc: "سيتم تنفيذ الخدمة بجودة عالية وإرسالها لك في الموعد المحدد." }
                   ].map((item, i) => (
                     <div key={i} className="flex gap-6 items-start">
                        <span className="text-3xl font-black text-white/10">{item.step}</span>
                        <div>
                          <h4 className="font-black text-lg mb-1">{item.title}</h4>
                          <p className="text-slate-400 text-sm font-bold leading-relaxed">{item.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
            </motion.div>
          </div>

          {/* Sidebar / CTA Section */}
          <div className="space-y-6">
            {/* Booking Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-32"
            >
              <div className="text-center mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">سعر الخدمة</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-slate-900">{service.price}</span>
                  <span className="text-lg font-black text-slate-400">JOD</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                 {[
                   "تسليم إلكتروني مباشر",
                   "مراجعة لغوية كاملة",
                   "دعم فني بعد التسليم"
                 ].map((t, i) => (
                   <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t}</span>
                   </div>
                 ))}
              </div>

              <button 
                onClick={handleContact}
                className="w-full h-16 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 group active:scale-95 mb-4"
              >
                <span>احجز الآن وتواصل</span>
                {service.contact_method === 'whatsapp' ? <MessageSquare className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
              </button>
              
              <p className="text-center text-[10px] font-bold text-slate-400 leading-relaxed px-4">
                تواصل مباشر مع الخبير لضمان أفضل نتيجة لطلبك
              </p>
            </motion.div>

            {/* Provider Info Card */}
            {provider && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
              >
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">عن مقدم الخدمة</h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black">
                     {provider.full_name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-sm leading-tight">{provider.full_name}</h5>
                    <p className="text-[10px] font-bold text-slate-400">{provider.major || 'خبير معتمد'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-orange-400 mb-4">
                   {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-current" />)}
                   <span className="text-[10px] font-black text-slate-900 mr-1">5.0</span>
                </div>
                <button className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                  <ExternalLink className="w-3 h-3" />
                  الملف الشخصي
                </button>
              </motion.div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
