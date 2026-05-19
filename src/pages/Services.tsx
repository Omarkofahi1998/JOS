import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { FileUser, Settings, Briefcase, UserCheck, MessageSquare, Sparkles, ArrowLeft, Users, Send, Loader2, FileText, Search, X, CheckCircle, Share2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Services() {
  const navigate = useNavigate();
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const handleShare = async (e: React.MouseEvent, service: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#/service/${service.id}`;
    const text = `اكتشف خدمة ${service.title} على منصة طلاب الأردن - بوابتك للتميز المهني.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: service.title,
          text: text,
          url: url,
        });
      } catch (err) {
        console.log("Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        alert("تم نسخ رابط الخدمة بنجاح!");
      } catch (err) {
        console.error("Clipboard failed:", err);
      }
    }
  };

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    async function fetchProfile(uid: string) {
      const { data } = await supabase!.from('profiles').select('*').eq('id', uid).single();
      if (data) setProfile(data);
    }
      async function fetchServices() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, title, description, icon_name, bg_color, provider_id, price, category, thumbnail_url, contact_info, contact_method')
          .eq('status', 'active');
        
        if (data && !error) {
          const iconMap: { [key: string]: any } = {
            FileText, Settings, Briefcase, UserCheck, MessageSquare, Sparkles, Users, Search, FileUser
          };
          
          const colorMap: { [key: string]: string } = {
            "bg-blue-50": "text-blue-600",
            "bg-emerald-50": "text-emerald-600",
            "bg-red-50": "text-red-600",
            "bg-amber-50": "text-amber-600",
            "bg-purple-50": "text-purple-600",
            "bg-slate-50": "text-slate-600"
          };
          
          const mapped = data.map(s => {
            const IconComponent = iconMap[s.icon_name] || Settings;
            const bgColor = s.bg_color || "bg-slate-50";
            const textColor = colorMap[bgColor] || "text-slate-600";
            
            return {
              id: s.id,
              title: s.title,
              desc: s.description,
              icon: <IconComponent className={`w-10 h-10 ${textColor}`} />,
              thumbnail: s.thumbnail_url,
              color: bgColor,
              provider_id: s.provider_id,
              price: s.price,
              category: s.category,
              isReal: true
            };
          });

          setServicesList(mapped);
        } else {
          setServicesList([]);
        }
      } catch (err) {
        console.error("Supabase Error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchServices();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header Section - Compact & Slim */}
      <section className="bg-slate-950 text-white pt-10 pb-10 md:pt-12 md:pb-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full mb-4 border border-white/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[9px] md:text-xs font-black uppercase tracking-wider text-slate-300">شركاء نجاحك في المسار المهني</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center"
          >
            <h1 className="text-xl md:text-3xl font-black leading-tight max-w-3xl mx-auto">
              خدمات احترافية تفتح لك <span className="text-red-500">أبواب المستقبل</span>
            </h1>
          </motion.div>
        </div>
        
        {/* Abstract Background Elements - Adjusted for very slim height */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-600/10 rounded-full blur-[100px] -z-0 -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] -z-0 -ml-32 -mb-32" />
      </section>

      {/* Description and CTA Section - Now below the dark hero */}
      <section className="bg-white border-b border-slate-100 py-10 md:py-16 text-center relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-slate-500 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed mb-8 font-medium"
          >
            نحن هنا لنكون شريكك في رحلة التوظيف. لا نكتفي بالتدريب، بل نسعى لتمكينك بكافة الأدوات المهنية اللازمة للتميز في سوق العمل.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Link 
              to="/service-provider-registration" 
              className="inline-flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-red-600 text-white rounded-2xl text-sm md:text-base font-black shadow-xl shadow-red-600/20 hover:bg-slate-900 transition-all active:scale-95 group"
            >
              <span>كن جزءاً من فريق خبراءنا</span>
              <Send className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative z-20">
        {/* Loading State or Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1,2,3].map(i => <div key={i} className="aspect-[4/5] bg-white rounded-3xl animate-pulse border border-slate-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesList.map((s, i) => (
              <motion.div
                key={i}
                id={`service-${i}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white p-5 md:p-6 rounded-[1.75rem] border border-slate-100 hover:border-red-100 hover:shadow-2xl hover:shadow-red-600/5 transition-all text-right relative overflow-hidden scroll-mt-28 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${s.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 overflow-hidden`}>
                    {s.thumbnail ? (
                      <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                      s.icon
                    )}
                  </div>
                  <h3 className="text-sm md:text-base font-black text-slate-900 mb-2 group-hover:text-red-600 transition-colors leading-tight">{s.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-[11px] md:text-xs mb-4 font-bold line-clamp-3">
                    {s.desc}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <button 
                    onClick={() => s.isReal ? navigate(`/service/${s.id}`) : alert("هذه الخدمة ستتوفر قريباً")}
                    className="flex items-center gap-1.5 text-red-600 font-black text-[11px] md:text-xs hover:gap-2.5 transition-all group/btn"
                  >
                    <span>احجز الآن</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover/btn:-translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={(e) => handleShare(e, s)}
                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 rounded-xl transition-all hover:bg-red-50"
                    title="مشاركة الخدمة"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <div className="flex -space-x-1.5 rtl:space-x-reverse opacity-40">
                     {[1,2,3].map(j => <div key={j} className="w-4 h-4 rounded-full bg-slate-200 border-2 border-white" />)}
                  </div>
                </div>

                {/* Subtle Decorative Background Text */}
                <div className="absolute -bottom-2 -left-2 text-slate-100 font-black text-4xl select-none opacity-20 group-hover:opacity-40 transition-opacity">
                  {i + 1}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
