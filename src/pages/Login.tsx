import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { LogIn, Loader2, ArrowRight, Chrome, Sparkles, Mail, Lock, User, Phone, Eye, EyeOff, UserPlus } from "lucide-react";
import { motion } from "motion/react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Authentication mode: 'login' or 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

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
    setSuccessMessage(null);
    
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    // Basic Validation
    if (!email || !password) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (mode === 'register' && !fullName) {
      setError("يرجى إدخال الاسم الكامل");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'login') {
        // Sign In
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (authError) throw authError;

        if (data?.user) {
          await checkProfile(data.user);
        }
      } else {
        // Sign Up
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
            }
          }
        });

        if (authError) throw authError;

        if (data?.user) {
          // Explicitly create profile entry to avoid timing issues
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: email.trim(),
              full_name: fullName.trim(),
              phone: phone.trim() || null,
              role: 'user'
            });

          if (profileError) {
            console.error("Error creating profile:", profileError);
          }

          if (data.session) {
            setSuccessMessage("تم إنشاء الحساب وتسجيل الدخول بنجاح!");
            setTimeout(() => navigate("/"), 1500);
          } else {
            setSuccessMessage("تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتأكيد الحساب إذا لزم الأمر.");
            // Reset fields
            setEmail("");
            setPassword("");
            setFullName("");
            setPhone("");
            setMode('login');
          }
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      // Friendly Arabic errors
      let arabicError = err.message;
      if (err.message?.includes("Invalid login credentials")) {
        arabicError = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      } else if (err.message?.includes("User already registered")) {
        arabicError = "هذا البريد الإلكتروني مسجل بالفعل";
      } else if (err.message?.includes("Password should be at least")) {
        arabicError = "يجب أن تكون كلمة المرور 6 أحرف على الأقل";
      } else if (err.message?.includes("Signup is disabled")) {
        arabicError = "عذراً، التسجيل المباشر معطل حالياً";
      }
      setError(arabicError || "حدث خطأ أثناء معالجة الطلب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full blur-3xl -mr-48 -mt-48 opacity-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl -ml-48 -mb-48 opacity-20" />

      <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-10 shadow-2xl shadow-slate-200/50 relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-slate-900/10 rotate-3">
             {mode === 'login' ? <LogIn className="w-10 h-10" /> : <UserPlus className="w-10 h-10" />}
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h1>
          <p className="text-slate-500 text-sm mt-3 font-bold">
            {mode === 'login' ? 'بوابة الطلاب والأعضاء للوصول للخدمات والدورات' : 'انضم إلينا الآن للوصول لكافة ملفات وأدوات التفوق'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-14 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black flex items-center justify-center gap-3 hover:border-red-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 group text-sm shrink-0"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-red-600" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-red-50 transition-colors">
                  <Chrome className="w-5 h-5 text-red-600" />
                </div>
                <span>الدخول بواسطة جوجل</span>
              </div>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
             <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
             <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400 font-bold">أو عن طريق البريد الإلكتروني</span></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4" dir="rtl">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 block mr-1 text-right">الاسم الكامل</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-12 pr-12 pl-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all text-right"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 block mr-1 text-right">البريد الإلكتروني</label>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pr-12 pl-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all text-right"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 block mr-1 text-right">رقم الهاتف (اختياري)</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone className="w-5 h-5" />
                  </span>
                  <input
                    type="tel"
                    placeholder="07xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-12 pr-12 pl-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all text-right"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 block mr-1 text-right">كلمة المرور</label>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pr-12 pl-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all text-right"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error and Success messages */}
            {error && (
              <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-black text-center mt-2"
              >
                {error}
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-black text-center mt-2"
              >
                {successMessage}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-slate-900 hover:bg-red-600 text-white rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'دخول الحساب' : 'إنشاء الحساب الجديد'}</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Button */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-xs font-black text-red-600 hover:text-red-700 transition-colors"
            >
              {mode === 'login' ? 'لا تملك حساباً؟ سجل معنا الآن مجاناً' : 'لديك حساب بالفعل؟ سجل دخولك'}
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-2 text-slate-500 mb-2 justify-end">
                <span className="text-xs font-black">مزايا حساب طلاب الأردن</span>
                <Sparkles className="w-4 h-4 text-red-600" />
             </div>
             <ul className="space-y-1.5 text-right" dir="rtl">
                <li className="text-[10px] font-bold text-slate-500 flex items-center gap-2 justify-start">
                   <div className="w-1 h-1 bg-red-600 rounded-full shrink-0" />
                   الوصول للدورات والبرامج التدريبية المتخصصة
                </li>
                <li className="text-[10px] font-bold text-slate-500 flex items-center gap-2 justify-start">
                   <div className="w-1 h-1 bg-red-600 rounded-full shrink-0" />
                   تحميل ملخصات، اختبارات وأوراق عمل مجاناً
                </li>
                <li className="text-[10px] font-bold text-slate-500 flex items-center gap-2 justify-start">
                   <div className="w-1 h-1 bg-red-600 rounded-full shrink-0" />
                   طلب خدمات مهنية من خبراء ومستشارين معتمدين
                </li>
             </ul>
          </div>

          <p className="text-center text-[10px] font-bold text-slate-400 max-w-[280px] mx-auto leading-relaxed">
             بتسجيل دخولك، أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بالأكاديمية.
          </p>
        </div>
      </div>

      <Link to="/" className="mt-8 text-slate-400 hover:text-slate-900 text-xs font-black flex items-center gap-2 transition-colors">
         <ArrowRight className="w-4 h-4 rotate-180" />
         العودة للرئيسية
      </Link>
    </div>
  );
}
