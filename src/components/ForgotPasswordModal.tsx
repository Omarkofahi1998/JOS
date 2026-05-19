import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { X, Mail, Loader2, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setStatus(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      
      setStatus({ type: 'success', msg: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.' });
      setTimeout(() => {
        onClose();
        setStatus(null);
        setEmail("");
      }, 5000);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'حدث خطأ. يرجى التأكد من البريد الإلكتروني.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
          >
            <div className="p-6">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 mt-4 mx-auto">
                <KeyRound className="w-8 h-8" />
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 text-center mb-2">نسيت كلمة المرور؟</h2>
              <p className="text-slate-500 text-center text-sm font-medium mb-8">
                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
              </p>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">البريد الإلكتروني</label>
                  <div className="relative group">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-red-600 transition-colors" />
                    <input
                      type="email"
                      required
                      className="w-full h-14 pr-12 pl-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-red-600 focus:bg-white transition-all text-sm font-bold text-right"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {status && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border rounded-2xl text-xs font-black text-center ${
                      status.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
                    }`}
                  >
                    {status.msg}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "إرسال رابط إعادة التعيين"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
