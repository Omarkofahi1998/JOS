import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { LogIn, Loader2, ArrowRight, Chrome, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkProfile(session.user);
      }
    });
  }, [navigate]);

  const checkProfile = async (user: any) => {
    if (!supabase) return;

    try {
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one with role 'user' (student)
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            full_name: user.user_metadata.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata.avatar_url,
            role: 'user' // This is the default student role
          }]);
        
        if (insertError) throw insertError;
        navigate("/");
      } else if (profile) {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Profile check error:", err);
      setError("حدث خطأ أثناء فحص الحساب");
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الدخول بواسطه جوجل");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full blur-3xl -mr-48 -mt-48 opacity-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl -ml-48 -mb-48 opacity-20" />

      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-2xl shadow-slate-200/50 relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-slate-900/10 rotate-3">
             <LogIn className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">تسجيل الدخول</h1>
          <p className="text-slate-500 text-sm mt-3 font-bold">بوابة الطلاب والأعضاء للوصول للخدمات والدورات</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-16 bg-white border-2 border-slate-100 text-slate-900 rounded-[1.25rem] font-black flex items-center justify-center gap-3 hover:border-red-600 transition-all active:scale-95 disabled:opacity-50 group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-red-50 transition-colors">
                  <Chrome className="w-5 h-5 text-red-600" />
                </div>
                <span>الدخول بواسطة جوجل</span>
              </div>
            )}
          </button>

          <div className="relative">
             <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
             <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest leading-none">أو</span></div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-3 text-slate-500 mb-3">
                <Sparkles className="w-5 h-5 text-red-600" />
                <span className="text-xs font-black">لماذا تسجل معنا؟</span>
             </div>
             <ul className="space-y-2">
                <li className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                   <div className="w-1 h-1 bg-red-600 rounded-full" />
                   الوصول للدورات والبرامج التدريبية
                </li>
                <li className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                   <div className="w-1 h-1 bg-red-600 rounded-full" />
                   طلب خدمات مهنية من خبراء معتمدين
                </li>
                <li className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                   <div className="w-1 h-1 bg-red-600 rounded-full" />
                   متابعة حالة طلباتك وحجز المقاعد
                </li>
             </ul>
          </div>

          {error && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-black text-center"
            >
              {error}
            </motion.div>
          )}

          <p className="text-center text-[10px] font-bold text-slate-400 max-w-[280px] mx-auto leading-relaxed">
             بتسجيل دخولك، أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بالأكاديمية.
          </p>
        </div>
      </div>

      <Link to="/" className="mt-10 text-slate-400 hover:text-slate-900 text-xs font-black flex items-center gap-2 transition-colors">
         <ArrowRight className="w-4 h-4 rotate-180" />
         العودة للرئيسية
      </Link>
    </div>
  );
}
