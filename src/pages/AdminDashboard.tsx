import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  LayoutDashboard, Plus, LogOut, FileText, HelpCircle, Loader2, 
  CheckCircle2, AlertCircle, Sparkles, Trash2, Edit3, Layers, 
  Search, X, MessageSquare, Shield, Settings, Menu, Bell, User, Clock, ChevronRight,
  Download, Image as ImageIcon, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun } from "docx";
import { saveAs } from "file-saver";

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'files' | 'services' | 'settings' | 'features' | 'reviews' | 'contacts'>('questions');
  const [subTab, setSubTab] = useState<'add' | 'list' | 'bulk'>('list');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Records Lists
  const [questions, setQuestions] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");
  const [imageValid, setImageValid] = useState<boolean | null>(null);
  const [lastBatchIds, setLastBatchIds] = useState<(string | number)[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[] | null>(null);

  // Import JSON function
  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        if (!Array.isArray(jsonData)) throw new Error("الملف يجب أن يحتوي على مصفوفة أسئلة");

        const validQuestions: any[] = [];
        jsonData.forEach((q, idx) => {
          if (!q.text || !Array.isArray(q.options) || q.options.length < 2 || typeof q.correct !== 'number' || !q.major) {
            throw new Error(`خطأ في تنسيق السؤال رقم ${idx + 1}`);
          }
          validQuestions.push({
            text: q.text,
            options: q.options,
            correct: q.correct,
            major: q.major,
            image_url: q.image_url || ""
          });
        });

        setPreviewQuestions(validQuestions);
        e.target.value = ""; // Reset input
      } catch (err: any) {
        setStatus({ type: 'error', msg: `فشل التحليل: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  const confirmJSONImport = async () => {
    if (!previewQuestions) return;
    setLoading(true);
    try {
      const newIds: (string | number)[] = [];
      const questionsToInsert = previewQuestions.map(q => ({
        ...q,
        created_at: new Date().toISOString()
      }));

      for (const q of questionsToInsert) {
        const { data, error } = await supabase.from('questions').insert(q).select();
        if (error) throw error;
        if (data) newIds.push(data[0].id);
      }

      setLastBatchIds(newIds);
      setShowUndo(true);
      setPreviewQuestions(null);
      fetchData();
      setStatus({ type: 'success', msg: `تم استيراد ${questionsToInsert.length} سؤال بنجاح` });
      
      setTimeout(() => setShowUndo(false), 30000);
    } catch (err: any) {
      setStatus({ type: 'error', msg: `فشل الاستيراد: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const undoLastImport = async () => {
    if (lastBatchIds.length === 0) return;
    try {
      const { error } = await supabase.from('questions').delete().in('id', lastBatchIds);
      if (error) throw error;
      setStatus({ type: 'success', msg: "تم التراجع وحذف الأسئلة المضافة" });
      setLastBatchIds([]);
      setShowUndo(false);
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: "فشل التراجع عن الإضافة" });
    }
  };

  // Export functions
  const getFilteredQuestions = () => {
    return questions.filter(item => {
      const matchesSearch = (item.text || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.major || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMajor = majorFilter !== 'all' ? item.major === majorFilter : true;
      return matchesSearch && matchesMajor;
    });
  };

  const exportToExcel = () => {
    const data = getFilteredQuestions().map(q => ({
      'السؤال': q.text,
      'الخيار 1': q.options[0],
      'الخيار 2': q.options[1],
      'الخيار 3': q.options[2],
      'الخيار 4': q.options[3],
      'رقم الجواب الصحيح (0-3)': q.correct,
      'نص الجواب الصحيح': q.options[q.correct],
      'التخصص': q.major,
      'رابط الصورة': q.image_url || 'لا يوجد'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, `jo_students_exam_${majorFilter}.xlsx`);
  };

  const exportToJSON = () => {
    const data = getFilteredQuestions().map(q => ({
      text: q.text,
      options: q.options,
      correct: q.correct,
      major: q.major,
      image_url: q.image_url || ""
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    saveAs(blob, `jo_students_data_${majorFilter}.json`);
  };

  const exportToTXT = () => {
    const data = getFilteredQuestions().map(q => ({
      text: q.text,
      options: q.options,
      correct: q.correct,
      major: q.major,
      image_url: q.image_url || ""
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "text/plain" });
    saveAs(blob, `jo_students_exam_${majorFilter}.txt`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'pt');
    const filtered = getFilteredQuestions();
    
    doc.setFontSize(22);
    doc.text("Official Exam Questions - Jo Students", 40, 45);
    doc.setFontSize(10);
    doc.text(`Major: ${majorFilter === 'all' ? 'All Majors' : majorFilter}`, 40, 65);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 40, 78);
    doc.line(40, 90, 550, 90);

    const body = filtered.map((q, i) => [
      `${i + 1}`,
      q.text,
      q.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}) ${opt}`).join('\n')
    ]);
    
    (doc as any).autoTable({
      startY: 110,
      head: [['#', 'Question Content', 'Options']],
      body: body,
      styles: { fontSize: 9, cellPadding: 8, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 320 },
        2: { cellWidth: 150 },
      }
    });

    // Add Answer Key on a new page if needed or at the end
    doc.addPage();
    doc.setFontSize(18);
    doc.text("Answer Key (الإجابة النموذجية)", 40, 45);
    doc.line(40, 55, 550, 55);

    const answerBody = filtered.map((q, i) => [
      `${i + 1}`,
      q.options[q.correct]
    ]);

    (doc as any).autoTable({
      startY: 70,
      head: [['#', 'Correct Answer']],
      body: answerBody,
      styles: { fontSize: 10, cellPadding: 5 }
    });
    
    doc.save(`exam_${majorFilter}.pdf`);
  };

  const exportToWord = async () => {
    const filtered = getFilteredQuestions();
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "نظام جو ستودنتس التعليمي", bold: true, size: 36 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `امتحان تجريبي: ${majorFilter === 'all' ? 'كافة التخصصات' : majorFilter}`, size: 26 }),
            ],
          }),
          new Paragraph({ text: "\n" }),
          new Paragraph({
            children: [
              new TextRun({ text: "اسم الطالب: ___________________________", bold: true }),
              new TextRun({ text: "\t\tالتاريخ: " + new Date().toLocaleDateString(), bold: true }),
            ],
          }),
          new Paragraph({ text: "\n" }),
          ...filtered.flatMap((q, i) => [
            new Paragraph({
              spacing: { before: 400 },
              children: [
                new TextRun({ text: `${i + 1}. ${q.text}`, bold: true, size: 24 }),
              ],
            }),
            ...q.options.map((opt, optIdx) => new Paragraph({
              indent: { left: 720 },
              children: [
                new TextRun({ text: `${String.fromCharCode(64 + (optIdx + 1))}) ${opt}`, size: 22 }),
              ],
            })),
          ]),
          // Answer Key
          new Paragraph({
            spacing: { before: 1000 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "الإجابة النموذجية", bold: true, size: 32, underline: {} }),
            ],
          }),
          ...filtered.map((q, i) => new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}: `, bold: true }),
              new TextRun({ text: q.options[q.correct] }),
            ],
          })),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `exam_${majorFilter}.docx`);
  };

  const validateImage = (url: string) => {
    if (!url) {
      setImageValid(null);
      return;
    }
    const img = new Image();
    img.onload = () => setImageValid(true);
    img.onerror = () => setImageValid(false);
    img.src = url;
  };

  // Edit State
  const [editingId, setEditingId] = useState<number | string | null>(null);

  // Form States - Collections
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [qMajor, setQMajor] = useState("");
  const [qImage, setQImage] = useState("");
  const [bulkText, setBulkText] = useState("");

  const [fTitle, setFTitle] = useState("");
  const [fCategory, setFCategory] = useState("مختبرات");
  const [fUrl, setFUrl] = useState("");
  const [fSize, setFSize] = useState("1.0 MB");

  const [sTitle, setSTitle] = useState("");
  const [sDesc, setSDesc] = useState("");
  const [sIcon, setSIcon] = useState("Settings");
  const [sColor, setSColor] = useState("bg-slate-50");

  const [featTitle, setFeatTitle] = useState("");
  const [featDesc, setFeatDesc] = useState("");
  const [featIcon, setFeatIcon] = useState("BookOpen");
  const [featColor, setFeatColor] = useState("bg-red-50");
  const [featPath, setFeatPath] = useState("/");
  const [featOrder, setFeatOrder] = useState(0);

  const [rTitle, setRTitle] = useState("");
  const [rDesc, setRDesc] = useState("");
  const [rAuthor, setRAuthor] = useState("Jo Students");
  const [rReadTime, setRReadTime] = useState("٥ دقائق");
  const [rDate, setRDate] = useState("");

  const [siteSet, setSiteSet] = useState({
    hero_title: "",
    hero_subtitle: "",
    hero_image: "",
    visitor_count: "0",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    success_rate: "92"
  });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/admin/login");
      setSession(session);
    });
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [q, f, s, settings, feat, rev, con, stats] = await Promise.all([
        supabase.from('questions').select('*').order('id', { ascending: false }),
        supabase.from('question_files').select('*').order('id', { ascending: false }),
        supabase.from('services').select('*').order('id', { ascending: false }),
        supabase.from('site_settings').select('key, value'),
        supabase.from('features').select('*').order('order_index', { ascending: true }),
        supabase.from('reviews').select('*').order('id', { ascending: false }),
        supabase.from('contact_messages').select('*').order('id', { ascending: false }),
        supabase.from('visitor_stats').select('count').eq('id', 1).single()
      ]);
      if (q.data) setQuestions(q.data);
      if (f.data) setFiles(f.data);
      if (s.data) setServices(s.data);
      if (feat.data) setFeatures(feat.data);
      if (rev.data) setReviews(rev.data);
      if (con.data) setContacts(con.data);
      
      if (settings.data) {
        const obj: any = {};
        settings.data.forEach(item => obj[item.key] = item.value);
        setSiteSet({
          hero_title: obj.hero_title || "",
          hero_subtitle: obj.hero_subtitle || "",
          hero_image: obj.hero_image || "",
          visitor_count: stats.data?.count?.toString() || "0",
          contact_email: obj.contact_email || "",
          contact_phone: obj.contact_phone || "",
          contact_address: obj.contact_address || "",
          success_rate: obj.success_rate || "92"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (table: string, id: any) => {
    if (!supabase || !window.confirm("هل أنت متأكد من حذف هذا السجل بشكل نهائي؟")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      setStatus({ type: 'success', msg: 'تم حذف السجل بنجاح' });
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: "فشل الحذف: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setEditingId(null);
    setQText("");
    setQOptions(["", "", "", ""]);
    setQCorrect(0);
    setQMajor("");
    setQImage("");
    setBulkText("");
    setFTitle("");
    setFUrl("");
    setSTitle("");
    setSDesc("");
    setFeatTitle("");
    setFeatDesc("");
    setRTitle("");
    setRDesc("");
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    navigate("/admin/login");
  };

  // Form Handlers
  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const payload = { text: qText, options: qOptions, correct: qCorrect, major: qMajor, image_url: qImage };
      let error;
      if (editingId) ({ error } = await supabase.from('questions').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('questions').insert(payload));
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت إضافة السؤال بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const data = JSON.parse(bulkText);
      if (!Array.isArray(data)) throw new Error("يجب أن يكون النص مصفوفة JSON [{}, {}]");
      
      const { error } = await supabase.from('questions').insert(data);
      if (error) throw error;
      
      setStatus({ type: 'success', msg: `تم رفع ${data.length} سؤال بنجاح` });
      setBulkText("");
      setSubTab('list');
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: "خطأ في التنسيق: تأكد من صحة نص JSON" });
    } finally {
      setLoading(false);
    }
  };

  const addFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
      const payload = { title: fTitle, category: fCategory, url: fUrl, file_size: fSize, file_date: today };
      let error;
      if (editingId) ({ error } = await supabase.from('question_files').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('question_files').insert({ ...payload, download_count: 0 }));
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت إضافة الملف بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const payload = { title: sTitle, description: sDesc, icon_name: sIcon, bg_color: sColor };
      let error;
      if (editingId) ({ error } = await supabase.from('services').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('services').insert(payload));
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت إضافة الخدمة بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const addFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const payload = { title: featTitle, description: featDesc, icon_name: featIcon, color_class: featColor, link_path: featPath, order_index: featOrder };
      let error;
      if (editingId) ({ error } = await supabase.from('features').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('features').insert(payload));
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت إضافة الأداة بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const addReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const today = new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' });
      const payload = { title: rTitle, description: rDesc, author: rAuthor, read_time: rReadTime, file_date: rDate || today };
      let error;
      if (editingId) ({ error } = await supabase.from('reviews').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('reviews').insert(payload));
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تم إضافة المراجعة بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const siteSettingsData = {
        hero_title: siteSet.hero_title,
        hero_subtitle: siteSet.hero_subtitle,
        hero_image: siteSet.hero_image,
        contact_email: siteSet.contact_email,
        contact_phone: siteSet.contact_phone,
        contact_address: siteSet.contact_address,
        success_rate: siteSet.success_rate
      };
      
      const updates = Object.entries(siteSettingsData).map(([key, value]) => 
        supabase.from('site_settings').upsert({ key, value })
      );
      
      // Update visitor stats
      const statsUpdate = supabase.from('visitor_stats').upsert({ id: 1, count: parseInt(siteSet.visitor_count) });
      
      await Promise.all([...updates, statsUpdate]);
      setStatus({ type: 'success', msg: 'تم حفظ الإعدادات بنجاح' });
    } catch (err: any) { setStatus({ type: 'error', msg: err.message }); } finally { setLoading(false); }
  };

  const sidebarItems = [
    { id: 'questions', name: 'بنك الأسئلة', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'files', name: 'بنك الملفات', icon: <FileText className="w-5 h-5" /> },
    { id: 'services', name: 'الخدمات المهنية', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'features', name: 'أدوات التفوق', icon: <Layers className="w-5 h-5" /> },
    { id: 'reviews', name: 'المراجعات', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'contacts', name: 'الرسائل الواردة', icon: <Bell className="w-5 h-5" /> },
    { id: 'settings', name: 'بناء الهوية', icon: <Settings className="w-5 h-5" /> },
  ];

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row-reverse overflow-hidden font-sans" dir="rtl">
      {/* Sidebar Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: sidebarOpen ? 280 : (window.innerWidth < 1024 ? 0 : 80),
          x: (sidebarOpen) ? 0 : (window.innerWidth < 1024 ? 280 : 0)
        }}
        className={`bg-white border-l border-slate-200 h-screen fixed lg:sticky top-0 flex flex-col z-[60] shadow-sm transition-all overflow-hidden`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-50">
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-xl text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-black text-slate-900 tracking-tight">لوحة الإشراف</span>
            </motion.div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setSubTab('list'); resetForms(); }}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all relative group ${
                activeTab === item.id ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className={activeTab === item.id ? 'text-red-600' : 'text-slate-400 group-hover:text-red-600'}>{item.icon}</div>
              {sidebarOpen && <span className="font-bold text-sm whitespace-nowrap">{item.name}</span>}
              {activeTab === item.id && <motion.div layoutId="activeTab" className="absolute left-0 w-1.5 h-6 bg-red-600 rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative custom-scrollbar w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 md:px-8 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3 md:gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-400"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-lg md:rounded-xl flex items-center justify-center text-white shrink-0">
                 <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <h2 className="text-base md:text-xl font-black text-slate-900 truncate">
                 {sidebarItems.find(i => i.id === activeTab)?.name}
              </h2>
           </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">تاريخ الجلسة</span>
              <span className="text-xs font-bold text-slate-900 mt-1">{new Date().toLocaleDateString('ar-JO')}</span>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
               <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Action Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex flex-wrap gap-2">
              {activeTab !== 'settings' && activeTab !== 'contacts' && (
                <>
                  <button 
                    onClick={() => setSubTab('list')}
                    className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                      subTab === 'list' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    عرض بنك الأسئلة
                  </button>
                  <button 
                    onClick={() => { setSubTab('add'); resetForms(); }}
                    className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                      subTab === 'add' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {editingId ? 'تعديل السجل' : 'إضافة سؤال جديد'}
                  </button>
                  {activeTab === 'questions' && (
                    <button 
                      onClick={() => setSubTab('bulk')}
                      className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                        subTab === 'bulk' ? 'bg-red-600 text-white border-red-600 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      إضافة بالجملة (JSON)
                    </button>
                  )}
                </>
              )}
            </div>
            
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {subTab === 'list' && activeTab === 'questions' && (
              <div className="flex flex-wrap items-center gap-2">
                {showUndo && (
                  <button 
                    onClick={undoLastImport}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all font-bold text-xs"
                  >
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    تراجع عن الإضافة
                  </button>
                )}
                <label className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer" title="استيراد JSON">
                  <Plus className="w-4 h-4" />
                  <input type="file" accept=".json" className="hidden" onChange={handleJSONImport} />
                </label>
                <button onClick={exportToExcel} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all" title="تصدير Excel">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={exportToPDF} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all title='تصدير PDF'">
                  <FileText className="w-4 h-4" />
                </button>
                <button onClick={exportToWord} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all" title="تصدير Word">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button onClick={exportToJSON} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-all" title="تصدير JSON">
                  <Settings className="w-4 h-4" />
                </button>
                <button onClick={exportToTXT} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-all" title="تصدير TXT">
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            )}
            {subTab === 'list' && activeTab === 'questions' && (
              <select 
                value={majorFilter}
                onChange={(e) => setMajorFilter(e.target.value)}
                className="h-10 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 text-sm font-bold"
              >
                <option value="all">كل التخصصات</option>
                {Array.from(new Set(questions.map(q => q.major))).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
            
            {subTab === 'list' && activeTab !== 'settings' && activeTab !== 'contacts' && (
              <div className="relative w-full sm:w-64">
                 <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                   type="text" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="بحث..." 
                   className="w-full h-10 pr-10 pl-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 text-sm font-medium"
                 />
              </div>
            )}
          </div>
          </div>

          {/* Status Alert */}
          <AnimatePresence>
            {status && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className={`mb-8 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {status.msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Content */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-sm min-h-[600px] overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <div className="bg-white p-6 rounded-3xl shadow-2xl flex items-center gap-4">
                  <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                  <span className="font-black text-slate-900">جاري المعالجة...</span>
                </div>
              </div>
            )}

            <div className="p-8">
              {/* LIST VIEW */}
              {subTab === 'list' && activeTab !== 'settings' && activeTab !== 'contacts' && (
                <div className={activeTab === 'questions' ? "overflow-x-auto" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"}>
                  {activeTab === 'questions' ? (
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">السجل</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase hidden sm:table-cell">التخصص</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">نص السؤال</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase hidden md:table-cell">الصورة</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions
                          .filter(item => {
                            const matchesSearch = (item.text || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 (item.major || "").toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesMajor = majorFilter !== 'all' ? item.major === majorFilter : true;
                            return matchesSearch && matchesMajor;
                          }).map((item, idx) => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all group">
                              <td className="px-6 py-4 text-xs font-bold text-slate-400">#{item.id}</td>
                              <td className="px-6 py-4 hidden sm:table-cell">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black">{item.major}</span>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900 max-w-[150px] sm:max-w-md truncate">{item.text}</td>
                              <td className="px-6 py-4 hidden md:table-cell">
                                {item.image_url ? (
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-300">لا يوجد</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => {
                                      setEditingId(item.id); setQText(item.text); setQOptions(item.options); setQCorrect(item.correct); setQMajor(item.major); setQImage(item.image_url || ""); setSubTab('add');
                                    }}
                                    className="p-2 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-all"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => deleteItem('questions', item.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    (activeTab === 'files' ? files : activeTab === 'services' ? services : activeTab === 'features' ? features : reviews)
                      .filter(item => {
                        const matchesSearch = (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             (item.category || item.description || "").toLowerCase().includes(searchTerm.toLowerCase());
                        return matchesSearch;
                      }).map((item, idx) => (
                        <motion.div 
                          key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                          className="p-6 bg-white border border-slate-100 rounded-3xl hover:border-red-100 hover:shadow-xl hover:shadow-red-500/5 transition-all group flex flex-col h-full"
                        >
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                  onClick={() => {
                                    if(activeTab === 'files') { setEditingId(item.id); setFTitle(item.title); setFCategory(item.category); setFUrl(item.url); setFSize(item.file_size); setSubTab('add'); }
                                    else if(activeTab === 'services') { setEditingId(item.id); setSTitle(item.title); setSDesc(item.description); setSIcon(item.icon_name || "Settings"); setSColor(item.bg_color || "bg-slate-50"); setSubTab('add'); }
                                    else if(activeTab === 'features') { setEditingId(item.id); setFeatTitle(item.title); setFeatDesc(item.description); setFeatIcon(item.icon_name || "BookOpen"); setFeatColor(item.color_class || "bg-red-50"); setFeatPath(item.link_path || "/"); setFeatOrder(item.order_index || 0); setSubTab('add'); }
                                    else if(activeTab === 'reviews') { setEditingId(item.id); setRTitle(item.title); setRDesc(item.description); setRAuthor(item.author || "Jo Students"); setRReadTime(item.read_time || "٥ دقائق"); setRDate(item.file_date || ""); setSubTab('add'); }
                                  }}
                                  className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl"
                                ><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => deleteItem(activeTab === 'files' ? 'question_files' : activeTab, item.id)} className="p-2 bg-red-50 text-red-300 hover:text-red-600 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                             </div>
                             <span className="text-[10px] font-black text-slate-300 uppercase"># {item.id}</span>
                          </div>
                          <h4 className="font-black text-slate-900 mb-2 truncate">{item.title || item.major || item.category || 'سجل جديد'}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-6 flex-grow">{item.text || item.description || item.url}</p>
                          <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
                             <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.created_at || Date.now()).toLocaleDateString('ar-JO')}</div>
                             <ChevronRight className="w-3 h-3" />
                          </div>
                        </motion.div>
                    ))
                  )}
                </div>
              )}

              {/* MESSAGES VIEW */}
              {activeTab === 'contacts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {contacts.length === 0 ? <p className="col-span-full text-center text-slate-300 font-bold py-20">لا يوجد رسائل</p> : contacts.map((msg) => (
                     <div key={msg.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 group hover:bg-white hover:shadow-2xl transition-all">
                      <div className="flex justify-between items-start mb-6">
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={async () => {
                                   const { error } = await supabase!.from('contact_messages').update({ is_read: !msg.is_read }).eq('id', msg.id);
                                   if(!error) fetchData();
                                }}
                                className={`p-2 rounded-xl transition-all ${msg.is_read ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}
                                title={msg.is_read ? "تحديد كغير مقروء" : "تحديد كمقروء"}
                              >
                                 <CheckCircle2 className="w-5 h-5" />
                              </button>
                              <button onClick={() => deleteItem('contact_messages', msg.id)} className="p-2 bg-red-50 text-red-300 hover:text-red-600 rounded-xl">
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                           <div className="text-right">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                 {!msg.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                                 <h3 className="font-black text-slate-900 text-lg">{msg.name}</h3>
                              </div>
                              <span className="text-sm text-red-600 font-bold">{msg.email}</span>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div className="bg-white p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-300 uppercase mb-1">الموضوع</p><p className="text-sm font-bold text-slate-900">{msg.subject}</p></div>
                           <div className="bg-white p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-300 uppercase mb-1">الرسالة</p><p className="text-sm text-slate-600 leading-relaxed">{msg.message}</p></div>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {/* SETTINGS VIEW */}
              {activeTab === 'settings' && (
                <form onSubmit={saveSettings} className="space-y-10 max-w-2xl mx-auto py-12">
                   <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl mb-8 text-right">
                      <h3 className="text-blue-900 font-black mb-2 flex items-center justify-end gap-2 text-sm">
                         إرشادات بناء الهوية
                         <Shield className="w-4 h-4" />
                      </h3>
                      <p className="text-blue-700 text-xs leading-relaxed font-medium">
                         من هنا يمكنك التحكم في المحتوى الأساسي للواجهة، تأكد من استخدام روابط صور مباشرة لضمان سرعة التحميل.
                      </p>
                   </div>

                   <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-200 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-slate-400 uppercase">عنوان الموقع الرئيسي</label>
                          <input type="text" value={siteSet.hero_title} onChange={e => setSiteSet({...siteSet, hero_title: e.target.value})} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" />
                        </div>
                        <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-slate-400 uppercase">عداد الزوار</label>
                          <input type="number" value={siteSet.visitor_count} onChange={e => setSiteSet({...siteSet, visitor_count: e.target.value})} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" />
                        </div>
                        <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-slate-400 uppercase">نسبة النجاح (%)</label>
                          <input type="text" value={siteSet.success_rate} onChange={e => setSiteSet({...siteSet, success_rate: e.target.value})} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" />
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">رابط صورة الغلاف (URL)</label>
                        <input type="text" value={siteSet.hero_image} onChange={e => setSiteSet({...siteSet, hero_image: e.target.value})} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-mono text-xs" />
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase">معلومات التواصل المباشر</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <input type="text" value={siteSet.contact_email} onChange={e => setSiteSet({...siteSet, contact_email: e.target.value})} className="h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 text-sm" placeholder="البريد الإلكتروني" />
                           <input type="text" value={siteSet.contact_phone} onChange={e => setSiteSet({...siteSet, contact_phone: e.target.value})} className="h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 text-sm" placeholder="رقم الهاتف" />
                           <input type="text" value={siteSet.contact_address} onChange={e => setSiteSet({...siteSet, contact_address: e.target.value})} className="h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 text-sm" placeholder="العنوان" />
                        </div>
                      </div>

                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">الرسالة الترحيبية (وصف الهوية)</label>
                        <textarea rows={4} value={siteSet.hero_subtitle} onChange={e => setSiteSet({...siteSet, hero_subtitle: e.target.value})} className="w-full p-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-medium" />
                      </div>
                   </div>
                   <button type="submit" disabled={loading} className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                      تحديث بيانات الهوية البصرية
                   </button>
                </form>
              )}

              {/* ADD/EDIT FORM FOR QUESTIONS */}
              {subTab === 'add' && activeTab === 'questions' && (
                <form onSubmit={addQuestion} className="space-y-10 max-w-4xl mx-auto py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-6">
                        <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">نص السؤال</label><textarea required rows={8} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:bg-white focus:border-red-600 text-base" value={qText} onChange={e => setQText(e.target.value)} /></div>
                        <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-slate-400 uppercase flex items-center justify-between">
                            <span>رابط الصورة (URL)</span>
                            {imageValid === true && <span className="text-emerald-500 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" /> صالحة</span>}
                            {imageValid === false && <span className="text-red-500 flex items-center gap-1 font-bold"><AlertCircle className="w-3 h-3" /> غير صالحة</span>}
                          </label>
                          <div className="relative">
                            <input 
                              type="text" 
                              className={`w-full h-14 pr-6 pl-12 bg-slate-50 border rounded-2xl outline-none focus:bg-white focus:border-red-600 font-mono text-xs transition-all ${
                                imageValid === true ? 'border-emerald-200' : imageValid === false ? 'border-red-200' : 'border-slate-200'
                              }`} 
                              value={qImage} 
                              onChange={e => { setQImage(e.target.value); validateImage(e.target.value); }} 
                              placeholder="https://example.com/image.png" 
                            />
                            {qImage && (
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-2">
                                <button type="button" onClick={() => validateImage(qImage)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Eye className="w-4 h-4" /></button>
                              </div>
                            )}
                          </div>
                          {imageValid === true && qImage && (
                            <div className="mt-4 p-4 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                              <img src={qImage} alt="Preview" className="max-h-32 mx-auto rounded-lg object-contain" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-slate-400 uppercase">تخصص السؤال (أو اكتب تخصص جديد)</label>
                          <input 
                            type="text" 
                            list="majors-list"
                            required
                            className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-600 font-bold" 
                            value={qMajor} 
                            onChange={e => setQMajor(e.target.value)} 
                            placeholder="حدد التخصص (مثلاً: علوم، أدبي...)"
                          />
                          <datalist id="majors-list">
                            {Array.from(new Set(questions.map(q => q.major))).map(m => (
                              <option key={m} value={m} />
                            ))}
                          </datalist>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase block mb-6">الخيارات المتاحة (حدد الجواب الصحيح)</label>
                        {qOptions.map((opt, i) => (
                           <div key={i} className="flex items-center gap-4">
                              <input type="radio" checked={qCorrect === i} onChange={() => setQCorrect(i)} className="accent-red-600 w-6 h-6" />
                              <input type="text" required placeholder={`الخيار المتوقع رقم ${i+1}`} className="flex-1 h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white" value={opt} onChange={e => { const n = [...qOptions]; n[i] = e.target.value; setQOptions(n); }} />
                           </div>
                        ))}
                     </div>
                  </div>
                  <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl">{editingId ? 'تأكيد التعديل' : 'إضافة السؤال للبنك'}</button>
                </form>
              )}

              {/* ADD/EDIT FORM FOR FILES */}
              {subTab === 'add' && activeTab === 'files' && (
                <form onSubmit={addFile} className="space-y-8 max-w-2xl mx-auto py-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                      <div className="space-y-2 col-span-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">اسم الملف</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={fTitle} onChange={e => setFTitle(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">رابط التحميل</label><input type="url" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none font-mono" value={fUrl} onChange={e => setFUrl(e.target.value)} /></div>
                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">الفئة (أو اكتب فئة جديدة)</label>
                        <input 
                          type="text" 
                          list="cats-list"
                          className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" 
                          value={fCategory} 
                          onChange={e => setFCategory(e.target.value)} 
                        />
                        <datalist id="cats-list">
                          {Array.from(new Set(files.map(f => f.category))).map(c => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                   </div>
                   <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl">حفظ وإدراج الملف</button>
                </form>
              )}
              
              {/* ADD/EDIT FORM FOR SERVICES */}
              {subTab === 'add' && activeTab === 'services' && (
                <form onSubmit={addService} className="space-y-8 max-w-2xl mx-auto py-6">
                   <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">عنوان الخدمة</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={sTitle} onChange={e => setSTitle(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">الوصف التفصيلي</label><textarea rows={6} required className="w-full p-6 bg-white border border-slate-200 rounded-3xl outline-none focus:border-red-600" value={sDesc} onChange={e => setSDesc(e.target.value)} /></div>
                      
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">الأيقونة</label>
                            <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={sIcon} onChange={e => setSIcon(e.target.value)}>
                               <option value="Settings">إعدادات</option>
                               <option value="Sparkles">بريق</option>
                               <option value="Star">نجمة</option>
                               <option value="Award">جائزة</option>
                               <option value="Tool">أداة</option>
                            </select>
                         </div>
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">لون الخلفية</label>
                            <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={sColor} onChange={e => setSColor(e.target.value)}>
                               <option value="bg-slate-50">رمادي فاتح</option>
                               <option value="bg-red-50">أحمر فاتح</option>
                               <option value="bg-blue-50">أزرق فاتح</option>
                               <option value="bg-emerald-50">أخضر فاتح</option>
                            </select>
                         </div>
                      </div>
                   </div>
                   <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl">تحديث الخدمات</button>
                </form>
              )}

               {/* ADD/EDIT FORM FOR REVIEWS */}
               {subTab === 'add' && activeTab === 'reviews' && (
                <form onSubmit={addReview} className="space-y-8 max-w-2xl mx-auto py-6">
                   <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">عنوان المراجعة</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={rTitle} onChange={e => setRTitle(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">الكاتب</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={rAuthor} onChange={e => setRAuthor(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">النص</label><textarea rows={6} required className="w-full p-6 bg-white border border-slate-200 rounded-3xl outline-none focus:border-red-600" value={rDesc} onChange={e => setRDesc(e.target.value)} /></div>
                   </div>
                   <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl">حفظ المراجعة</button>
                </form>
              )}

              {/* ADD/EDIT FORM FOR FEATURES */}
              {subTab === 'add' && activeTab === 'features' && (
                <form onSubmit={addFeature} className="space-y-8 max-w-2xl mx-auto py-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                      <div className="space-y-2 col-span-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">اسم الأداة</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={featTitle} onChange={e => setFeatTitle(e.target.value)} /></div>
                      <div className="space-y-2 col-span-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">الوصف</label><textarea rows={3} required className="w-full p-6 bg-white border border-slate-200 rounded-3xl outline-none focus:border-red-600" value={featDesc} onChange={e => setFeatDesc(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">المسار (Path)</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none font-mono" value={featPath} onChange={e => setFeatPath(e.target.value)} /></div>
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">الترتيب</label><input type="number" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={featOrder} onChange={e => setFeatOrder(parseInt(e.target.value))} /></div>
                      
                      <div className="space-y-2 text-right">
                         <label className="text-xs font-black text-slate-400 uppercase">الأيقونة</label>
                         <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={featIcon} onChange={e => setFeatIcon(e.target.value)}>
                            <option value="BookOpen">كتاب</option>
                            <option value="Clock">ساعة</option>
                            <option value="HelpCircle">سؤال</option>
                            <option value="FileText">ملف</option>
                            <option value="Sparkles">بريق</option>
                         </select>
                      </div>
                      <div className="space-y-2 text-right">
                         <label className="text-xs font-black text-slate-400 uppercase">اللون (Class)</label>
                         <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={featColor} onChange={e => setFeatColor(e.target.value)}>
                            <option value="bg-red-50">أحمر</option>
                            <option value="bg-blue-50">أزرق</option>
                            <option value="bg-emerald-50">أخضر</option>
                            <option value="bg-amber-50">برتقالي</option>
                         </select>
                      </div>
                   </div>
                   <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl">حفظ الأداة</button>
                </form>
              )}
              {/* BULK ADD VIEW */}
              {subTab === 'bulk' && activeTab === 'questions' && (
                <form onSubmit={handleBulkAdd} className="space-y-8 animate-in fade-in duration-500">
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl text-right">
                    <h3 className="text-amber-900 font-black mb-2 flex items-center justify-end gap-2 text-sm">
                      تعليمات الرفع الجماعي
                      <AlertCircle className="w-4 h-4" />
                    </h3>
                    <p className="text-amber-700 text-xs leading-relaxed">
                      يجب أن يكون النص بصيغة مصفوفة JSON صحيحة. مثال: <br/>
                      <code className="bg-white/50 p-1 rounded font-mono text-[10px]">
                        [{ "{" } "text": "السؤال؟", "options": ["أ", "ب", "ج", "د"], "correct": 0, "major": "رياضيات", "image_url": "رابط الصورة" { "}" }]
                      </code>
                    </p>
                  </div>
                  <textarea 
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    required
                    placeholder="الصق نص JSON هنا..."
                    className="w-full h-[400px] p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:bg-white focus:border-red-600 font-mono text-sm leading-relaxed"
                  />
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-16 bg-red-600 text-white rounded-[2rem] font-black hover:bg-slate-900 transition-all shadow-2xl flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                    رفع ومعالجة جميع الأسئلة الآن
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* JSON Preview Modal */}
      <AnimatePresence>
        {previewQuestions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewQuestions(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="text-right">
                  <h3 className="text-xl font-black text-slate-900">معاينة الأسئلة قبل الاستيراد</h3>
                  <p className="text-slate-500 text-sm">سيتم إضافة {previewQuestions.length} سؤال إلى قاعدة البيانات</p>
                </div>
                <button onClick={() => setPreviewQuestions(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors order-first">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" dir="rtl">
                {previewQuestions.map((q, idx) => (
                  <div key={idx} className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm space-y-3 text-right">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black mb-2">{q.major}</span>
                        <h4 className="text-lg font-bold text-slate-900 text-right">
                          <span className="text-red-500 ml-2">{idx + 1}.</span>
                          {q.text}
                        </h4>
                      </div>
                      {q.image_url && (
                        <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0">
                          <img src={q.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt: string, optIdx: number) => (
                        <div 
                          key={optIdx} 
                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all text-right ${
                            optIdx === q.correct 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500/20' 
                            : 'bg-slate-50 border-slate-100 text-slate-500'
                          }`}
                        >
                          <span className="ml-2 opacity-50">{String.fromCharCode(65 + optIdx)})</span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button 
                   onClick={() => setPreviewQuestions(null)}
                   className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all order-last"
                >
                  إلغاء
                </button>
                <button 
                  onClick={confirmJSONImport}
                  disabled={loading}
                  className="px-10 py-3 bg-red-600 text-white rounded-xl font-black shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  تأكيد واستيراد الآن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
}
