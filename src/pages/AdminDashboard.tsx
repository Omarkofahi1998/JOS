import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { LayoutDashboard, Plus, LogOut, FileText, HelpCircle, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'files' | 'services'>('questions');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const navigate = useNavigate();

  // Form States - Questions
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [qMajor, setQMajor] = useState("عام");

  // Form States - Files
  const [fTitle, setFTitle] = useState("");
  const [fCategory, setFCategory] = useState("مختبرات");
  const [fUrl, setFUrl] = useState("");
  const [fSize, setFSize] = useState("1.0 MB");

  // Form States - Services
  const [sTitle, setSTitle] = useState("");
  const [sDesc, setSDesc] = useState("");

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/admin/login");
      setSession(session);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    navigate("/admin/login");
  };

  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase.from('services').insert({
        title: sTitle,
        description: sDesc
      });

      if (error) throw error;
      setStatus({ type: 'success', msg: 'تمت إضافة الخدمة بنجاح' });
      setSTitle("");
      setSDesc("");
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase.from('questions').insert({
        text: qText,
        options: qOptions,
        correct: qCorrect,
        major: qMajor
      });

      if (error) throw error;
      setStatus({ type: 'success', msg: 'تمت إضافة السؤال بنجاح' });
      setQText("");
      setQOptions(["", "", "", ""]);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const addFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setStatus(null);

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');

    try {
      const { error } = await supabase.from('question_files').insert({
        title: fTitle,
        category: fCategory,
        url: fUrl,
        file_size: fSize,
        file_date: today,
        download_count: 0
      });

      if (error) throw error;
      setStatus({ type: 'success', msg: 'تمت إضافة الملف بنجاح' });
      setFTitle("");
      setFUrl("");
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-red-600 font-bold text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
        <div className="flex items-center gap-4 text-right">
          <div>
            <h1 className="text-2xl font-black text-slate-900">لوحة التحكم</h1>
            <p className="text-slate-500 text-xs mt-1">أهلاً بك، {session.user.email}</p>
          </div>
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8 justify-end flex-wrap">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'services' ? 'bg-red-600 text-white shadow-lg' : 'bg-white border text-slate-500'
          }`}
        >
          إدارة الخدمات
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'files' ? 'bg-red-600 text-white shadow-lg' : 'bg-white border text-slate-500'
          }`}
        >
          إدارة بنك الملفات
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'questions' ? 'bg-red-600 text-white shadow-lg' : 'bg-white border text-slate-500'
          }`}
        >
          إدارة الأسئلة التجريبية
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 shadow-sm relative">
        {status && (
          <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
            status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {status.msg}
          </div>
        )}

        {activeTab === 'questions' ? (
          <form onSubmit={addQuestion} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* ... form content ... */}
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 justify-end">
                إضافة سؤال جديد
                <HelpCircle className="w-5 h-5 text-red-600" />
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-right text-xs font-black text-slate-400 uppercase">خيارات السؤال</label>
                {qOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={qCorrect === i}
                      onChange={() => setQCorrect(i)}
                      className="accent-red-600"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`خيار ${i + 1}`}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 focus:bg-white text-right text-sm"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...qOptions];
                        newOpts[i] = e.target.value;
                        setQOptions(newOpts);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black text-slate-400 uppercase">نص السؤال</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-red-600 focus:bg-white text-right text-sm"
                    placeholder="اكتب السؤال هنا..."
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                  />
                </div>

                <div className="space-y-2 text-right">
                  <label className="text-xs font-black text-slate-400 uppercase">التخصص</label>
                  <select
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 focus:bg-white text-right text-sm appearance-none"
                    value={qMajor}
                    onChange={(e) => setQMajor(e.target.value)}
                  >
                    <option value="عام">ثقافة عامة</option>
                    <option value="مختبرات">علوم طبية مخبرية</option>
                    <option value="تمريض">تمريض</option>
                    <option value="قانون">قانون</option>
                    <option value="معلم_صف">معلم صف</option>
                    <option value="IT">تكنولوجيا المعلومات</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              حفظ السؤال
            </button>
          </form>
        ) : activeTab === 'files' ? (
          <form onSubmit={addFile} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 justify-end">
                إضافة ملف جديد للبنك
                <FileText className="w-5 h-5 text-red-600" />
              </h2>
            </div>
            {/* Form Fields for Files - simplified for space in chat, will keep existing logic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black text-slate-400 uppercase">رابط الملف (URL)</label>
                  <input
                    type="url"
                    required
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 focus:bg-white text-left text-sm"
                    placeholder="https://..."
                    value={fUrl}
                    onChange={(e) => setFUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black text-slate-400 uppercase">حجم الملف</label>
                  <input
                    type="text"
                    required
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 focus:bg-white text-right text-sm"
                    placeholder="مثال: 2.5 MB"
                    value={fSize}
                    onChange={(e) => setFSize(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black text-slate-400 uppercase">عنوان الملف</label>
                  <input
                    type="text"
                    required
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 focus:bg-white text-right text-sm"
                    placeholder="مثال: بنك أسئلة الكفايات القانونية"
                    value={fTitle}
                    onChange={(e) => setFTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black text-slate-400 uppercase">الفئة</label>
                  <select
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 focus:bg-white text-right text-sm appearance-none"
                    value={fCategory}
                    onChange={(e) => setFCategory(e.target.value)}
                  >
                    <option value="مختبرات">مختبرات</option>
                    <option value="تمريض">تمريض</option>
                    <option value="قانون">قانون</option>
                    <option value="معلم صف">معلم صف</option>
                    <option value="IT">IT</option>
                    <option value="الإدارة العامة">الإدارة العامة</option>
                  </select>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              رفع الملف للبنك
            </button>
          </form>
        ) : (
          <form onSubmit={addService} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 justify-end">
                إضافة خدمة جديدة
                <Sparkles className="w-5 h-5 text-red-600" />
              </h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 text-right">
                <label className="text-xs font-black text-slate-400 uppercase">عنوان الخدمة</label>
                <input
                  type="text"
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 focus:bg-white text-right text-sm"
                  placeholder="مثال: تعديل سيرة ذاتية"
                  value={sTitle}
                  onChange={(e) => setSTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2 text-right">
                <label className="text-xs font-black text-slate-400 uppercase">وصف الخدمة</label>
                <textarea
                  required
                  rows={4}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-red-600 focus:bg-white text-right text-sm"
                  placeholder="اكتب وصف الخدمة وما تقدمه بوضوح..."
                  value={sDesc}
                  onChange={(e) => setSDesc(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              حفظ الخدمة
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
