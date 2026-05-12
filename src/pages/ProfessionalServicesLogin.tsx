import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Briefcase, Mail, Lock, ArrowRight, BriefcaseIcon } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ProfessionalServicesLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (profileError || profile?.role !== 'service_provider') {
        await supabase.auth.signOut();
        throw new Error("عذراً، هذا الحساب ليس مسجلاً كمزود خدمات مهنية.");
      }

      navigate("/professional/dashboard");
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-600/20 rotate-3">
             <BriefcaseIcon className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">دخول مزودي الخدمات</h1>
          <p className="text-slate-500 text-sm mt-3 font-medium">أهلاً بك مجدداً في بوابة الخدمات المهنية</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 mr-1">البريد الإلكتروني المهني</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  className="w-full h-14 pr-12 pl-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all duration-300 font-bold text-sm"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 mr-1">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required
                  className="w-full h-14 pr-12 pl-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all duration-300 font-bold text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-shake text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all duration-300 shadow-xl shadow-slate-900/10 active:scale-95 flex items-center justify-center group disabled:opacity-50"
            >
              {loading ? "جاري التحقق..." : "تسجيل الدخول للمنصة"}
              <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-[-4px] transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-bold mb-4">ليس لديك حساب مزود خدمة؟</p>
            <Link 
              to="/service-provider-registration" 
              className="inline-flex items-center gap-2 text-blue-600 font-black text-sm hover:underline"
            >
              قدم طلب انضمام كخبير
              <Sparkles className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
           <Link to="/" className="text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold flex items-center justify-center gap-2">
             <ArrowRight className="w-4 h-4 rotate-180" />
             العودة للرئيسية
           </Link>
        </div>
      </div>
    </div>
  );
}
