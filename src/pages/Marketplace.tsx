import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Filter, BookOpen, Video, FileText, 
  Users, Star, ChevronRight, ShoppingCart, 
  ArrowRight, Sparkles, Play, GraduationCap,
  Award, Navigation, Briefcase, X, CheckCircle, Loader2, ArrowLeft
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface Product {
  id: string | number;
  title: string;
  instructor_name: string;
  instructor_avatar?: string;
  price: number;
  old_price?: number;
  category: string;
  type: 'course' | 'session' | 'file';
  rating: number;
  students_count: number;
  thumbnail: string;
  description: string;
}

const categories = ["الكل", "دورات تدريبية", "التطوير المهني المستمر CPD", "امتحانات تنافسية وبنوك اسئلة"];

export default function Marketplace() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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
    fetchProducts();
  }, []);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase!
        .from('user_bookings')
        .insert([{
          client_id: user.id,
          user_name: profile?.full_name || user.email?.split('@')[0],
          user_email: user.email,
          item_id: selectedProduct?.id,
          item_type: 'course',
          amount: selectedProduct?.price || 0,
          provider_id: selectedProduct?.instructor_id,
          status: 'pending'
        }]);

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedProduct(null);
      }, 3000);
    } catch (err) {
      console.error("Error enrolling:", err);
      alert("حدث خطأ أثناء طلب الانضمام");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasons = [
    {
      title: "شهادات معتمدة (CPD)",
      desc: "جميع برامجنا مصممة لتلبية معايير التطوير المهني المستمر وتضيف قيمة حقيقية لسيرتك الذاتية.",
      icon: <Award className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-blue-600 shadow-blue-600/20"
    },
    {
      title: "توجيه مهني مباشر",
      desc: "لا نقدم مجرد محتوى، بل نوفر خطة طريق شخصية لكل طالب مع متابعة مباشرة من المدربين.",
      icon: <Navigation className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-red-600 shadow-red-600/20"
    },
    {
      title: "دعم التوظيف",
      desc: "نربط المتميزين في برامجنا بشبكة من الشركاء وأصحاب العمل في مختلف القطاعات التخصصية.",
      icon: <Briefcase className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-emerald-600 shadow-emerald-600/20"
    }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      if (supabase) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) {
          const mapped = data.map(item => ({
            ...item,
            thumbnail: item.thumbnail_url || item.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop",
            instructor_name: item.instructor_name || "مدرب معتمد",
            students_count: item.students_count || 0
          }));
          setProducts(mapped);
        }
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => {
    const matchesCategory = activeCategory === "الكل" || p.category === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.instructor_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <section className="bg-slate-900 py-16 md:py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 jordan-flag-gradient opacity-10" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/10"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold">بوابتك نحو الاحتراف والعمل</span>
            </motion.div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
              <h1 className="text-3xl md:text-5xl font-black leading-tight">أكاديمية المسار المهني</h1>
              <Link 
                to="/instructor-registration"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black shadow-lg shadow-red-600/20 hover:bg-white hover:text-red-600 transition-all active:scale-95 border border-transparent hover:border-red-600"
              >
                <span>طلب الانضمام كمدرب</span>
                <ArrowRight className="w-3 h-3 rotate-180" />
              </Link>
            </div>
            <p className="text-lg text-slate-300 mb-10">منصة متكاملة لتطوير مهارات الخريجين والمهنيين بنظام الـ CPD المعتمد.</p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="ابحث عن دورة، مدرب، أو مادة..." 
                className="w-full p-4 pr-12 rounded-2xl bg-white text-slate-900 border-none shadow-2xl focus:ring-4 focus:ring-red-600/20 outline-none text-lg text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 mb-8 relative z-20">
        <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-wrap gap-2 justify-center border border-slate-100">
           {categories.map((cat) => (
             <button
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all ${
                 activeCategory === cat 
                 ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 scale-105' 
                 : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
               }`}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => <div key={i} className="aspect-[4/5] bg-slate-200 animate-pulse rounded-3xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
                >
                  {/* Thumbnail Area */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img 
                      src={product.thumbnail} 
                      alt={product.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                       <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase text-white shadow-lg backdrop-blur-md ${
                         product.type === 'course' ? 'bg-red-600/80' : product.type === 'session' ? 'bg-green-600/80' : 'bg-blue-600/80'
                       }`}>
                         {product.type === 'course' ? 'دورة مسجلة' : product.type === 'session' ? 'بث مباشر' : 'ملخص PDF'}
                       </span>
                    </div>

                    <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                       <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                       <span>{product.rating}</span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-5 md:p-6">
                     <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[9px]">
                           {product.instructor_name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs font-bold text-slate-500">أ. {product.instructor_name}</span>
                     </div>
                     
                     <h3 className="text-base md:text-lg font-black text-slate-900 mb-3 leading-tight group-hover:text-red-600 transition-colors">
                       {product.title}
                     </h3>
                     
                     <div className="flex items-center gap-4 text-slate-400 text-xs font-bold mb-6">
                        <div className="flex items-center gap-1.5">
                           <Users className="w-3.5 h-3.5" />
                           <span>{product.students_count} طالب</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Play className="w-3.5 h-3.5" />
                           <span>12 درس</span>
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex flex-col">
                           {product.old_price && (
                             <span className="text-slate-400 line-through text-[10px] mb-0.5">{product.old_price} JOD</span>
                           )}
                           <span className="text-xl md:text-2xl font-black text-slate-900">{product.price} <small className="text-[10px] font-bold">JOD</small></span>
                        </div>
                        <button 
                          onClick={() => setSelectedProduct(product)}
                          className="bg-slate-900 text-white p-3 md:p-3.5 rounded-xl md:rounded-2xl hover:bg-red-600 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                        >
                           <ShoppingCart className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-400">لم نجد أي خدمات تطابق بحثك</h3>
                <button onClick={() => {setSearchTerm(""); setActiveCategory("الكل")}} className="mt-4 text-red-600 font-bold underline">عرض كل المنتجات</button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Enrollment Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setSelectedProduct(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              {showSuccess ? (
                <div className="p-12 text-center text-right">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">تم التسجيل بنجاح!</h2>
                  <p className="text-slate-500 font-bold text-sm">تم إرسال طلب انضمامك للدورة. سيتم مراجعته وتفعيله قريباً.</p>
                </div>
              ) : (
                <div className="p-8 md:p-10 text-right">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">تأكيد التسجيل</h2>
                      <p className="text-xs font-bold text-slate-400 mt-1">أنت على وشك الانضمام لبرنامج تدريبي</p>
                    </div>
                    <button onClick={() => setSelectedProduct(null)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={selectedProduct.thumbnail} alt="" className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-lg" />
                      <div>
                        <h3 className="font-black text-slate-900 leading-tight">{selectedProduct.title}</h3>
                        <p className="text-xs font-black text-red-600 mt-1">أ. {selectedProduct.instructor_name}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xl font-black text-slate-900">{selectedProduct.price} JOD</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">سعر الدورة</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleEnroll}
                    disabled={isSubmitting}
                    className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all duration-300 shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري معالجة الطلب...
                      </>
                    ) : (
                      <>
                        تأكيد الانضمام الآن
                        <ArrowLeft className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Why Choose Us Section - Compact Vertical Ticker Style */}
      <section className="py-12 md:py-24 bg-white overflow-hidden relative border-t border-slate-100">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-8 md:gap-16 relative z-10">
            <div className="w-full md:w-1/2 text-center md:text-right">
               <motion.span 
                 initial={{ opacity: 0, x: 20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 inline-block"
               >
                 عن الأكاديمية
               </motion.span>
               <motion.h2 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="text-2xl md:text-5xl font-black text-slate-900 mb-6 leading-tight"
               >
                 لماذا يختارنا آلاف المختصين؟
               </motion.h2>
               <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.1 }}
                 className="text-slate-500 text-sm md:text-lg font-medium leading-relaxed max-w-xl mx-auto md:mr-0"
               >
                 بنينا نظاماً يركز على التطوير الحقيقي للمهارات وربط التعليم بسوق العمل لضمان مستقبل مهني مشرق.
               </motion.p>
            </div>

            <div className="w-full md:w-1/2">
               <div 
                 className="bg-slate-50 rounded-[2rem] border border-slate-100 p-2 md:p-4 overflow-hidden h-32 md:h-40 relative group shadow-sm"
                 onMouseEnter={() => setIsPaused(true)}
                 onMouseLeave={() => setIsPaused(false)}
               >
                 <motion.div
                   animate={{ 
                     y: isPaused ? undefined : ["0%", `-${(reasons.length - 1) * 100}%`, "0%"]
                   }}
                   transition={{
                     duration: reasons.length * 4,
                     ease: "linear",
                     repeat: Infinity,
                   }}
                   className="flex flex-col h-full"
                 >
                   {reasons.map((item, idx) => (
                     <div 
                       key={idx} 
                       className="h-full flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-2"
                       style={{ height: "100%" }}
                     >
                        <div className="flex items-center gap-4 md:gap-6 text-right w-full">
                           <div className={`${item.color} w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xl transition-transform group-hover:scale-105`}>
                              {item.icon}
                           </div>
                           <div className="min-w-0 flex-grow">
                              <h3 className="text-base md:text-xl font-black text-slate-900 mb-0.5 md:mb-1">{item.title}</h3>
                              <p className="text-[10px] md:text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                {item.desc}
                              </p>
                           </div>
                        </div>
                     </div>
                   ))}
                 </motion.div>
                 
                 {/* Decorative elements */}
                 <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none z-10" />
                 <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-10" />
               </div>
            </div>
         </div>
         
         {/* Background Decoration */}
         <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-50 rounded-full blur-[120px] opacity-40" />
      </section>
    </div>
  );
}
