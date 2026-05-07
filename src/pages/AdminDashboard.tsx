import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  LayoutDashboard, Plus, LogOut, FileText, HelpCircle, Loader2, 
  CheckCircle2, AlertCircle, Sparkles, Trash2, Edit3, Layers, 
  Search, X, MessageSquare, Shield, Settings, Menu, Bell, User, Clock, ChevronRight,
  Download, Image as ImageIcon, Eye, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, Header, Footer, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun, BorderStyle } from "docx";
import { saveAs } from "file-saver";

const CATEGORIES = ["مختبرات", "تمريض", "قانون", "معلم صف", "IT", "الإدارة العامة"];

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'files' | 'services' | 'settings' | 'features' | 'reviews' | 'contacts' | 'instructor_requests'>('questions');
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
  const [instructorRequests, setInstructorRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");
  const [imageValid, setImageValid] = useState<boolean | null>(null);
  const [lastBatchIds, setLastBatchIds] = useState<(string | number)[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[] | null>(null);

  useEffect(() => {
    if (!supabase) return;
    
    console.log("Setting up Supabase Realtime...");

    // Unified channel for both tables
    const adminChannel = supabase.channel('admin-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'instructor_requests' 
      }, (payload) => {
        console.log("New Instructor Request Received:", payload);
        const newReq = { ...payload.new, type: 'instructor_request' };
        setNotifications(prev => [newReq, ...prev]);
        setStatus({ type: 'success', msg: 'لديك طلب انضمام جديد: ' + (payload.new.fullName || '') });
        // Also update the list immediately if user is on that tab
        setInstructorRequests(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'contact_messages' 
      }, (payload) => {
        console.log("New Contact Message Received:", payload);
        const newMsg = { ...payload.new, type: 'contact_message' };
        setNotifications(prev => [newMsg, ...prev]);
        setStatus({ type: 'success', msg: 'لديك رسالة تواصل جديدة: ' + (payload.new.name || '') });
        // Also update the list immediately if user is on that tab
        setContacts(prev => [payload.new, ...prev]);
      })
      .subscribe((status) => {
        console.log("Supabase Realtime Status:", status);
        if (status === 'CHANNEL_ERROR') {
          console.error("Failed to connect to Supabase Realtime. Ensure 'Realtime' is enabled for tables in Supabase dashboard.");
        }
      });

    return () => { 
      supabase.removeChannel(adminChannel);
    };
  }, [supabase]);

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
            image_url: q.image_url || q.image || q.imageUrl || q.img_url || ""
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

  const [bulkGenText, setBulkGenText] = useState("");
  const [bulkGenFileName, setBulkGenFileName] = useState("");
  const [bulkCategory, setBulkCategory] = useState("عام");
  const [platformName, setPlatformName] = useState("JO Students");
  const [rightsText, setRightsText] = useState("All rights reserved");
  const [docDescription, setDocDescription] = useState("JO Students Assessment Document");
  const [watermarkText, setWatermarkText] = useState("JO STUDENTS");
  const [generatedBlob, setGeneratedBlob] = useState<{ blob: Blob, name: string, type: string } | null>(null);

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
      const [q, f, s, settings, feat, rev, con, stats, instReq] = await Promise.all([
        supabase.from('questions').select('*').order('id', { ascending: false }),
        supabase.from('question_files').select('*').order('id', { ascending: false }),
        supabase.from('services').select('*').order('id', { ascending: false }),
        supabase.from('site_settings').select('key, value'),
        supabase.from('features').select('*').order('order_index', { ascending: true }),
        supabase.from('reviews').select('*').order('id', { ascending: false }),
        supabase.from('contact_messages').select('*').order('id', { ascending: false }),
        supabase.from('visitor_stats').select('count').eq('id', 1).single(),
        supabase.from('instructor_requests').select('*').order('created_at', { ascending: false })
      ]);
      if (q.data) setQuestions(q.data);
      if (f.data) setFiles(f.data);
      if (s.data) setServices(s.data);
      if (feat.data) setFeatures(feat.data);
      if (rev.data) setReviews(rev.data);
      if (con.data) setContacts(con.data);
      if (instReq.data) setInstructorRequests(instReq.data);
      
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

  const deleteAllQuestions = async () => {
    if (!supabase || !window.confirm("هل أنت متأكد من حذف جميع الأسئلة بشكل نهائي؟ هذا الإجراء لا يمكن التراجع عنه.")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('questions').delete().neq('id', 0); // Assuming ID > 0
      if (error) throw error;
      setStatus({ type: 'success', msg: 'تم حذف جميع الأسئلة بنجاح' });
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

  const handleManualFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    setLoading(true);
    setStatus({ type: 'success', msg: 'جاري رفع الملف...' });
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `manual/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('bank_files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('bank_files').getPublicUrl(fileName);
      
      setFUrl(publicUrl);
      // Auto-fill title if empty
      if (!fTitle) setFTitle(file.name.split('.')[0]);
      setFSize((file.size / 1024 / 1024).toFixed(2) + " MB");
      
      setStatus({ type: 'success', msg: 'تم رفع الملف وتوليد الرابط بنجاح!' });
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatus({ type: 'error', msg: 'فشل في رفع الملف: ' + err.message });
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

  // Bulk Generation Logic
  const [alsoSaveToDB, setAlsoSaveToDB] = useState(false);

  const handleBulkGen = async (type: 'pdf' | 'docx') => {
    try {
      if (!bulkGenText.trim()) throw new Error("يرجى لصق نص JSON أولاً");
      let data;
      try {
        data = JSON.parse(bulkGenText);
      } catch (e) {
        throw new Error("خطأ في تنسيق JSON. تأكد من صحة النص الملصق.");
      }
      
      if (!Array.isArray(data)) throw new Error("يجب أن يكون النص مصفوفة JSON تحتوي على كائنات الأسئلة.");
      
      setLoading(true);
      if (type === 'pdf') {
        const doc = new jsPDF('p', 'pt');
        
        const drawPageBackground = (pdf: any) => {
          pdf.saveGraphicsState();
          pdf.setTextColor(240, 240, 240); 
          pdf.setFontSize(70);
          pdf.setFont("helvetica", "bold");
          // Centered Watermark
          const pageWidth = pdf.internal.pageSize.width;
          const pageHeight = pdf.internal.pageSize.height;
          pdf.text(watermarkText, pageWidth / 2, pageHeight / 2, { angle: 45, align: 'center' });
          pdf.restoreGraphicsState();

          // Header Branding
          pdf.setDrawColor(220, 38, 38);
          pdf.setLineWidth(2);
          pdf.line(40, 65, 550, 65);
          
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.setTextColor(220, 38, 38);
          pdf.text(platformName, 40, 50);
          
          pdf.setFontSize(10);
          pdf.setTextColor(100, 116, 139);
          pdf.text(`${rightsText} © ${new Date().getFullYear()}`, 430, 50);

          // Footer
          pdf.setFontSize(9);
          pdf.setTextColor(148, 163, 184);
          pdf.text("https://jostudents.com", pageWidth / 2, 820, { align: 'center' });
        };

        drawPageBackground(doc);

        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42); // Slate 900
        const title = bulkGenFileName || docDescription || (platformName + " Exam");
        doc.text(title, 40, 100);
        
        let yPos = 140;

        for (let i = 0; i < data.length; i++) {
          const q = data[i];
          doc.setFontSize(14);
          doc.setTextColor(15, 23, 42);
          
          // 1. Add Image FIRST if exists
          if (q.image_url) {
            try {
              const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(q.image_url)}`;
              const imgWidth = 250;
              const imgHeight = 160;
              
              if (yPos + imgHeight > 760) {
                 doc.addPage();
                 drawPageBackground(doc);
                 yPos = 100;
              }
              
              await new Promise(res => setTimeout(res, 200));
              const imgResp = await fetch(proxyUrl);
              if (!imgResp.ok) throw new Error(`Fetch failed: ${imgResp.status}`);
              const imgData = await imgResp.arrayBuffer();
              const uint8 = new Uint8Array(imgData);
              
              doc.addImage(uint8, 'JPEG', 40, yPos, imgWidth, imgHeight);
              yPos += imgHeight + 15;
            } catch (e) {
              console.error("Failed to add image to PDF", e);
            }
          }

          // 2. Question Text (Below Image)
          doc.setFont("helvetica", "bold");
          const questionText = `${i + 1}. ${q.text || ""}`;
          const splitTitle = doc.splitTextToSize(questionText, 500);
          
          if (yPos + (splitTitle.length * 20) > 800) {
            doc.addPage();
            drawPageBackground(doc);
            yPos = 100;
          }
          
          // Right align if Arabic-like text (approximate)
          const isArabic = /[\u0600-\u06FF]/.test(questionText);
          if (isArabic) {
            // Limited RTL support in jsPDF without custom fonts, but we'll try to position correctly
            doc.text(splitTitle, 550, yPos, { align: 'right' });
          } else {
            doc.text(splitTitle, 40, yPos);
          }
          yPos += (splitTitle.length * 20) + 8;

          doc.setFont("helvetica", "normal");
          (q.options || []).forEach((o: any, idx: number) => {
            const isCorrect = idx === q.correct;
            if (isCorrect) {
              doc.setTextColor(220, 38, 38); 
              doc.setFont("helvetica", "bold");
            } else {
              doc.setTextColor(71, 85, 105); // Slate 600
              doc.setFont("helvetica", "normal");
            }

            const optionLabel = `(${String.fromCharCode(65 + idx)})`;
            const optionContent = `${o} ${isCorrect ? '✓' : ''}`;
            const fullOption = `${optionLabel} ${optionContent}`;
            const splitOption = doc.splitTextToSize(fullOption, 480);

            if (isArabic) {
               doc.text(splitOption, 540, yPos, { align: 'right' });
            } else {
               doc.text(splitOption, 60, yPos);
            }
            
            yPos += (splitOption.length * 18);
          });
          
          yPos += 30;
          if (yPos > 740) {
            doc.addPage();
            drawPageBackground(doc);
            yPos = 100;
          }
        }

        const blob = doc.output('blob');
        const finalName = (bulkGenFileName || `exam_${Date.now()}`) + ".pdf";
        setGeneratedBlob({ blob, name: finalName, type: 'application/pdf' });
      } else {
        // Prepare Docx Children
        const processedDocChildren: any[] = [
          new Paragraph({ 
            children: [
              new TextRun({ 
                text: bulkGenFileName || docDescription, 
                bold: true, 
                size: 36, 
                color: "0F172A",
                font: "Traditional Arabic" 
              })
            ],
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 400, after: 600 }
          }),
        ];

        for (let i = 0; i < data.length; i++) {
          const q = data[i];

          // 1. Image FIRST in DOCX
          if (q.image_url) {
             try {
                await new Promise(res => setTimeout(res, 200));
                const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(q.image_url)}`;
                const imgResp = await fetch(proxyUrl);
                if (!imgResp.ok) throw new Error(`Fetch failed: ${imgResp.status}`);
                const imgData = await imgResp.arrayBuffer();
                processedDocChildren.push(
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: new Uint8Array(imgData),
                        transformation: { width: 350, height: 220 },
                      } as any),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 300, after: 150 }
                  })
                );
             } catch(e) {
                console.error("Docx image fetch error", e);
             }
          }

          // 2. Question Text Below Image
          processedDocChildren.push(
            new Paragraph({ 
              children: [
                new TextRun({ 
                  text: `${i + 1}. ${q.text}`, 
                  bold: true, 
                  size: 32, 
                  color: "0F172A",
                  font: "Traditional Arabic" 
                })
              ],
              spacing: { before: 200, after: 150 },
              bidirectional: true
            })
          );

          (q.options || []).forEach((o: any, idx: number) => {
            const isCorrect = idx === q.correct;
            processedDocChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `(${String.fromCharCode(65 + idx)}) ${o} ${isCorrect ? ' ✓' : ''}`,
                    bold: isCorrect,
                    color: isCorrect ? "DC2626" : "475569",
                    size: 26,
                    font: "Traditional Arabic",
                    shading: isCorrect ? { fill: "FEE2E2", type: "clear" } : undefined,
                  })
                ],
                indent: { right: 720 }, // Right indent for RTL feel
                spacing: { after: 120 },
                bidirectional: true
              })
            );
          });
          
          processedDocChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        }

        const doc = new Document({
          sections: [{
            properties: {
              page: {
                margin: { top: 720, bottom: 720, left: 720, right: 720 }
              },
            },
            headers: {
              default: new Header({
                children: [
                   new Paragraph({
                     children: [
                       new TextRun({ text: platformName, bold: true, color: "DC2626", size: 24, font: "Arial" }),
                       new TextRun({ text: `\t\t${rightsText}`, color: "64748B", size: 16, font: "Arial" }),
                     ],
                     border: { bottom: { color: "DC2626", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                     spacing: { after: 200 }
                   }),
                   // Watermark text in header (simulated since docx lib watermark is complex)
                   new Paragraph({
                     children: [
                       new TextRun({ 
                         text: watermarkText, 
                         color: "F1F5F9", 
                         size: 96,
                         bold: true,
                         font: "Arial"
                       })
                     ],
                     alignment: AlignmentType.CENTER,
                     spacing: { before: 4000 } // Push down to middle
                   })
                ]
              })
            },
            footers: {
              default: new Footer({
                children: [
                   new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: "https://jostudents.com", color: "94A3B8", size: 18, bold: true, font: "Arial" })
                    ],
                    border: { top: { color: "E2E8F0", style: BorderStyle.SINGLE, size: 6 } },
                    spacing: { before: 100 }
                  })
                ]
              })
            },
            children: processedDocChildren
          }]
        });

        const blob = await Packer.toBlob(doc);
        const finalName = (bulkGenFileName || `exam_${Date.now()}`) + ".docx";
        setGeneratedBlob({ blob, name: finalName, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      }

      if (alsoSaveToDB) {
        // Map data to ensure it matches question table exactly
        const mappedData = data.map(q => ({
          text: q.text,
          options: q.options,
          correct: q.correct,
          major: q.major || bulkCategory,
          image_url: q.image_url || ""
        }));
        const { error } = await supabase.from('questions').insert(mappedData);
        if (error) throw new Error("فشل في حقن الأسئلة في قاعدة البيانات: " + error.message);
        setStatus({ type: 'success', msg: `تم توليد الملف وحقن ${data.length} سؤال بنجاح` });
      } else {
        setStatus({ type: 'success', msg: 'تم توليد الملف بنجاح! يمكنك الآن تنزيله أو نشره.' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const publishGeneratedFile = async () => {
    if (!generatedBlob || !supabase) return;
    setLoading(true);
    try {
      // 1. Upload to Supabase Storage
      const fileExt = generatedBlob.name.split('.').pop();
      const fileName = `generated/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('bank_files')
        .upload(fileName, generatedBlob.blob, {
          contentType: generatedBlob.type,
          upsert: true
        });
      
      if (uploadErr) {
        if (uploadErr.message.includes("not found")) {
            throw new Error("حاوية التخزين 'bank_files' غير موجودة. يرجى إنشاؤها يدوياً في لوحة تحكم Supabase لتتمكن من النشر.");
        }
        throw uploadErr;
      }

      const { data: { publicUrl } } = supabase.storage.from('bank_files').getPublicUrl(fileName);

      // 2. Add to metadata table
      const { error: dbErr } = await supabase.from('question_files').insert({
        title: bulkGenFileName || generatedBlob.name.split('.')[0],
        url: publicUrl,
        category: bulkCategory,
        file_size: (generatedBlob.blob.size / 1024 / 1024).toFixed(2) + " MB",
        file_date: new Date().toLocaleDateString('en-CA'), // YYYY/MM/DD
        download_count: 0
      });

      if (dbErr) throw dbErr;

      setStatus({ type: 'success', msg: 'تم النشر بنجاح في بنك الملفات! الطلاب سيشاهدونها الآن.' });
      setGeneratedBlob(null);
      setBulkGenText("");
      setBulkGenFileName("");
      fetchData(); // Refresh counts and lists
    } catch (err: any) {
      setStatus({ type: 'error', msg: `فشل النشر: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'questions', name: 'بنك الأسئلة', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'files', name: 'بنك الملفات', icon: <FileText className="w-5 h-5" /> },
    { id: 'services', name: 'الخدمات المهنية', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'features', name: 'أدوات التفوق', icon: <Layers className="w-5 h-5" /> },
    { id: 'reviews', name: 'المراجعات', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'contacts', name: 'الرسائل الواردة', icon: <Bell className="w-5 h-5" /> },
    { id: 'settings', name: 'بناء الهوية', icon: <Settings className="w-5 h-5" /> },
    { id: 'instructor_requests', name: 'طلبات الانضمام', icon: <UserCheck className="w-5 h-5" /> },
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
              <div className={`relative ${activeTab === item.id ? 'text-red-600' : 'text-slate-400 group-hover:text-red-600'}`}>
                {item.icon}
                {!sidebarOpen && item.id === 'contacts' && contacts.length > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-blue-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white">
                    {contacts.length}
                  </span>
                )}
                {!sidebarOpen && item.id === 'instructor_requests' && instructorRequests.length > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white">
                    {instructorRequests.length}
                  </span>
                )}
              </div>
              {sidebarOpen && <span className="font-bold text-sm whitespace-nowrap">{item.name}</span>}
              
              {/* Count Badges (Expanded Sidebar) */}
              {sidebarOpen && item.id === 'contacts' && contacts.length > 0 && (
                <span className="mr-auto bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {contacts.length}
                </span>
              )}
              {sidebarOpen && item.id === 'instructor_requests' && instructorRequests.length > 0 && (
                <span className="mr-auto bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {instructorRequests.length}
                </span>
              )}

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
            <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors">
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
                    )}
                </button>
                {showNotifications && (
                    <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h4 className="font-black text-sm">إشعارات جديدة</h4>
                            <button 
                              onClick={() => fetchData()} 
                              className="text-[10px] text-blue-600 font-bold hover:underline"
                            >
                              تحديث البيانات
                            </button>
                        </div>
                        {notifications.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-slate-500 mb-1">لا توجد إشعارات</p>
                                <p className="text-[10px] text-slate-300">ملاحظة: تأكد من تفعيل Realtime في Supabase لوصول التنبيهات تلقائياً</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                                {notifications.map((n, i) => (
                                    <button 
                                      key={i} 
                                      onClick={() => { 
                                        setActiveTab(n.type === 'instructor_request' ? 'instructor_requests' : 'contacts'); 
                                        setShowNotifications(false); 
                                        setNotifications(prev => prev.filter((_, idx) => idx !== i));
                                      }} 
                                      className="group w-full text-right p-3 hover:bg-slate-50 rounded-xl transition-all border-b border-slate-50 last:border-0 flex gap-3"
                                    >
                                        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${
                                          n.type === 'instructor_request' ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                                        }`}>
                                          {n.type === 'instructor_request' ? <UserCheck className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                  n.type === 'instructor_request' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {n.type === 'instructor_request' ? 'طلب انضمام' : 'رسالة جديدة'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">{new Date(n.created_at || Date.now()).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="text-sm font-bold text-slate-900 truncate">{n.fullName || n.name}</div>
                                            <div className="text-xs text-slate-500 truncate">{n.major || n.subject || n.message}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {notifications.length > 0 && (
                            <button 
                              onClick={() => setNotifications([])}
                              className="w-full mt-3 py-2 text-xs font-bold text-slate-400 hover:text-red-600 transition-colors"
                            >
                                مسح الكل
                            </button>
                        )}
                    </div>
                )}
            </div>

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
                  {activeTab === 'files' && (
                    <button 
                      onClick={() => setSubTab('bulk_gen')}
                      className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                        subTab === 'bulk_gen' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      توليد ملف من أسئلة
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
                <button onClick={deleteAllQuestions} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all font-bold text-xs" title="حذف جميع الأسئلة">
                  حذف الكل
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
              {subTab === 'list' && activeTab !== 'settings' && activeTab !== 'contacts' && activeTab !== 'instructor_requests' && (
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
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
              {subTab === 'list' && activeTab === 'instructor_requests' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">الاسم الكامل</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">البريد الإلكتروني</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">رقم الهاتف</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">التخصص</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">نبذة عن الخبرة</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">التاريخ</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {instructorRequests.map(req => (
                                <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all group">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{req.fullName}</td>
                                    <td className="px-6 py-4 text-sm text-red-600 font-bold">{req.email}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{req.phone}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{req.major}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">{req.experience}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{new Date(req.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center">
                                            <button 
                                                onClick={() => deleteItem('instructor_requests', req.id)} 
                                                className="p-2 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                                title="حذف الطلب"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                              <img src={qImage} alt="Preview" className="max-h-32 mx-auto rounded-lg object-contain" referrerPolicy="no-referrer" />
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
                      <div className="space-y-4 col-span-2 bg-white p-6 rounded-3xl border-2 border-dashed border-slate-200 text-right">
                         <label className="text-xs font-black text-slate-400 uppercase block mb-2">رفع الملف مباشرة (توليد الرابط تلقائياً)</label>
                         <input 
                           type="file" 
                           onChange={handleManualFileUpload} 
                           disabled={loading}
                           className="block w-full text-sm text-slate-500 file:ml-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                         />
                      </div>
                      <div className="border-t border-slate-200 col-span-2 my-2"></div>
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

              {/* BULK GENERATION & PUBLISHING VIEW */}
              {subTab === 'bulk_gen' && activeTab === 'files' && (
                <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
                  <div className="bg-blue-50 border border-blue-200 p-8 rounded-[3rem] text-right relative overflow-hidden">
                    <div className="absolute top-0 left-0 p-8 text-blue-100 opacity-20"><HelpCircle className="w-32 h-32" /></div>
                    <div className="relative z-10">
                      <h3 className="text-blue-900 font-extrabold mb-4 flex items-center justify-end gap-3 text-lg">
                        أداة توليد ونشر الملفات الذكية
                        <Sparkles className="w-6 h-6" />
                      </h3>
                      <p className="text-blue-700 text-sm leading-relaxed mb-6">
                        هذه الأداة تمكنك من تحويل مصفوفة من الأسئلة (JSON) إلى ملفات احترافية (PDF/Word) ونشرها فوراً في بنك الملفات للطلاب.
                      </p>
                      <div className="bg-white/80 p-4 rounded-2xl border border-blue-100 font-mono text-[11px] text-blue-900 text-left ltr">
                        <span className="text-blue-400">// التنسيق المطلوب:</span><br/>
                        [{"{"} "text": "السؤال", "options": ["أ", "ب", "ج", "د"], "correct": 0, "major": "رياضيات" {"}"}]
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Customization Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-2">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase pr-2">اسم المنصة (Header)</label>
                             <input 
                               type="text"
                               value={platformName}
                               onChange={(e) => setPlatformName(e.target.value)}
                               className="w-full h-10 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 transition-all font-bold text-sm"
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase pr-2">حقوق النشر</label>
                             <input 
                               type="text"
                               value={rightsText}
                               onChange={(e) => setRightsText(e.target.value)}
                               className="w-full h-10 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 transition-all font-bold text-sm"
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase pr-2">وصف الملف (العنوان)</label>
                             <input 
                               type="text"
                               value={docDescription}
                               onChange={(e) => setDocDescription(e.target.value)}
                               className="w-full h-10 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 transition-all font-bold text-sm"
                             />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase pr-2">نص العلامة المائية</label>
                             <input 
                               type="text"
                               value={watermarkText}
                               onChange={(e) => setWatermarkText(e.target.value)}
                               className="w-full h-10 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 transition-all font-bold text-sm"
                             />
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                             <label className="text-sm font-black text-slate-400 uppercase pr-2">اسم الملف النهائي</label>
                             <input 
                               type="text"
                               value={bulkGenFileName}
                               onChange={(e) => setBulkGenFileName(e.target.value)}
                               placeholder="مثال: امتحان الفيزياء النهائي"
                               className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold"
                             />
                        </div>
                        <div className="flex-1 space-y-2">
                             <label className="text-sm font-black text-slate-400 uppercase pr-2">التخصص المستهدف</label>
                             <select 
                               value={bulkCategory}
                               onChange={(e) => setBulkCategory(e.target.value)}
                               className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold"
                             >
                               {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                               <option value="عام">عام / أخرى</option>
                             </select>
                        </div>
                    </div>
                    
                    <textarea 
                      value={bulkGenText}
                      onChange={(e) => setBulkGenText(e.target.value)}
                      placeholder="الصق الأسئلة هنا بصيغة JSON..."
                      className="w-full h-[300px] p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:bg-white focus:border-blue-600 font-mono text-sm leading-relaxed transition-all shadow-inner"
                    />
                    
                    <div className="flex items-center justify-end gap-3 px-4">
                        <span className="text-sm font-bold text-slate-600">حقن الأسئلة أيضاً في بنك الأسئلة (قاعدة البيانات)</span>
                        <button 
                          onClick={() => setAlsoSaveToDB(!alsoSaveToDB)}
                          className={`w-12 h-6 rounded-full transition-all relative ${alsoSaveToDB ? 'bg-red-600' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${alsoSaveToDB ? (sidebarOpen ? 'right-7' : 'right-7') : 'right-1'}`} />
                        </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleBulkGen('pdf')}
                      disabled={loading || !bulkGenText}
                      className="h-16 bg-red-600 text-white rounded-2xl font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                    >
                      <FileText className="w-5 h-5" />
                      توليد مستند PDF
                    </button>
                    <button 
                      onClick={() => handleBulkGen('docx')}
                      disabled={loading || !bulkGenText}
                      className="h-16 bg-blue-600 text-white rounded-2xl font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                    >
                      <Download className="w-5 h-5" />
                      توليد مستند Word
                    </button>
                  </div>

                  <AnimatePresence>
                    {generatedBlob && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-[3rem] text-center space-y-6"
                      >
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xl font-black text-emerald-900">تم تجهيز الملف بنجاح!</h4>
                          <p className="text-emerald-600 font-bold">اسم الملف: {generatedBlob.name}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                          <button 
                            onClick={publishGeneratedFile}
                            disabled={loading}
                            className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white rounded-[2rem] font-black hover:bg-emerald-700 transition-all shadow-xl flex items-center justify-center gap-3"
                          >
                            <Plus className="w-5 h-5" />
                            نشر في بنك الملفات للطلاب
                          </button>
                          <button 
                            onClick={() => saveAs(generatedBlob.blob, generatedBlob.name)}
                            className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-emerald-600 text-emerald-600 rounded-[2rem] font-black hover:bg-emerald-50 transition-all flex items-center justify-center gap-3"
                          >
                            <Download className="w-5 h-5" />
                            تحميل الملف لجهازي فقط
                          </button>
                        </div>
                        <button 
                          onClick={() => setGeneratedBlob(null)}
                          className="text-emerald-400 font-bold hover:text-emerald-600 text-sm transition-colors"
                        >
                          بدء من جديد
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
                          <img src={q.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
