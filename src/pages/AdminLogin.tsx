import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/admin/dashboard");
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl shadow-slate-200/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">دخول الإدارة</h1>
          <p className="text-slate-500 text-sm mt-2">يرجى تسجيل الدخول للوصول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2 text-right">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                className="w-full h-12 pr-12 pl-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-600 focus:bg-white transition-all text-sm font-medium"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 text-right">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                className="w-full h-12 pr-12 pl-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-600 focus:bg-white transition-all text-sm font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "تسجيل الدخول"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
