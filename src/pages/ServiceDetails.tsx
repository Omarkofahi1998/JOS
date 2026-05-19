import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Share2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  contact_method: 'whatsapp' | 'email' | 'phone';
  contact_info: string;
  icon_name: string;
  bg_color: string;
  status: string;
  provider_id: string;
  thumbnail_url?: string;
}

export default function ServiceDetails() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchService(id);
  }, [id]);

  const fetchService = async (serviceId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase!
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("الخدمة غير موجودة");
      
      setService(data);
    } catch (err: any) {
      console.error("Error fetching service:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    if (!service) return;

    let url = '';
    const message = encodeURIComponent(`مرحباً، أود الاستفسار عن خدمة: ${service.title}`);

    if (service.contact_method === 'whatsapp') {
      url = `https://wa.me/${service.contact_info.replace(/\+/g, '')}?text=${message}`;
    } else if (service.contact_method === 'email') {
      url = `mailto:${service.contact_info}?subject=${encodeURIComponent(service.title)}&body=${message}`;
    } else if (service.contact_method === 'phone') {
      url = `tel:${service.contact_info}`;
    }

    if (url) window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Zap className="w-8 h-8 text-red-600" />
        </motion.div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">عذراً، لم نجد هذه الخدمة</h1>
        <p className="text-slate-500 mb-8 max-w-md">ربما تم حذف الخدمة أو أن الرابط غير صحيح. يرجى العودة لصفحة الخدمات الرئيسية.</p>
        <Link to="/services" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة للخدمات
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-right" dir="rtl">
      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-8">
          <Link to="/" className="hover:text-red-600 transition-colors">الرئيسية</Link>
          <ChevronLeft className="w-3 h-3" />
          <Link to="/services" className="hover:text-red-600 transition-colors">الخدمات المهنية</Link>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-slate-900">{service.title}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-10"
             >
               {service.thumbnail_url && (
                 <div className="mb-8 rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50">
                   <img src={service.thumbnail_url} alt={service.title} className="w-full h-auto aspect-video object-cover" />
                 </div>
               )}
               <span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">
                 {service.category}
               </span>
               <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
                 {service.title}
               </h1>
               
               <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-bold mb-10">
                 <div className="flex items-center gap-2">
                   <Clock className="w-4 h-4 text-red-500" />
                   <span>وقت الاستجابة: سريع جداً</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" />
                   <span>خدمة موثقة ومضمونة</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Zap className="w-4 h-4 text-blue-500" />
                   <span>تنفيذ احترافي</span>
                 </div>
               </div>

               <div className="prose prose-slate max-w-none">
                 <h3 className="text-xl font-black text-slate-900 mb-4 line-clamp-none">تفاصيل الخدمة</h3>
                 <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                   {service.description}
                 </p>
                 
                 <div className="mt-12 grid sm:grid-cols-2 gap-6">
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                     <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600 shrink-0">
                       <CheckCircle2 className="w-6 h-6" />
                     </div>
                     <div>
                       <h4 className="font-black text-slate-900 text-sm mb-1">جودة عالية</h4>
                       <p className="text-xs text-slate-500 font-medium">نضمن لك الحصول على أفضل النتائج بأعلى المعايير</p>
                     </div>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                     <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                       <MessageCircle className="w-6 h-6" />
                     </div>
                     <div>
                       <h4 className="font-black text-slate-900 text-sm mb-1">دعم متواصل</h4>
                       <p className="text-xs text-slate-500 font-medium">نتواصل معك في كل مراحل تنفيذ الخدمة</p>
                     </div>
                   </div>
                 </div>
               </div>
             </motion.div>
          </div>

          {/* Sidebar / Sidebar Call to Action */}
          <div className="lg:col-span-1">
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="sticky top-32"
            >
              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20">
                <div className="mb-8">
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">سعر الخدمة يبدأ من</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">{service.price}</span>
                    <span className="text-lg font-bold text-slate-400">JOD</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                   <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                     تنفيذ احترافي من قبل خبراء
                   </div>
                   <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                     متابعة وتحديثات دورية
                   </div>
                   <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                     ضمان استعادة الأموال
                   </div>
                </div>

                <button 
                  onClick={handleBooking}
                  className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3 group px-4"
                >
                  {service.contact_method === 'whatsapp' ? <MessageCircle className="w-5 h-5" /> : service.contact_method === 'email' ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                  احجز خدمتك الآن
                </button>

                <p className="text-center text-[10px] text-slate-500 font-bold mt-6 uppercase tracking-widest">
                   متاح حالياً للتواصل عبر {service.contact_method === 'whatsapp' ? 'الواتساب' : service.contact_method === 'email' ? 'الإيميل' : 'الهاتف'}
                </p>
              </div>

              <div className="mt-8 p-6 border border-slate-100 rounded-[2rem] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest">شارك الخدمة</span>
                </div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all">
                    <ArrowRight className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
