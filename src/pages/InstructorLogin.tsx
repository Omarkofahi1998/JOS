import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Lock, Mail, Loader2, ArrowRight, UserCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function InstructorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/instructor/dashboard");
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Verify role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError || profile?.role !== 'instructor') {
        await supabase.auth.signOut();
        throw new Error("عذراً، هذا الحساب ليس مسجلاً كمدرب معتمد.");
      }

      navigate("/instructor/dashboard");
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full blur-3xl -mr-48 -mt-48 opacity-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl -ml-48 -mb-48 opacity-20" />

      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-2xl shadow-slate-200/50 relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-red-600/20 rotate-3">
             <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">تسجيل دخول المدربين</h1>
          <p className="text-slate-500 text-sm mt-3 font-medium">أهلاً بك مجدداً في مركز إدارة المسار المهني</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2 text-right">
            <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">البريد الإلكتروني المهني</label>
            <div className="relative group">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-red-600 transition-colors" />
              <input
                type="email"
                required
                className="w-full h-14 pr-12 pl-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-red-600 focus:bg-white transition-all text-sm font-bold"
                placeholder="instructor@jo-students.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 text-right">
            <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">كلمة المرور</label>
            <div className="relative group">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-red-600 transition-colors" />
              <input
                type="password"
                required
                className="w-full h-14 pr-12 pl-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-red-600 focus:bg-white transition-all text-sm font-bold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
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

          <div className="flex items-center justify-between text-xs mb-2 px-1">
             <button type="button" className="text-slate-400 hover:text-red-600 transition-colors font-bold tracking-tight">نسيت كلمة المرور؟</button>
             <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="accent-red-600" />
                <label htmlFor="remember" className="text-slate-500 font-bold">تذكرني</label>
             </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-slate-900 text-white rounded-[1.25rem] font-black flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "دخول مباشر"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-slate-50 text-center">
           <p className="text-slate-400 text-xs font-bold mb-4">ليس لديك حساب مدرب؟</p>
           <Link 
             to="/instructor-registration" 
             className="inline-flex items-center gap-2 bg-slate-50 text-slate-900 px-6 py-3 rounded-xl font-black text-xs hover:bg-red-600 hover:text-white transition-all transition-all"
           >
              <UserCheck className="w-4 h-4" />
              تقديم طلب انضمام
           </Link>
        </div>
      </div>

      <Link to="/" className="mt-10 text-slate-400 hover:text-slate-900 text-xs font-black flex items-center gap-2 transition-colors">
         العودة للرئيسية
      </Link>
    </div>
  );
}
