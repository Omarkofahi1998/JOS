import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  LayoutDashboard, Plus, LogOut, FileText, HelpCircle, Loader2, BookOpen, 
  CheckCircle2, AlertCircle, Sparkles, Trash2, Edit3, Layers, 
  Search, X, MessageSquare, Shield, Settings, Menu, Bell, User, Clock, ChevronRight, Megaphone,
  Download, Image as ImageIcon, Eye, EyeOff, UserCheck, Mail, UploadCloud, Share2, Briefcase, MapPin,
  Building2, BarChart3, Users, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, Header, Footer, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { parseQuestionsInput } from "../utils/questionParser";

const CATEGORIES = ["مختبرات", "تمريض", "قانون", "معلم صف", "IT", "الإدارة العامة"];

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'files' | 'services' | 'settings' | 'features' | 'reviews' | 'contacts' | 'instructor_requests' | 'registrations' | 'service_providers' | 'announcements' | 'academy_products' | 'jobs' | 'user_bookings' | 'users' | 'instructor_portal'>('questions');
  const [subTab, setSubTab] = useState<'add' | 'list' | 'bulk' | 'approvals'>('list');
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
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [adminJobs, setAdminJobs] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
  const [academyProducts, setAcademyProducts] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [dailyVisitorsCount, setDailyVisitorsCount] = useState<number>(0);
  const [dailyVisitorsList, setDailyVisitorsList] = useState<Array<{ date: string; count: number }>>([]);
  const [visitorSearchTerm, setVisitorSearchTerm] = useState<string>("");
  const [editingVisitorDate, setEditingVisitorDate] = useState<string | null>(null);
  const [editingVisitorCount, setEditingVisitorCount] = useState<number>(0);
  const [showVisitorModal, setShowVisitorModal] = useState<boolean>(false);
  const handleSaveVisitorCount = async (targetDate: string, newCount: number) => {
    try {
      let updatedList = dailyVisitorsList.map(item => 
        item.date === targetDate ? { ...item, count: newCount } : item
      );
      if (!updatedList.some(item => item.date === targetDate)) {
        updatedList.push({ date: targetDate, count: newCount });
      }
      updatedList.sort((a, b) => b.date.localeCompare(a.date));
      setDailyVisitorsList(updatedList);

      const historyMap: Record<string, number> = {};
      updatedList.forEach(item => { historyMap[item.date] = item.count; });

      await supabase.from('site_settings').upsert({
        key: 'daily_visitors_history',
        value: JSON.stringify(historyMap)
      });

      const todayDate = new Date().toISOString().split('T')[0];
      if (targetDate === todayDate) {
        setDailyVisitorsCount(newCount);
        await supabase.from('site_settings').upsert({
          key: 'daily_visitors',
          value: JSON.stringify({ date: todayDate, count: newCount })
        });
      }
      setEditingVisitorDate(null);
    } catch (err) {
      console.error("Error saving visitor count:", err);
    }
  };

  const exportVisitorReport = () => {
    const exportData = dailyVisitorsList.map(item => ({
      "التاريخ": item.date,
      "عدد الزوار": item.count,
      "اليوم": new Date(item.date).toLocaleDateString('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير الزوار اليومي");
    XLSX.writeFile(wb, `تقرير_الزوار_اليومي_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");
  const [imageValid, setImageValid] = useState<boolean | null>(null);
  const [lastBatchIds, setLastBatchIds] = useState<(string | number)[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[] | null>(null);

  // User role management states
  const [userRole, setUserRole] = useState<'admin' | 'manager'>('admin');
  const [profilesList, setProfilesList] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [instName, setInstName] = useState("");
  const [instPhone, setInstPhone] = useState("");
  const [instBio, setInstBio] = useState("");
  const [instSpecialty, setInstSpecialty] = useState("");
  const [instIsPublished, setInstIsPublished] = useState(false);
  const [instPhoto, setInstPhoto] = useState<File | null>(null);
  const [instPhotoUrl, setInstPhotoUrl] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instRole, setInstRole] = useState("instructor");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Instructor & Service Provider portal states
  const [portalTab, setPortalTab] = useState<'products' | 'services'>('products');
  const [portalSubTab, setPortalSubTab] = useState<'list' | 'add'>('list');

  useEffect(() => {
    if (!supabase) return;
    
    console.log("Setting up Supabase Realtime...");

    // Unified channel for new submissions
    const adminChannel = supabase.channel('admin-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'system_submissions' 
      }, (payload) => {
        console.log("New Submission Received:", payload);
        const submission = payload.new;
        setNotifications(prev => [submission, ...prev]);
        
        let msg = 'لديك إشعار جديد';
        if (submission.type === 'instructor') msg = 'طلب انضمام مدرس جديد: ' + submission.full_name;
        else if (submission.type === 'contact') msg = 'رسالة تواصل جديدة من: ' + submission.full_name;
        else if (submission.type === 'business') msg = 'طلب تسجيل شركة: ' + submission.full_name;
        else if (submission.type === 'service_provider') msg = 'طلب انضمام مقدم خدمة: ' + submission.full_name;
        
        setStatus({ type: 'success', msg });
        
        // Update specific lists
        if (submission.type === 'instructor') setInstructorRequests(prev => [submission, ...prev]);
        else if (submission.type === 'contact') setContacts(prev => [submission, ...prev]);
        else if (submission.type === 'business') setRegistrations(prev => [submission, ...prev]);
        else if (submission.type === 'service_provider') setServiceProviders(prev => [submission, ...prev]);
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_bookings' 
      }, (payload) => {
        console.log("New Booking Received:", payload);
        const booking = payload.new;
        setNotifications(prev => [{...booking, notif_type: 'booking'}, ...prev]);
        setStatus({ type: 'success', msg: 'حجز/شراء جديد من: ' + booking.user_name });
        setUserBookings(prev => [booking, ...prev]);
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'jobs' 
      }, (payload) => {
        console.log("New Job Received:", payload);
        const job = payload.new;
        setNotifications(prev => [{...job, notif_type: 'job'}, ...prev]);
        setStatus({ type: 'success', msg: 'وظيفة جديدة بانتظار الموافقة: ' + job.title });
        setAdminJobs(prev => [job, ...prev]);
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

  useEffect(() => {
    if (!supabase) return;
    
    const channel = supabase.channel('online_users_admin', {
      config: {
        presence: {
          key: 'admin-' + Math.random().toString(36).substring(7),
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString(), role: 'admin' });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Import JSON function
  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target?.result as string;
        const validQuestions = parseQuestionsInput(rawContent);

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
      'رابط الصورة': q.image_url || 'لا يوجد',
      'تفسير الإجابة': q.explanation || 'لا يوجد'
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
      image_url: q.image_url || "",
      explanation: q.explanation || ""
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
      image_url: q.image_url || "",
      explanation: q.explanation || ""
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
    
    autoTable(doc, {
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
      q.options[q.correct],
      q.explanation || "No explanation provided"
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['#', 'Correct Answer', 'Explanation']],
      body: answerBody,
      styles: { fontSize: 9, cellPadding: 5 }
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
  const [qExplanation, setQExplanation] = useState("");
  const [bulkText, setBulkText] = useState("");

  const [fTitle, setFTitle] = useState("");
  const [fUploadFile, setFUploadFile] = useState<File | null>(null);
  const [fCategory, setFCategory] = useState("مختبرات");
  const [fUrl, setFUrl] = useState("");
  const [fSize, setFSize] = useState("1.0 MB");

  const [sTitle, setSTitle] = useState("");
  const [sDesc, setSDesc] = useState("");
  const [sIcon, setSIcon] = useState("Settings");
  const [sColor, setSColor] = useState("bg-slate-50");
  const [sPrice, setSPrice] = useState("");
  const [sPriceJod, setSPriceJod] = useState("");
  const [sCategory, setSCategory] = useState("خدمات طلابية");
  const [sProviderId, setSProviderId] = useState("");
  const [sContactMethod, setSContactMethod] = useState("whatsapp");
  const [sContactInfo, setSContactInfo] = useState("");
  const [sThumbnail, setSThumbnail] = useState("");
  const [sImageFile, setSImageFile] = useState<File | null>(null);
  const [sIsActive, setSIsActive] = useState(true);
  const [sStatus, setSStatus] = useState("active");

  const [featTitle, setFeatTitle] = useState("");
  const [featDesc, setFeatDesc] = useState("");
  const [featIcon, setFeatIcon] = useState("BookOpen");
  const [featColor, setFeatColor] = useState("bg-red-50");
  const [featPath, setFeatPath] = useState("/");
  const [featOrder, setFeatOrder] = useState(0);

  const [rTitle, setRTitle] = useState("");
  const [rDesc, setRDesc] = useState("");
  const [rAuthor, setRAuthor] = useState("Jo Students");
  const [rReference, setRReference] = useState("");
  const [rReadTime, setRReadTime] = useState("٥ دقائق");
  const [rDate, setRDate] = useState("");
  const [rFileUrl, setRFileUrl] = useState("");
  const [rFile, setRFile] = useState<File | null>(null);
  const [rImageUrl, setRImageUrl] = useState("");
  const [rImageFile, setRImageFile] = useState<File | null>(null);

  const [prodTitle, setProdTitle] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodInstructor, setProdInstructor] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOldPrice, setProdOldPrice] = useState("");
  const [prodCategory, setProdCategory] = useState("دورات تدريبية");
  const [prodType, setProdType] = useState<'course' | 'session' | 'file'>('course');
  const [prodThumbnail, setProdThumbnail] = useState("");
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [prodStatus, setProdStatus] = useState("active");
  const [prodContactMethod, setProdContactMethod] = useState("whatsapp");
  const [prodContactInfo, setProdContactInfo] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobType, setJobType] = useState("دوام كامل");
  const [jobExp, setJobExp] = useState("");
  const [jobContact, setJobContact] = useState("");
  const [jobStatus, setJobStatus] = useState<'published' | 'pending'>('published');

  const [bulkGenText, setBulkGenText] = useState("");
  const [bulkGenFileName, setBulkGenFileName] = useState("");
  const [bulkCategory, setBulkCategory] = useState("عام");
  const [platformName, setPlatformName] = useState("JO Students");
  const [rightsText, setRightsText] = useState("All rights reserved");
  const [docDescription, setDocDescription] = useState("JO Students Assessment Document");
  const [watermarkText, setWatermarkText] = useState("JO STUDENTS");
  
  // Announcements Form State
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annType, setAnnType] = useState<'banner' | 'popup'>('banner');
  const [annIsActive, setAnnIsActive] = useState(false);
  const [annShowCountdown, setAnnShowCountdown] = useState(false);
  const [annTargetDate, setAnnTargetDate] = useState("");
  const [annBtnText, setAnnBtnText] = useState("");
  const [annBtnUrl, setAnnBtnUrl] = useState("");
  const [annImageUrl, setAnnImageUrl] = useState("");
  const [annImageFile, setAnnImageFile] = useState<File | null>(null);
  const [annFileUrl, setAnnFileUrl] = useState("");
  const [annFile, setAnnFile] = useState<File | null>(null);
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalPassword, setApprovalPassword] = useState("");
  const [approvalRole, setApprovalRole] = useState("user");
  const [approvingLoading, setApprovingLoading] = useState(false);
  const [viewingMessage, setViewingMessage] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      if (!session) {
        navigate("/admin/login");
        return;
      }
      
      setSession(session);

      // Check role
      supabase!.from('profiles').select('role').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data?.role !== 'admin' && data?.role !== 'manager') {
            if (data?.role === 'user') navigate("/student/dashboard");
            else navigate("/");
          } else {
            const role = (data?.role as 'admin' | 'manager') || 'admin';
            setUserRole(role);
            if (role === 'manager' && !['questions', 'files', 'reviews', 'instructor_portal'].includes(activeTab)) {
              setActiveTab('questions');
            }
          }
        });
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
      const [q, f, s, settings, feat, rev, submissions, stats, ann, jobs, prod, bookings] = await Promise.all([
        supabase.from('questions').select('*').order('id', { ascending: false }),
        supabase.from('question_files').select('*').order('id', { ascending: false }),
        supabase.from('services').select('*').order('id', { ascending: false }),
        supabase.from('site_settings').select('key, value'),
        supabase.from('features').select('*').order('order_index', { ascending: true }),
        supabase.from('reviews').select('*').order('id', { ascending: false }),
        supabase.from('system_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('visitor_stats').select('count').eq('id', 1).single(),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('jobs').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('user_bookings').select('*, products:item_id (title, type), services:item_id (title)').order('created_at', { ascending: false })
      ]);
      if (q.data) setQuestions(q.data);
      if (f.data) setFiles(f.data);
      if (s.data) setServices(s.data);
      if (feat.data) setFeatures(feat.data);
      if (rev.data) setReviews(rev.data);
      
      if (submissions.data) {
        const sortedSubmissions = submissions.data;
        setContacts(sortedSubmissions.filter((item: any) => item.type === 'contact'));
        setInstructorRequests(sortedSubmissions.filter((item: any) => item.type === 'instructor'));
        setRegistrations(sortedSubmissions.filter((item: any) => item.type === 'business'));
        setServiceProviders(sortedSubmissions.filter((item: any) => item.type === 'service_provider'));
        setNotifications(sortedSubmissions.filter((item: any) => item.status === 'pending' || !item.status));
      }

      if (ann.data) setAnnouncements(ann.data);
      if (jobs.data) setAdminJobs(jobs.data);
      if (prod.data) setAcademyProducts(prod.data);
      if (bookings.data) setUserBookings(bookings.data);
      
      if (settings.data) {
        const obj: any = {};
        settings.data.forEach(item => obj[item.key] = item.value);

        const todayDate = new Date().toISOString().split('T')[0];
        let historyArray: Array<{ date: string; count: number }> = [];

        if (obj.daily_visitors_history) {
          try {
            const parsed = JSON.parse(obj.daily_visitors_history);
            if (typeof parsed === 'object' && parsed !== null) {
              if (Array.isArray(parsed)) {
                historyArray = parsed;
              } else {
                historyArray = Object.keys(parsed).map(d => ({
                  date: d,
                  count: Number(parsed[d]) || 0
                }));
              }
            }
          } catch (e) {
            console.error("Error parsing history array", e);
          }
        }

        let todayVal = 0;
        if (obj.daily_visitors) {
          try {
            const parsed = JSON.parse(obj.daily_visitors);
            if (parsed && parsed.date === todayDate) {
              todayVal = Number(parsed.count) || 0;
            }
          } catch (e) {}
        }

        if (historyArray.length === 0 && todayVal > 0) {
          historyArray = [{ date: todayDate, count: todayVal }];
        } else {
          const todayIdx = historyArray.findIndex(i => i.date === todayDate);
          if (todayIdx >= 0) {
            todayVal = Math.max(historyArray[todayIdx].count, todayVal);
            historyArray[todayIdx].count = todayVal;
          } else if (todayVal > 0) {
            historyArray.unshift({ date: todayDate, count: todayVal });
          }
        }

        historyArray.sort((a, b) => b.date.localeCompare(a.date));

        setDailyVisitorsList(historyArray);
        setDailyVisitorsCount(todayVal);

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

  const fetchProfiles = async () => {
    if (!supabase) return;
    setSearchLoading(true);
    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (userSearchQuery.trim()) {
        query = query.or(`email.ilike.%${userSearchQuery}%,full_name.ilike.%${userSearchQuery}%,phone.ilike.%${userSearchQuery}%`);
      }
      const { data, error } = await query;
      if (!error && data) {
        setProfilesList(data);
      } else if (error) {
        console.error("Error fetching profiles:", error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (!error) {
        setStatus({ type: 'success', msg: 'تم تحديث دور المستخدم بنجاح' });
        // Refresh local list
        setProfilesList(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
      } else {
        setStatus({ type: 'error', msg: 'فشل في تحديث الدور: ' + error.message });
      }
    } catch (e: any) {
      setStatus({ type: 'error', msg: 'حدث خطأ غير متوقع: ' + e.message });
    }
  };

  const fetchInstructors = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['instructor', 'service_provider', 'manager'])
        .order('created_at', { ascending: false });
      if (!error && data) {
        setInstructors(data);
      }
    } catch(err) {} finally { setLoading(false); }
  };

  const handleUpdateInstructor = async (e) => {
    e.preventDefault();
    if (!supabase || !editingId) return;
    setLoading(true);
    try {
      let finalPhotoUrl = instPhotoUrl;
      if (instPhoto) {
        const fileExt = instPhoto.name.split('.').pop();
        const fileName = `instructors/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('bank_files').upload(fileName, instPhoto);
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from('bank_files').getPublicUrl(fileName);
          finalPhotoUrl = publicUrl;
        }
      }

      // update profile metadata
      const profileToUpdate = instructors.find(i => i.id === editingId);
      const newMetadata = {
        ...(profileToUpdate?.metadata || {}),
        bio: instBio,
        specialty: instSpecialty,
        photoUrl: finalPhotoUrl,
        is_published: instIsPublished
      };

      const { error } = await supabase.from('profiles').update({
        full_name: instName,
        phone: instPhone,
        role: instRole,
        metadata: newMetadata
      }).eq('id', editingId);

      if (error) throw error;
      setStatus({ type: 'success', msg: 'تم تحديث بيانات العضو بنجاح' });
      setSubTab('list');
      fetchInstructors();
    } catch(err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchProfiles();
    }
    if (activeTab === 'instructors_db') {
      fetchInstructors();
    }
  }, [activeTab]);


  const handleApproveAndCreateUser = async (req: any) => {
    if (!approvalPassword) {
      setStatus({ type: 'error', msg: 'يرجى إدخال كلمة مرور للحساب الجديد' });
      return;
    }

    setApprovingLoading(true);
    setStatus(null);

    const role = approvalRole;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("يجب إضافة VITE_SUPABASE_SERVICE_ROLE_KEY في ملف البيئة الخاص بك لهذا الخيار");
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Create User in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: req.email,
        password: approvalPassword,
        email_confirm: true,
        user_metadata: {
          full_name: req.full_name || req.fullName || "User",
          role: role
        }
      });

      if (authError) throw new Error(authError.message);

      const newUserId = authData.user.id;

      // Update Profile and Role
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert([{ 
        id: newUserId, 
        email: req.email,
        full_name: req.full_name || req.fullName || "User",
        role: role,
        metadata: {
            ...req.metadata,
            source_submission_id: req.id,
            approved_at: new Date().toISOString()
        }
      }]);
      
      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw new Error("حدث خطأ أثناء إنشاء الملف الشخصي");
      }

      // Update submission status to approved
      const { error: updateError } = await supabase!.from('system_submissions').update({ status: 'approved' }).eq('id', req.id);
      if (updateError) throw updateError;

      setStatus({ type: 'success', msg: 'تمت الموافقة وإنشاء الحساب بنجاح' });
      setViewingRequest(null);
      setIsApproving(false);
      setApprovalPassword("");
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'حدث خطأ' });
    } finally {
      setApprovingLoading(false);
    }
  };

  const deleteItem = async (table: string, id: any) => {
    if (!supabase || !window.confirm("هل أنت متأكد من حذف هذا السجل بشكل نهائي؟")) return;
    if (userRole === 'manager' && !['questions', 'question_files', 'reviews', 'products', 'services'].includes(table)) {
      setStatus({ type: 'error', msg: 'عذراً، لا تملك الصلاحية لحذف هذا النوع من البيانات.' });
      return;
    }
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
    setQExplanation("");
    setBulkText("");
    setFTitle("");
    setFUrl("");
    setSTitle("");
    setSDesc("");
    setSIcon("Settings");
    setSColor("bg-slate-50");
    setSPrice("");
    setSPriceJod("");
    setSCategory("خدمات طلابية");
    setSProviderId("");
    setSContactMethod("whatsapp");
    setSContactInfo("");
    setSThumbnail("");
    setSIsActive(true);
    setSStatus("active");
    setFeatTitle("");
    setFeatDesc("");
    setRTitle("");
    setRDesc("");
    setRAuthor("Jo Students");
    setRReference("");
    setRFileUrl("");
    setRImageUrl("");
    
    setProdTitle("");
    setProdDesc("");
    setProdInstructor("");
    setProdPrice("");
    setProdOldPrice("");
    setProdCategory("دورات تدريبية");
    setProdType("course");
    setProdThumbnail("");

    setProdThumbnail("");
    setProdContactMethod("whatsapp");
    setProdContactInfo("");
    setJobTitle("");
    setJobCompany("");
    setJobLocation("");
    setJobType("دوام كامل");
    setJobExp("");
    setJobContact("");
    setJobStatus("published");
    
    setAnnTitle("");
    setAnnContent("");
    setAnnType('banner');
    setAnnIsActive(false);
    setAnnShowCountdown(false);
    setAnnTargetDate("");
    setAnnBtnText("");
    setAnnBtnUrl("");
    setAnnImageUrl("");
    setAnnImageFile(null);
    setAnnFileUrl("");
    setAnnFile(null);
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
      const payload = { text: qText, options: qOptions, correct: qCorrect, major: qMajor, image_url: qImage, explanation: qExplanation };
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
      const mappedData = parseQuestionsInput(bulkText);
      const { error } = await supabase.from('questions').insert(mappedData);
      if (error) throw error;
      
      setStatus({ type: 'success', msg: `تم رفع ${mappedData.length} سؤال بنجاح إلى قاعدة البيانات` });
      setBulkText("");
      setSubTab('list');
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: `خطأ في المعالجة: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleManualFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFUploadFile(file);
    if (!fTitle) setFTitle(file.name.split('.')[0]);
    const fileSizeStr = (file.size / 1024 / 1024).toFixed(2) + " MB";
    setFSize(fileSizeStr);

    if (!supabase) {
      setStatus({ type: 'success', msg: 'تم اختيار الملف. سيتم الرفع وتوليد الرابط عند الحفظ.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'success', msg: 'جاري رفع الملف في التخزين وتوليد رابط الوصول...' });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `manual/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('bank_files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadErr) throw uploadErr;

      const proxyUrl = `/api/files/download?bucket=bank_files&path=${fileName}`;
      setFUrl(proxyUrl);
      setStatus({ type: 'success', msg: `تم رفع الملف وتوليد الرابط غير المباشر بنجاح` });
    } catch (err: any) {
      console.warn("Storage auto-upload warn:", err.message);
      setStatus({ type: 'success', msg: 'تم اختيار الملف. سيتم الرفع وتوليد الرابط النهائي عند الحفظ.' });
    } finally {
      setLoading(false);
    }
  };

  const addFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      let finalFUrl = fUrl;
      if (fUploadFile && (!finalFUrl || finalFUrl.trim() === '')) {
        const fileExt = fUploadFile.name.split('.').pop();
        const fileName = `manual/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadErr } = await supabase.storage
          .from('bank_files')
          .upload(fileName, fUploadFile, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadErr) throw uploadErr;

        const proxyUrl = `/api/files/download?bucket=bank_files&path=${fileName}`;
        finalFUrl = proxyUrl;
        setFUrl(proxyUrl);
      }

      if (!finalFUrl || finalFUrl.trim() === '') {
        throw new Error("يرجى اختيار ملف لرفعه وتوليد الرابط تلقائياً أو إدخال رابط تحميل مباشر.");
      }

      const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
      const payload = { 
        title: fTitle || 'ملف أسئلة', 
        category: fCategory || 'عام', 
        url: finalFUrl, 
        file_size: fSize || '1.0 MB', 
        file_date: today 
      };

      let error;
      if (editingId) ({ error } = await supabase.from('question_files').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('question_files').insert({ ...payload, download_count: 0 }));
      
      if (error) {
        if (error.message.includes('row-level security') || error.code === '42501' || error.message.includes('policy')) {
          throw new Error(`تم رفع الملف وتوليد الرابط بنجاح (${finalFUrl})، ولكن رفض الحفظ في الجدول بسبب سياسة الأمن RLS. يرجى تطبيق سياسات SQL المرفقة لـ question_files.`);
        }
        throw error;
      }

      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت إضافة الملف بنجاح وتوليد رابط الوصول له' });
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
      let finalSThumbnailUrl = sThumbnail;
      if (sImageFile) {
        let uploadSuccess = false;
        try {
          const fileExt = sImageFile.name.split('.').pop();
          const fileName = `services/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadErr } = await supabase.storage.from('bank_files').upload(fileName, sImageFile);
          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage.from('bank_files').getPublicUrl(fileName);
            finalSThumbnailUrl = publicUrl;
            uploadSuccess = true;
          } else {
            console.warn("Direct upload error, falling back to API:", uploadErr.message);
          }
        } catch (err) {
          console.warn("Direct upload failed, falling back to API:", err);
        }

        if (!uploadSuccess) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', sImageFile);
          formDataUpload.append('folder', 'services');

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });

          const text = await response.text();
          if (text.trim().startsWith("<") || text.trim().startsWith("The page")) {
            throw new Error("خطأ في الاتصال بالخادم عند رفع ملف الخدمة. يرجى فتح التطبيق في علامة تبويب مستقلة.");
          }

          let data;
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error("حدث خطأ أثناء قراءة استجابة الخادم لرفع ملف الخدمة.");
          }

          if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
          }

          finalSThumbnailUrl = data.publicUrl;
        }
      }

      const payload = { 
        title: sTitle, 
        description: sDesc, 
        icon_name: sIcon, 
        bg_color: sColor,
        price: sPrice ? parseFloat(sPrice) : 0,
        price_jod: sPriceJod ? parseFloat(sPriceJod) : null,
        category: sCategory,
        provider_id: sProviderId || null,
        contact_method: sContactMethod,
        contact_info: sContactInfo,
        is_active: sIsActive,
        is_active_status: sIsActive,
        status: sStatus,
        thumbnail_url: finalSThumbnailUrl
      };
      let error;
      if (editingId) ({ error } = await supabase.from('services').update(payload).eq('id', editingId));
      else ({ error } = await supabase.from('services').insert(payload));
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت إضافة الخدمة بنجاح' });
      resetForms();
      setSubTab('list');
      if (activeTab === 'instructor_portal') setPortalSubTab('list');
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

  const handleReviewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'file') {
      setRFile(file);
      setRFileUrl(file.name);
    } else {
      setRImageFile(file);
      setRImageUrl(URL.createObjectURL(file));
    }
    setStatus({ type: 'success', msg: `تم اختيار ${type === 'file' ? 'الملف' : 'الصورة'} سيتم رفعه عند الحفظ.` });
  };

  const addReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    try {
      let finalRFileUrl = rFileUrl;
      let finalRImageUrl = rImageUrl;

      if (rFile) {
        const fileExt = rFile.name.split('.').pop();
        const fileName = `reviews/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('bank_files').upload(fileName, rFile);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from('bank_files').getPublicUrl(fileName);
        finalRFileUrl = publicUrl;
      }

      if (rImageFile) {
        const fileExt = rImageFile.name.split('.').pop();
        const fileName = `reviews/previews/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('bank_files').upload(fileName, rImageFile);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from('bank_files').getPublicUrl(fileName);
        finalRImageUrl = publicUrl;
      }

      const today = new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' });
      const payload = { 
        title: rTitle, 
        description: rDesc, 
        author: rAuthor, 
        reference_name: rReference,
        read_time: rReadTime, 
        file_date: rDate || today,
        file_url: finalRFileUrl,
        image_url: finalRImageUrl
      };
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

  const addAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      let finalFileUrl = annFileUrl;
      let finalImageUrl = annImageUrl;

      // Handle Image Upload
      if (annImageFile) {
        const fileExt = annImageFile.name.split('.').pop();
        const fileName = `img_${Math.random()}.${fileExt}`;
        const filePath = `images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('announcements')
          .upload(filePath, annImageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('announcements')
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
      }

      // Handle File Upload if selected
      if (annFile) {
        const fileExt = annFile.name.split('.').pop();
        const fileName = `file_${Math.random()}.${fileExt}`;
        const filePath = `files/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('announcements')
          .upload(filePath, annFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('announcements')
          .getPublicUrl(filePath);
        
        finalFileUrl = publicUrl;
      }

      const payload = {
        title: annTitle,
        content: annContent,
        type: annType,
        is_active: annIsActive,
        show_countdown: annShowCountdown,
        target_date: annTargetDate || null,
        button_text: annBtnText || null,
        button_url: annBtnUrl || null,
        file_url: finalFileUrl || null,
        image_url: finalImageUrl || null,
        updated_at: new Date().toISOString()
      };
      
      let error;
      if (editingId) {
        ({ error } = await supabase.from('announcements').update(payload).eq('id', editingId));
      } else {
        ({ error } = await supabase.from('announcements').insert({ ...payload, created_at: new Date().toISOString() }));
      }
      
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم تعديل الإعلان بنجاح' : 'تمت إضافة الإعلان بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: "فشل الحفظ: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Bulk Generation Logic
  const [alsoSaveToDB, setAlsoSaveToDB] = useState(false);

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      let finalProdThumbnailUrl = prodThumbnail;
      if (prodImageFile) {
        let uploadSuccess = false;
        try {
          const fileExt = prodImageFile.name.split('.').pop();
          const fileName = `products/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadErr } = await supabase.storage.from('bank_files').upload(fileName, prodImageFile);
          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage.from('bank_files').getPublicUrl(fileName);
            finalProdThumbnailUrl = publicUrl;
            uploadSuccess = true;
          } else {
            console.warn("Direct product upload error, falling back to API:", uploadErr.message);
          }
        } catch (err) {
          console.warn("Direct product upload failed, falling back to API:", err);
        }

        if (!uploadSuccess) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', prodImageFile);
          formDataUpload.append('folder', 'products');

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });

          const text = await response.text();
          if (text.trim().startsWith("<") || text.trim().startsWith("The page")) {
            throw new Error("خطأ في الاتصال بالخادم عند رفع ملف المنتج. يرجى فتح التطبيق في علامة تبويب مستقلة.");
          }

          let data;
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error("حدث خطأ أثناء قراءة استجابة الخادم لرفع ملف المنتج.");
          }

          if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
          }

          const dataJson = data;
          finalProdThumbnailUrl = dataJson.publicUrl;
        }
      }

      const payload = {
        title: prodTitle,
        description: prodDesc,
        instructor_name: prodInstructor,
        price: parseFloat(prodPrice) || 0,
        old_price: parseFloat(prodOldPrice) || null,
        category: prodCategory,
        type: prodType,
        thumbnail_url: finalProdThumbnailUrl,
        status: prodStatus,
        contact_method: prodContactMethod,
        contact_info: prodContactInfo
      };
      
      let error;
      if (editingId) {
        ({ error } = await supabase.from('products').update(payload).eq('id', editingId));
      } else {
        ({ error } = await supabase.from('products').insert(payload));
      }
      
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح' });
      resetForms();
      setSubTab('list');
      if (activeTab === 'instructor_portal') setPortalSubTab('list');
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: "فشل الحفظ: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const addJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const payload = {
        title: jobTitle,
        company_name: jobCompany,
        location: jobLocation,
        type: jobType,
        experience: jobExp,
        contact: jobContact,
        is_active: jobStatus === 'published'
      };
      
      let error;
      if (editingId) {
        ({ error } = await supabase.from('jobs').update(payload).eq('id', editingId));
      } else {
        ({ error } = await supabase.from('jobs').insert(payload));
      }
      
      if (error) throw error;
      setStatus({ type: 'success', msg: editingId ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح' });
      resetForms();
      setSubTab('list');
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: "فشل الحفظ: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGen = async (type: 'pdf' | 'docx') => {
    try {
      if (!bulkGenText.trim()) throw new Error("يرجى لصق نص الأسئلة أولاً");
      const data = parseQuestionsInput(bulkGenText);
      
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
          explanation: q.explanation || "",
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

  const getBadgeCount = (id: string) => {
    if (id === 'services') return services.filter((s: any) => s.status === 'pending').length;
    if (id === 'jobs') return adminJobs.filter((j: any) => !j.is_active).length;
    if (id === 'academy_products') return academyProducts.filter((p: any) => p.status === 'pending').length;
    if (id === 'instructor_requests') return instructorRequests.filter((r: any) => r.status === 'pending' || !r.status).length;
    if (id === 'contacts') return contacts.filter((c: any) => c.status === 'pending' || !c.status).length;
    if (id === 'registrations') return registrations.filter((r: any) => r.status === 'pending' || !r.status).length;
    if (id === 'service_providers') return serviceProviders.filter((r: any) => r.status === 'pending' || !r.status).length;
    if (id === 'user_bookings') return userBookings.filter((b: any) => b.status === 'pending').length;
    return 0;
  };

  const sidebarItems = [
    { id: 'questions', name: 'بنك الأسئلة', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'files', name: 'بنك الملفات', icon: <FileText className="w-5 h-5" /> },
    { id: 'instructor_portal', name: 'بوابة المدرب والخدمات', icon: <Sparkles className="w-5 h-5" /> },
    ...(userRole === 'admin' ? [
      { id: 'academy_products', name: 'منتجات الأكاديمية', icon: <BookOpen className="w-5 h-5" /> },
      { id: 'jobs', name: 'الوظائف', icon: <Sparkles className="w-5 h-5" /> },
      { id: 'user_bookings', name: 'المبيعات والحجوزات', icon: <BookOpen className="w-5 h-5" /> },
      { id: 'services', name: 'الخدمات المهنية', icon: <Sparkles className="w-5 h-5" /> },
      { id: 'features', name: 'أدوات التفوق', icon: <Layers className="w-5 h-5" /> },
    ] : []),
    { id: 'reviews', name: 'المراجعات', icon: <MessageSquare className="w-5 h-5" /> },
    ...(userRole === 'admin' ? [
      { id: 'contacts', name: 'الرسائل الواردة', icon: <Bell className="w-5 h-5" /> },
      { id: 'settings', name: 'بناء الهوية', icon: <Settings className="w-5 h-5" /> },
      { id: 'announcements', name: 'نظام الإعلانات', icon: <Megaphone className="w-5 h-5" /> },
      { id: 'instructor_requests', name: 'طلبات الانضمام', icon: <UserCheck className="w-5 h-5" /> },
      { id: 'registrations', name: 'طلبات الشركات', icon: <Building2 className="w-5 h-5" /> },
      { id: 'service_providers', name: 'مقدمي الخدمات', icon: <User className="w-5 h-5" /> },
      { id: 'users', name: 'إدارة الأدوار والمدراء', icon: <Shield className="w-5 h-5" /> },
      { id: 'instructors_db', name: 'إدارة الكوادر والمدربين والخبراء', icon: <UserCheck className="w-5 h-5" /> },
    ] : [])
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
          width: sidebarOpen ? 220 : (window.innerWidth < 1024 ? 0 : 64),
          x: (sidebarOpen) ? 0 : (window.innerWidth < 1024 ? 220 : 0)
        }}
        className={`bg-white border-l border-slate-200 h-screen fixed lg:sticky top-0 flex flex-col z-[60] shadow-sm transition-all overflow-hidden`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-50">
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <img 
                src="/logo.svg" 
                alt="JO Students Logo" 
                className="w-10 h-10 object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="font-black text-slate-900 tracking-tight">لوحة الإشراف</span>
            </motion.div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setSubTab('list'); resetForms(); }}
              className={`w-full flex items-center gap-4 p-2.5 rounded-xl transition-all relative group ${
                activeTab === item.id ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className={`relative ${activeTab === item.id ? 'text-red-600' : 'text-slate-400 group-hover:text-red-600'}`}>
                {item.icon}
                {!sidebarOpen && getBadgeCount(item.id) > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white">
                    {getBadgeCount(item.id)}
                  </span>
                )}
              </div>
              {sidebarOpen && <span className="font-bold text-sm whitespace-nowrap">{item.name}</span>}
              
              {/* Count Badges (Expanded Sidebar) */}
              {sidebarOpen && getBadgeCount(item.id) > 0 && (
                <span className={`mr-auto text-[10px] font-black px-2 py-0.5 rounded-full ${
                  item.id === 'contacts' ? 'bg-blue-100 text-blue-600' : 
                  item.id === 'instructor_requests' ? 'bg-red-100 text-red-600' : 
                  'bg-orange-100 text-orange-600'
                }`}>
                  {getBadgeCount(item.id)}
                </span>
              )}

              {activeTab === item.id && <motion.div layoutId="activeTab" className="absolute left-0 w-1.5 h-6 bg-red-600 rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative custom-scrollbar w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-3 md:px-6 py-3 flex items-center justify-between">
           <div className="flex items-center gap-3 md:gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-400"
              >
                <Menu className="w-6 h-6" />
              </button>
              <img 
                src="/logo.svg" 
                alt="JO Students Logo" 
                className="w-8 h-8 md:w-10 md:h-10 object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
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
                                {notifications.map((n, i) => {
                                    let icon = <MessageSquare className="w-5 h-5" />;
                                    let iconBg = 'bg-blue-50 text-blue-600 group-hover:bg-blue-100';
                                    let badgeBg = 'bg-blue-50 text-blue-600';
                                    let title = 'رسالة جديدة';
                                    let nameStr = n.full_name || n.name || n.user_name || n.company_name || n.title;
                                    let descStr = n.message || n.major || n.subject || (n.notif_type === 'booking' ? `طلب المنتج ${n.item_id}` : (n.notif_type === 'job' ? n.title : ''));
                                    let targetTab = 'contacts';
                                    
                                    if (n.notif_type === 'booking') {
                                        icon = <CheckCircle2 className="w-5 h-5" />;
                                        iconBg = 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100';
                                        badgeBg = 'bg-emerald-50 text-emerald-600';
                                        title = 'مبيعات وحجوزات';
                                        targetTab = 'user_bookings';
                                    } else if (n.notif_type === 'job') {
                                        icon = <Briefcase className="w-5 h-5" />;
                                        iconBg = 'bg-amber-50 text-amber-600 group-hover:bg-amber-100';
                                        badgeBg = 'bg-amber-50 text-amber-600';
                                        title = 'وظيفة جديدة';
                                        targetTab = 'jobs';
                                    } else if (n.type === 'instructor') {
                                        icon = <UserCheck className="w-5 h-5" />;
                                        iconBg = 'bg-red-50 text-red-600 group-hover:bg-red-100';
                                        badgeBg = 'bg-red-50 text-red-600';
                                        title = 'طلب انضمام';
                                        targetTab = 'instructor_requests';
                                    } else if (n.type === 'business') {
                                        icon = <Building2 className="w-5 h-5" />;
                                        iconBg = 'bg-purple-50 text-purple-600 group-hover:bg-purple-100';
                                        badgeBg = 'bg-purple-50 text-purple-600';
                                        title = 'تسجيل شركة';
                                        targetTab = 'registrations';
                                    } else if (n.type === 'service_provider') {
                                        icon = <User className="w-5 h-5" />;
                                        iconBg = 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100';
                                        badgeBg = 'bg-indigo-50 text-indigo-600';
                                        title = 'مقدم خدمة';
                                        targetTab = 'service_providers';
                                    }

                                    return (
                                        <button 
                                          key={i} 
                                          onClick={() => { 
                                            setActiveTab(targetTab as any); 
                                            setShowNotifications(false); 
                                            setNotifications(prev => prev.filter((_, idx) => idx !== i));
                                          }} 
                                          className="group w-full text-right p-3 hover:bg-slate-50 rounded-xl transition-all border-b border-slate-50 last:border-0 flex gap-3"
                                        >
                                            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${iconBg}`}>
                                              {icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badgeBg}`}>
                                                        {title}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">{new Date(n.created_at || Date.now()).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="text-sm font-bold text-slate-900 truncate">{nameStr}</div>
                                                <div className="text-xs text-slate-500 truncate">{descStr}</div>
                                            </div>
                                        </button>
                                    );
                                })}
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

            <button 
              onClick={() => setShowVisitorModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-red-700 border border-red-200/80 px-3 py-1.5 rounded-2xl transition-all cursor-pointer group shadow-sm"
              title="انقر لفتح نافذة إحصائيات زوار اليوم"
            >
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest leading-none">زوار اليوم</span>
                <span className="text-xs font-black text-slate-900 group-hover:text-red-700 transition-colors">
                  {dailyVisitorsCount} زائر
                </span>
              </div>
              <BarChart3 className="w-4 h-4 text-red-500 mr-0.5 group-hover:scale-110 transition-transform" />
            </button>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">تاريخ الجلسة</span>
              <span className="text-xs font-bold text-slate-900 mt-1">{new Date().toLocaleDateString('ar-JO')}</span>
            </div>
            
            <div className="flex flex-col text-left items-end pr-4 mr-4 border-r border-slate-100">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                متواجد الآن
              </span>
              <span className="text-sm font-black text-slate-900 mt-1">{onlineCount} متدرب</span>
            </div>

            <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
               <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="p-3 md:p-6 max-w-7xl mx-auto">
          {/* Action Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex flex-wrap gap-2">
              {activeTab !== 'settings' && activeTab !== 'contacts' && (
                <div className="flex flex-wrap gap-2">
                      {(activeTab === 'instructor_requests' || activeTab === 'registrations' || activeTab === 'service_providers' || activeTab === 'services' || activeTab === 'academy_products' || activeTab === 'jobs') ? (
                    <>
                      <button 
                        onClick={() => setSubTab('list')}
                        className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                          subTab === 'list' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {activeTab === 'jobs' ? 'كافة الوظائف' : activeTab === 'services' ? 'كافة الخدمات' : activeTab === 'academy_products' ? 'كافة المنتجات' : 'كل الطلبات'}
                      </button>
                      <button 
                        onClick={() => setSubTab('approvals')}
                        className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                          subTab === 'approvals' ? 'bg-amber-500 text-white border-amber-500 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        بانتظار الموافقة ({
                          activeTab === 'instructor_requests' ? instructorRequests.filter(r => r.status === 'pending' || !r.status).length :
                          activeTab === 'registrations' ? registrations.filter(r => r.status === 'pending' || !r.status).length :
                          activeTab === 'service_providers' ? serviceProviders.filter(r => r.status === 'pending' || !r.status).length :
                          activeTab === 'services' ? services.filter(s => s.status === 'pending').length :
                          activeTab === 'academy_products' ? academyProducts.filter(p => p.status === 'pending').length :
                          adminJobs.filter(j => !j.is_active).length
                        })
                      </button>
                      {(activeTab === 'services' || activeTab === 'academy_products' || activeTab === 'jobs') && (
                        <button 
                          onClick={() => { setSubTab('add'); resetForms(); }}
                          className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                            subTab === 'add' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {editingId ? 'تعديل' : 'إضافة جديد'}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {activeTab !== 'user_bookings' && (
                        <>
                          <button 
                            onClick={() => setSubTab('list')}
                            className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                              subTab === 'list' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            عرض السجلات
                          </button>
                          <button 
                            onClick={() => { setSubTab('add'); resetForms(); }}
                            className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                              subTab === 'add' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            {editingId ? 'تعديل السجل' : 'إضافة سجل جديد'}
                          </button>
                        </>
                      )}
                      
                      {activeTab === 'user_bookings' && (
                        <button 
                          onClick={() => setSubTab('list')}
                          className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                            subTab === 'list' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          عرض المبيعات
                        </button>
                      )}

                      {activeTab === 'questions' && (
                        <button 
                          onClick={() => setSubTab('bulk')}
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
                            subTab === 'bulk' ? 'bg-red-600 text-white border-red-600 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          إضافة بالجملة (JSON)
                        </button>
                      )}
                      {activeTab === 'files' && (
                        <button 
                          onClick={() => setSubTab('bulk_gen')}
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
                            subTab === 'bulk_gen' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          توليد ملف من أسئلة
                        </button>
                      )}
                    </>
                  )}
                </div>
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
              {(subTab === 'list' || subTab === 'approvals') && activeTab !== 'settings' && activeTab !== 'contacts' && activeTab !== 'instructor_requests' && activeTab !== 'registrations' && activeTab !== 'service_providers' && (
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
                                      setEditingId(item.id); setQText(item.text); setQOptions(item.options); setQCorrect(item.correct); setQMajor(item.major); setQImage(item.image_url || ""); setQExplanation(item.explanation || ""); setSubTab('add');
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
                  ) : activeTab === 'jobs' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {adminJobs
                          .filter(j => subTab === 'approvals' ? !j.is_active : j.is_active)
                          .filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase()) || j.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map(job => (
                            <div key={job.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition-all">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-black text-slate-900">{job.title}</h3>
                                  <p className="text-xs text-red-600 font-bold">{job.company_name}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${job.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                  {job.is_active ? 'منشورة' : 'قيد المراجعة'}
                                </span>
                              </div>
                              
                              <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <MapPin className="w-3.5 h-3.5" /> {job.location} • {job.type}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <User className="w-3.5 h-3.5" /> الخبرة: {job.experience}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Mail className="w-3.5 h-3.5" /> التواصل: {job.contact}
                                </div>
                              </div>

                              <div className="flex gap-2 border-t pt-4">
                                <button 
                                  onClick={() => {
                                    setEditingId(job.id);
                                    setJobTitle(job.title);
                                    setJobCompany(job.company_name);
                                    setJobLocation(job.location);
                                    setJobType(job.type);
                                    setJobExp(job.experience);
                                    setJobContact(job.contact);
                                    setJobStatus(job.is_active ? 'published' : 'pending');
                                    setSubTab('add');
                                  }}
                                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"
                                >
                                  تعديل
                                </button>
                                {!job.is_active && (
                                  <button 
                                    onClick={async () => {
                                      const { error } = await supabase!.from('jobs').update({ is_active: true }).eq('id', job.id);
                                      if (!error) {
                                        setStatus({ type: 'success', msg: 'تمت الموافقة على الوظيفة ونشرها بنجاح' });
                                        fetchData();
                                      } else {
                                        setStatus({ type: 'error', msg: error.message });
                                      }
                                    }}
                                    className="flex-grow bg-emerald-600 text-white py-2 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all"
                                  >
                                    موافقة ونشر
                                  </button>
                                )}
                                <button 
                                  onClick={() => deleteItem('jobs', job.id)}
                                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-all"
                                >
                                  حذف
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                      {adminJobs.filter(j => subTab === 'approvals' ? !j.is_active : true).length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-300 font-bold">لا يوجد وظائف حالياً</div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(activeTab === 'files' ? files : activeTab === 'services' ? services : activeTab === 'features' ? features : activeTab === 'announcements' ? announcements : activeTab === 'academy_products' ? academyProducts : reviews)
                      .filter(item => {
                        const matchesSearch = (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             (item.description || item.content || "").toLowerCase().includes(searchTerm.toLowerCase());
                        
                        // Fix: Only show pending in approvals tab, and non-pending in list tab for services & products
                        if (activeTab === 'services' || activeTab === 'academy_products') {
                          if (subTab === 'approvals') return matchesSearch && item.status === 'pending';
                          return matchesSearch && item.status !== 'pending';
                        }
                        
                        return matchesSearch;
                      }).map((item, idx) => (
                        <motion.div 
                          key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                          className={`p-6 bg-white border rounded-3xl transition-all group flex flex-col h-full ${
                             (activeTab === 'announcements' && item.is_active) || (activeTab === 'services' && item.status === 'active')
                             ? 'border-emerald-200 shadow-lg shadow-emerald-500/5' 
                             : 'border-slate-100 hover:border-red-100 hover:shadow-xl hover:shadow-red-500/5'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                  onClick={() => {
                                    if(activeTab === 'files') { setEditingId(item.id); setFTitle(item.title); setFCategory(item.category); setFUrl(item.url); setFSize(item.file_size); setSubTab('add'); }
                                    else if(activeTab === 'services') { 
                                      setEditingId(item.id); 
                                      setSTitle(item.title); 
                                      setSDesc(item.description); 
                                      setSIcon(item.icon_name || "Settings"); 
                                      setSColor(item.bg_color || "bg-slate-50"); 
                                      setSPrice(item.price?.toString() || "");
                                      setSPriceJod(item.price_jod?.toString() || "");
                                      setSCategory(item.category || "خدمات طلابية");
                                      setSProviderId(item.provider_id || "");
                                      setSContactMethod(item.contact_method || "whatsapp");
                                      setSContactInfo(item.contact_info || "");
                                      setSThumbnail(item.thumbnail_url || "");
                                      setSIsActive(item.is_active ?? true);
                                      setSStatus(item.status || "active");
                                      setSubTab('add'); 
                                    }
                                    else if(activeTab === 'features') { setEditingId(item.id); setFeatTitle(item.title); setFeatDesc(item.description); setFeatIcon(item.icon_name || "BookOpen"); setFeatColor(item.color_class || "bg-red-50"); setFeatPath(item.link_path || "/"); setFeatOrder(item.order_index || 0); setSubTab('add'); }
                                    else if(activeTab === 'reviews') { setEditingId(item.id); setRTitle(item.title); setRDesc(item.description); setRAuthor(item.author || "Jo Students"); setRReference(item.reference_name || ""); setRReadTime(item.read_time || "٥ دقائق"); setRDate(item.file_date || ""); setRFileUrl(item.file_url || ""); setRImageUrl(item.image_url || ""); setSubTab('add'); }
                                    else if(activeTab === 'academy_products') { 
                                      setEditingId(item.id); 
                                      setProdTitle(item.title); 
                                      setProdDesc(item.description || ""); 
                                      setProdInstructor(item.instructor_name || ""); 
                                      setProdPrice(item.price?.toString() || ""); 
                                      setProdOldPrice(item.old_price?.toString() || ""); 
                                      setProdCategory(item.category || "دورات تدريبية"); 
                                      setProdType(item.type || "course"); 
                                      setProdThumbnail(item.thumbnail_url || ""); 
                                      setProdStatus(item.status || "active");
                                      setProdContactMethod(item.contact_method || "whatsapp");
                                      setProdContactInfo(item.contact_info || "");
                                      setSubTab('add'); 
                                    }
                                    else if(activeTab === 'announcements') { 
                                      setEditingId(item.id); 
                                      setAnnTitle(item.title); 
                                      setAnnContent(item.content); 
                                      setAnnType(item.type); 
                                      setAnnIsActive(item.is_active); 
                                      setAnnShowCountdown(item.show_countdown); 
                                      setAnnTargetDate(item.target_date || ""); 
                                      setAnnBtnText(item.button_text || ""); 
                                      setAnnBtnUrl(item.button_url || ""); 
                                      setAnnImageUrl(item.image_url || ""); 
                                      setAnnFileUrl(item.file_url || ""); 
                                      setSubTab('add'); 
                                    }
                                  }}
                                  className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl"
                                ><Edit3 className="w-4 h-4" /></button>
                                {(activeTab === 'services' || activeTab === 'academy_products') && item.status !== 'pending' && (
                                  <button 
                                    onClick={async () => {
                                      const table = activeTab === 'services' ? 'services' : 'products';
                                      const newStatus = item.status === 'active' ? 'inactive' : 'active';
                                      const { error } = await supabase!.from(table).update({ status: newStatus }).eq('id', item.id);
                                      if (!error) {
                                        setStatus({ type: 'success', msg: `تم تحديث الحالة بنجاح إلى ${newStatus === 'active' ? 'نشط' : 'معطل'}` });
                                        fetchData();
                                      }
                                    }}
                                    className={`p-2 rounded-xl transition-all ${item.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                                    title={item.status === 'active' ? 'إيقاف النشاط' : 'تفعيل'}
                                  >
                                    {item.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                )}
                                <button onClick={() => deleteItem(activeTab === 'files' ? 'question_files' : activeTab === 'academy_products' ? 'products' : activeTab, item.id)} className="p-2 bg-red-50 text-red-300 hover:text-red-600 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                             </div>
                             <div className="flex items-center gap-2">
                               {activeTab === 'announcements' && (
                                 <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${item.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                   {item.is_active ? 'نشط' : 'متوقف'}
                                 </span>
                               )}
                               {(activeTab === 'services' || activeTab === 'academy_products') && (
                                 <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                   item.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 
                                   item.status === 'pending' ? 'bg-orange-100 text-orange-500' : 
                                   'bg-slate-100 text-slate-500'
                                 }`}>
                                   {item.status === 'active' ? 'نشط' : item.status === 'pending' ? 'بانتظار الموافقة' : 'معطل'}
                                 </span>
                               )}
                               <span className="text-[10px] font-black text-slate-300 uppercase"># {item.id}</span>
                             </div>
                          </div>
                          <div className="flex gap-4">
                             {(item.thumbnail_url || item.image_url) && (
                               <img 
                                 src={item.thumbnail_url || item.image_url} 
                                 alt="" 
                                 className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-100" 
                               />
                             )}
                             <div className="min-w-0 flex-grow">
                                <h4 className="font-black text-slate-900 mb-2 truncate">{item.title || item.major || item.category || 'سجل جديد'}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-6 flex-grow">{item.content || item.text || item.description || item.url}</p>
                             </div>
                          </div>
                          {(activeTab === 'services' || activeTab === 'academy_products') && item.status === 'pending' && (
                            <button 
                              onClick={async () => {
                                const table = activeTab === 'services' ? 'services' : 'products';
                                const { error } = await supabase!.from(table).update({ status: 'active' }).eq('id', item.id);
                                if (!error) {
                                  setStatus({ type: 'success', msg: `تمت الموافقة على ${activeTab === 'services' ? 'الخدمة' : 'المنتج'} ونشره بنجاح` });
                                  fetchData();
                                } else {
                                  setStatus({ type: 'error', msg: error.message });
                                }
                              }}
                              className="w-full mb-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all uppercase tracking-widest"
                            >
                              موافقة ونشر {activeTab === 'services' ? 'الخدمة' : 'المنتج'}
                            </button>
                          )}

                          <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
                             <div className="flex items-center gap-3">
                                {activeTab === 'announcements' ? (
                                  <span className={`flex items-center gap-1 ${item.type === 'popup' ? 'text-red-500' : 'text-blue-500'}`}>
                                     <Bell className="w-3 h-3" /> {item.type === 'popup' ? 'نافذة منبثقة' : 'شريط علوي'}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(item.created_at || Date.now()).toLocaleDateString('ar-JO')}</span>
                                  </div>
                                )}
                                {activeTab === 'files' && (
                                  <>
                                    <div className="flex items-center gap-1 text-emerald-600">
                                      <Download className="w-3.5 h-3.5" />
                                      <span>{item.download_count || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <Share2 className="w-3.5 h-3.5" />
                                      <span>{item.share_count || 0}</span>
                                    </div>
                                  </>
                                )}
                             </div>
                             <ChevronRight className="w-3 h-3" />
                          </div>
                        </motion.div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

               {(subTab === 'list' || subTab === 'approvals') && activeTab === 'instructor_requests' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="text-right">
                            <h3 className="text-lg font-black text-slate-900">طلبات انضمام المدربين</h3>
                            <p className="text-xs text-slate-500 font-bold">مراجعة بيانات وخبرات الأكاديميين الراغبين بالانضمام</p>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center">
                            <span className="block text-[10px] font-black text-slate-400 uppercase">بانتظار المراجعة</span>
                            <span className="text-xl font-black text-red-600">{instructorRequests.filter(r => r.status === 'pending' || !r.status).length}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">الاسم الكامل</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">البريد الإلكتروني</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">التخصص</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">الحالة</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center border-l border-slate-100">الإجراءات</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {instructorRequests
                                  .filter(req => subTab === 'approvals' ? (req.status === 'pending' || !req.status) : true)
                                  .map(req => (
                                    <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all group text-right">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{req.full_name || req.fullName}</td>
                                        <td className="px-6 py-4 text-sm text-red-600 font-bold">{req.email}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-black">{req.metadata?.major || req.major}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {req.status === 'approved' ? 'مقبول' : 'قيد الانتظار'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 border-l border-slate-100">
                                            <div className="flex items-center justify-center gap-2">
                                                {req.status !== 'approved' && (
                                                  <button 
                                                      onClick={() => {
                                                        setViewingRequest(req);
                                                        setIsApproving(true);
                                                        setApprovalRole('instructor');
                                                      }}
                                                      className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                                      title="موافقة وإنشاء حساب"
                                                  >
                                                      <CheckCircle2 className="w-4 h-4" />
                                                  </button>
                                                )}
                                                <button 
                                                    onClick={() => deleteItem('system_submissions', req.id)} 
                                                    className="p-2 bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                                    title="حذف الطلب"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center">
                                                <button 
                                                    onClick={() => setViewingRequest(req)} 
                                                    className="p-2 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-all"
                                                    title="عرض التفاصيل الكاملة"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                  ))}
                            </tbody>
                        </table>
                        {instructorRequests.filter(req => subTab === 'approvals' ? (req.status === 'pending' || !req.status) : true).length === 0 && (
                            <div className="text-center py-20 text-slate-300 font-bold">لا توجد طلبات في هذه الفئة</div>
                        )}
                    </div>
                </div>
              )}

              {(subTab === 'list' || subTab === 'approvals') && activeTab === 'user_bookings' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">اسم العميل</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">البريد الإلكتروني</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">الخدمة / المنتج</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">النوع</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">السعر</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">حالة الدفع</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userBookings
                              .filter(booking => subTab === 'approvals' ? booking.status === 'pending' : true)
                              .map(booking => (
                                <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50 transition-all">
                                    <td className="px-6 py-4 font-bold text-slate-900">{booking.user_name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{booking.user_email}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{booking.item_type === 'product' ? booking.products?.title : booking.item_type === 'service' ? booking.services?.title : '-'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{booking.item_type === 'product' ? 'منتج أكاديمية' : 'خدمة مهنية'}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">{booking.amount} ريال</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${booking.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {booking.status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {booking.status !== 'completed' && (
                                                <button 
                                                    onClick={async () => {
                                                        const { error } = await supabase!.from('user_bookings').update({ status: 'completed' }).eq('id', booking.id);
                                                        if (!error) {
                                                            setStatus({ type: 'success', msg: 'تم تحديث حالة الدفع إلى مكتمل' });
                                                            fetchData();
                                                        } else {
                                                            setStatus({ type: 'error', msg: 'حدث خطأ أثناء التحديث' });
                                                        }
                                                    }}
                                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                                    title="تأكيد الدفع"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {userBookings.length === 0 && (
                        <div className="text-center py-20 text-slate-300 font-bold">لا يوجد مبيعات أو حجوزات حالياً</div>
                    )}
                </div>
              )}

              {(subTab === 'list' || subTab === 'approvals') && activeTab === 'service_providers' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="text-right">
                            <h3 className="text-lg font-black text-slate-900">طلبات مقدمي الخدمات</h3>
                            <p className="text-xs text-slate-500 font-bold">خبراء كتابة السير الذاتية، الاستشارات، والمقابلات</p>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center">
                            <span className="block text-[10px] font-black text-slate-400 uppercase">بانتظار المراجعة</span>
                            <span className="text-xl font-black text-blue-600">{serviceProviders.filter(r => r.status === 'pending' || !r.status).length}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">اسم المقدم</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">البريد الإلكتروني</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">رقم الهاتف</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">الحالة</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceProviders
                                  .filter(reg => subTab === 'approvals' ? (reg.status === 'pending' || !reg.status) : true)
                                  .map(reg => (
                                    <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-all">
                                        <td className="px-6 py-4 font-bold text-slate-900">{reg.full_name || reg.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{reg.email}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{reg.phone}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${reg.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {reg.status === 'approved' ? 'مقبول' : 'جديد'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {reg.status !== 'approved' && (
                                                  <button 
                                                      onClick={() => {
                                                        setViewingRequest(reg);
                                                        setIsApproving(true);
                                                        setApprovalRole('service_provider');
                                                      }}
                                                      className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                                      title="موافقة وإنشاء حساب"
                                                  >
                                                      <CheckCircle2 className="w-4 h-4" />
                                                  </button>
                                                )}
                                                <button 
                                                    onClick={() => setViewingRequest(reg)}
                                                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-lg transition-all"
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteItem('system_submissions', reg.id)} 
                                                    className="p-2 bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all"
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
                        {serviceProviders.filter(reg => subTab === 'approvals' ? (reg.status === 'pending' || !reg.status) : true).length === 0 && (
                            <div className="text-center py-20 text-slate-300 font-bold">لا توجد طلبات في هذه الفئة</div>
                        )}
                    </div>
                </div>
              )}

              {(subTab === 'list' || subTab === 'approvals') && activeTab === 'registrations' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="text-right">
                            <h3 className="text-lg font-black text-slate-900">طلبات تسجيل الشركات</h3>
                            <p className="text-xs text-slate-500 font-bold">مؤسسات تبحث عن استقطاب الكفاءات</p>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center">
                            <span className="block text-[10px] font-black text-slate-400 uppercase">بانتظار المراجعة</span>
                            <span className="text-xl font-black text-emerald-600">{registrations.filter(r => r.status === 'pending' || !r.status).length}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">اسم المنشأة</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">المسؤول</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">الحالة</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">التاريخ</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center border-l border-slate-100">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations
                                  .filter(reg => subTab === 'approvals' ? (reg.status === 'pending' || !reg.status) : true)
                                  .map(reg => (
                                    <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all group text-right">
                                        <td className="px-6 py-4 text-sm font-black text-slate-900">{reg.metadata?.company_name || reg.entity_name}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600">{reg.full_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${reg.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {reg.status === 'approved' ? 'مقبول' : 'قيد الانتظار'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">{new Date(reg.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 border-l border-slate-100">
                                            <div className="flex items-center justify-center gap-2">
                                                {reg.status !== 'approved' && (
                                                  <button 
                                                      onClick={() => {
                                                        setViewingRequest(reg);
                                                        setIsApproving(true);
                                                        setApprovalRole('company');
                                                      }}
                                                      className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                                      title="موافقة وإنشاء حساب"
                                                  >
                                                      <CheckCircle2 className="w-4 h-4" />
                                                  </button>
                                                )}
                                                <button 
                                                    onClick={() => setViewingRequest(reg)} 
                                                    className="p-2 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-all"
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteItem('system_submissions', reg.id)} 
                                                    className="p-2 bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all"
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
                        {registrations.filter(reg => subTab === 'approvals' ? (reg.status === 'pending' || !reg.status) : true).length === 0 && (
                            <div className="text-center py-20 text-slate-300 font-bold">لا توجد طلبات في هذه الفئة</div>
                        )}
                    </div>
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
                                onClick={() => setViewingMessage(msg)}
                                className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl"
                                title="تكبير الرسالة"
                              >
                                 <Eye className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={async () => {
                                   const newStatus = msg.status === 'read' ? 'pending' : 'read';
                                   const { error } = await supabase!.from('system_submissions').update({ status: newStatus }).eq('id', msg.id);
                                   if(!error) fetchData();
                                }}
                                className={`p-2 rounded-xl transition-all ${msg.status === 'read' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}
                                title={msg.status === 'read' ? "تحديد كغير مقروء" : "تحديد كمقروء"}
                              >
                                 <CheckCircle2 className="w-5 h-5" />
                              </button>
                              <button onClick={() => deleteItem('system_submissions', msg.id)} className="p-2 bg-red-50 text-red-300 hover:text-red-600 rounded-xl">
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                           <div className="text-right">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                 {msg.status !== 'read' && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                                 <h3 className="font-black text-slate-900 text-lg">{msg.full_name || msg.name}</h3>
                              </div>
                              <span className="text-sm text-red-600 font-bold">{msg.email}</span>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div className="bg-white p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-300 uppercase mb-1">الموضوع</p><p className="text-sm font-bold text-slate-900">{msg.subject}</p></div>
                           <div className="bg-white p-4 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-300 uppercase mb-1">الرسالة</p><p className="text-sm text-slate-600 leading-relaxed">{msg.content || msg.message}</p></div>
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

              {activeTab === 'instructors_db' && (
                <div className="space-y-8 max-w-6xl mx-auto py-6">
                   <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <button onClick={() => setSubTab(subTab === 'list' ? 'add' : 'list')} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all flex items-center gap-2">
                        {subTab === 'list' ? 'تعديل بيانات الكوادر' : 'العودة للقائمة'}
                      </button>
                      <div className="text-right">
                         <h2 className="text-xl font-black text-slate-900">إدارة الكوادر والمدربين والخبراء</h2>
                         <p className="text-slate-500 text-sm font-bold mt-1">تعديل معلومات وتصنيفات المدربين، مقدمي الخدمات، ومدراء المحتوى</p>
                      </div>
                   </div>

                   {subTab === 'list' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {instructors.map(inst => (
                         <div key={inst.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right flex flex-col items-end">
                           <div className="w-16 h-16 rounded-full bg-slate-100 mb-4 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                             {inst.metadata?.photoUrl ? (
                               <img src={inst.metadata.photoUrl} alt={inst.full_name} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xl">
                                 {inst.full_name?.charAt(0) || 'M'}
                               </div>
                             )}
                           </div>
                           <h3 className="text-lg font-black text-slate-900">{inst.full_name || 'بدون اسم'}</h3>
                           <p className="text-sm font-bold text-slate-500 mb-1">{inst.metadata?.specialty || 'لا يوجد تخصص'}</p>
                           
                           {/* Role Badge */}
                           <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg mb-2 ${
                             inst.role === 'instructor' ? 'bg-red-50 text-red-600 border border-red-100' :
                             inst.role === 'service_provider' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                             'bg-purple-50 text-purple-600 border border-purple-100'
                           }`}>
                             {inst.role === 'instructor' ? 'مدرب (Instructor)' :
                              inst.role === 'service_provider' ? 'مقدم خدمات (Service Provider)' :
                              'مدير محتوى (Manager)'}
                           </span>

                           <div className="flex items-center gap-2 mb-4">
                             <span className={`px-3 py-1 text-[10px] font-black rounded-lg ${inst.metadata?.is_published ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                               {inst.metadata?.is_published ? 'منشور (يبث للمستخدمين)' : 'مسودة (مخفي)'}
                             </span>
                           </div>
                           
                           <button onClick={() => {
                             setEditingId(inst.id);
                             setInstName(inst.full_name || "");
                             setInstPhone(inst.phone || "");
                             setInstBio(inst.metadata?.bio || "");
                             setInstSpecialty(inst.metadata?.specialty || "");
                             setInstIsPublished(inst.metadata?.is_published || false);
                             setInstPhotoUrl(inst.metadata?.photoUrl || "");
                             setInstRole(inst.role || "instructor");
                             setInstPhoto(null);
                             setSubTab('add');
                           }} className="w-full h-10 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs transition-all">تعديل البيانات</button>
                         </div>
                       ))}
                       {instructors.length === 0 && (
                         <div className="col-span-full text-center py-12 text-slate-500 font-bold bg-slate-50 rounded-3xl">لا يوجد كوادر حالياً</div>
                       )}
                     </div>
                   ) : (
                     <form onSubmit={handleUpdateInstructor} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-400 uppercase">الاسم الكامل</label>
                              <input type="text" required value={instName} onChange={e => setInstName(e.target.value)} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" />
                           </div>
                           <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-400 uppercase">رقم الهاتف</label>
                              <input type="text" value={instPhone} onChange={e => setInstPhone(e.target.value)} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-mono" />
                           </div>
                           <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-400 uppercase">الدور / الصلاحية</label>
                              <select value={instRole} onChange={e => setInstRole(e.target.value)} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold">
                                 <option value="instructor">مدرب (Instructor)</option>
                                 <option value="service_provider">مقدم خدمات (Service Provider)</option>
                                 <option value="manager">مدير محتوى (Manager)</option>
                              </select>
                           </div>
                           <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-400 uppercase">التخصص / اللقب</label>
                              <input type="text" value={instSpecialty} onChange={e => setInstSpecialty(e.target.value)} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" />
                           </div>
                           <div className="space-y-2 text-right col-span-2">
                              <label className="text-xs font-black text-slate-400 uppercase">الصورة الشخصية (اختياري)</label>
                              <input type="file" accept="image/*" onChange={e => setInstPhoto(e.target.files?.[0] || null)} className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100" />
                           </div>
                           <div className="space-y-2 text-right col-span-2">
                              <label className="text-xs font-black text-slate-400 uppercase">نبذة تعريفية (Bio)</label>
                              <textarea rows={4} value={instBio} onChange={e => setInstBio(e.target.value)} className="w-full p-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-medium" />
                           </div>
                           <div className="space-y-2 text-right col-span-2 flex items-center justify-end gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                              <div className="text-right">
                                <h4 className="font-black text-slate-900">بث في صفحة الأكاديمية والخدمات</h4>
                                <p className="text-xs font-bold text-slate-500">تفعيل هذا الخيار سيجعل بيانات العضو متاحة ومرئية للطلاب في الموقع.</p>
                              </div>
                              <input type="checkbox" checked={instIsPublished} onChange={e => setInstIsPublished(e.target.checked)} className="w-6 h-6 accent-red-600" />
                           </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50">
                           {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                           حفظ بيانات العضو
                        </button>
                     </form>
                   )}
                </div>
              )}

              {/* USERS & ROLE MANAGEMENT VIEW */}
              {activeTab === 'users' && (
                <div className="space-y-10 max-w-6xl mx-auto py-6">
                  <div className="bg-white border border-slate-100 p-8 rounded-3xl text-right shadow-sm flex flex-col md:flex-row-reverse md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                      <h3 className="text-slate-900 font-black text-xl flex items-center justify-end gap-2">
                        إدارة الصلاحيات والمدراء والمشرفين
                        <Shield className="w-6 h-6 text-red-600" />
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed font-bold">
                        من هذه الشاشة يمكنك البحث عن أي مستخدم مسجل في المنصة وترقيته إلى رتبة <span className="text-red-600">مدير محتوى (Manager)</span> ليتمكن من إدارة بنك الأسئلة وبنك الملفات والمراجعات فقط، دون صلاحية تعديل الهوية أو الإعلانات أو الوظائف والخدمات والماليات.
                      </p>
                    </div>
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black max-w-xs self-start md:self-auto text-center border border-red-100">
                      إضافة مدراء محتوى تضمن تنظيم العمل وتوزيع المهام بأمان ودون القلق من العبث بقاعدة البيانات أو الإعدادات الحساسة للموقع.
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="flex gap-3 justify-end items-center max-w-md mr-auto bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <button
                      onClick={fetchProfiles}
                      disabled={searchLoading}
                      className="h-12 px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-red-600 transition-all flex items-center gap-2 text-sm shrink-0"
                    >
                      {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      بحث
                    </button>
                    <input
                      type="text"
                      className="w-full h-12 px-4 bg-transparent outline-none text-right text-sm font-bold"
                      placeholder="ابحث بالبريد، الاسم أو الهاتف..."
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') fetchProfiles(); }}
                    />
                  </div>

                  {/* User List */}
                  <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto" dir="rtl">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="p-5 text-xs font-black text-slate-400 uppercase">المستخدم</th>
                            <th className="p-5 text-xs font-black text-slate-400 uppercase">البريد الإلكتروني / الهاتف</th>
                            <th className="p-5 text-xs font-black text-slate-400 uppercase">تاريخ الانضمام</th>
                            <th className="p-5 text-xs font-black text-slate-400 uppercase text-center">الدور الحالي</th>
                            <th className="p-5 text-xs font-black text-slate-400 uppercase text-center">تعديل الصلاحية</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchLoading ? (
                            <tr>
                              <td colSpan={5} className="p-10 text-center text-slate-400 font-bold">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-red-600" />
                                جاري تحميل حسابات المستخدمين...
                              </td>
                            </tr>
                          ) : profilesList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-10 text-center text-slate-400 font-bold">
                                {userSearchQuery ? "لم يتم العثور على أي مستخدم يطابق البحث" : "اكتب في مربع البحث أعلاه لعرض حسابات المستخدمين وإدارتها"}
                              </td>
                            </tr>
                          ) : (
                            profilesList.map((userProfile) => (
                              <tr key={userProfile.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                <td className="p-5">
                                  <div className="flex items-center gap-3 justify-start">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                                      {userProfile.avatar_url ? (
                                        <img src={userProfile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                      ) : (
                                        <User className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-black text-slate-900">{userProfile.full_name || 'بدون اسم'}</div>
                                      <div className="text-[10px] text-slate-400 font-bold">المعرف: {userProfile.id.substring(0, 8)}...</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-5 text-sm font-bold text-slate-600">
                                  <div>{userProfile.email || 'لا يوجد بريد'}</div>
                                  <div className="text-xs text-slate-400 font-medium">{userProfile.phone || 'لا يوجد هاتف'}</div>
                                </td>
                                <td className="p-5 text-xs text-slate-400 font-bold">
                                  {new Date(userProfile.created_at).toLocaleDateString('ar-JO')}
                                </td>
                                <td className="p-5 text-center">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                                    userProfile.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' :
                                    userProfile.role === 'manager' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                    userProfile.role === 'instructor' ? 'bg-green-50 text-green-600 border border-green-100' :
                                    'bg-slate-50 text-slate-600 border border-slate-100'
                                  }`}>
                                    {userProfile.role === 'admin' ? 'مدير نظام (Admin)' :
                                     userProfile.role === 'manager' ? 'مدير محتوى (Manager)' :
                                     userProfile.role === 'instructor' ? 'مدرب (Instructor)' : 'مستخدم عادي (User)'}
                                  </span>
                                </td>
                                <td className="p-5">
                                  <div className="flex items-center justify-center gap-2">
                                    <select
                                      value={userProfile.role || 'user'}
                                      onChange={(e) => updateUserRole(userProfile.id, e.target.value)}
                                      className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-right outline-none focus:border-red-600 transition-all"
                                    >
                                      <option value="user">مستخدم عادي (User)</option>
                                      <option value="manager">مدير محتوى (Manager)</option>
                                      <option value="instructor">مدرب (Instructor)</option>
                                      <option value="admin">مدير نظام (Admin)</option>
                                    </select>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* INSTRUCTOR & PROVIDER PORTAL VIEW */}
              {activeTab === 'instructor_portal' && (
                <div className="space-y-10 max-w-6xl mx-auto py-6">
                  {/* Portal Header Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-3xl text-right shadow-xl flex flex-col md:flex-row-reverse md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                      <h3 className="text-white font-black text-xl flex items-center justify-end gap-2">
                        بوابة التحكم بالدورات والخدمات
                        <Sparkles className="w-6 h-6 text-yellow-400" />
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed font-bold">
                        بصفتك مديراً للمحتوى، يمكنك من خلال هذه المنصة الموحدة التحكم بمنتجات الأكاديمية (الدورات والملفات واللقاءات) بالإضافة إلى الخدمات المهنية والاستشارات المتاحة على المنصة.
                      </p>
                    </div>
                    <div className="bg-slate-800 text-slate-200 p-4 rounded-2xl text-xs font-black max-w-xs self-start md:self-auto text-center border border-slate-700">
                      تسمح لك هذه البوابة الموحدة بإدارة العرض المباشر، وتعديل الأسعار والمعلومات الخاصة بالدورات والخدمات بشكل فوري وسهل دون المساس بقاعدة البيانات.
                    </div>
                  </div>

                  {/* Portal Sub-tab Switch */}
                  {portalSubTab === 'list' && (
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                      {/* Section Tabs */}
                      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm max-w-md w-full">
                        <button
                          type="button"
                          onClick={() => { setPortalTab('products'); setSearchTerm(''); }}
                          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                            portalTab === 'products' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          الدورات والمنتجات ({academyProducts.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPortalTab('services'); setSearchTerm(''); }}
                          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                            portalTab === 'services' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                          الخدمات المهنية ({services.length})
                        </button>
                      </div>

                      {/* Controls and Search */}
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="بحث..."
                            className="w-full h-11 pr-10 pl-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 text-sm font-medium"
                          />
                        </div>

                        {/* Add Button */}
                        <button
                          type="button"
                          onClick={() => {
                            resetForms();
                            setEditingId(null);
                            setPortalSubTab('add');
                          }}
                          className="h-11 px-6 bg-red-600 text-white rounded-xl font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-2 text-xs whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4" />
                          {portalTab === 'products' ? 'إضافة دورة/منتج' : 'إضافة خدمة جديدة'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List View Container */}
                  {portalSubTab === 'list' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {(portalTab === 'products' ? academyProducts : services)
                        .filter(item => {
                          const matchesSearch = (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                               (item.description || item.content || "").toLowerCase().includes(searchTerm.toLowerCase());
                          return matchesSearch;
                        })
                        .map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-6 bg-white border rounded-3xl transition-all group flex flex-col h-full border-slate-100 hover:border-red-100 hover:shadow-xl hover:shadow-red-500/5 text-right`}
                          >
                            {/* Card Image Thumbnail */}
                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 mb-4 shrink-0">
                              {item.thumbnail_url ? (
                                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                  {portalTab === 'products' ? <BookOpen className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                                </div>
                              )}
                              <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black ${
                                item.status === 'active' || item.is_active || item.is_active_status ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                              }`}>
                                {item.status === 'active' || item.is_active || item.is_active_status ? 'نشط' : 'معطل'}
                              </span>
                            </div>

                            {/* Card Details */}
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-black text-red-600 mb-1 block">{item.category}</span>
                                <h4 className="font-black text-slate-900 text-base leading-snug mb-2 line-clamp-1">{item.title}</h4>
                                <p className="text-slate-400 text-xs font-medium leading-relaxed line-clamp-2 mb-4">{item.description}</p>
                              </div>
                              
                              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="text-right">
                                  <div className="text-[9px] text-slate-400 font-bold">السعر</div>
                                  <div className="text-sm font-black text-slate-900">{item.price} {portalTab === 'products' ? 'دولار' : 'JOD'}</div>
                                </div>
                                <div className="text-left">
                                  <div className="text-[9px] text-slate-400 font-bold">
                                    {portalTab === 'products' ? 'المدرب' : 'وسيلة التواصل'}
                                  </div>
                                  <div className="text-xs font-bold text-slate-600">
                                    {portalTab === 'products' ? item.instructor_name || 'غير محدد' : item.contact_method === 'whatsapp' ? 'واتساب' : 'اتصال هاتف'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (portalTab === 'products') {
                                    setEditingId(item.id);
                                    setProdTitle(item.title);
                                    setProdDesc(item.description || "");
                                    setProdInstructor(item.instructor_name || "");
                                    setProdPrice(item.price?.toString() || "");
                                    setProdOldPrice(item.old_price?.toString() || "");
                                    setProdCategory(item.category || "دورات تدريبية");
                                    setProdType(item.type || 'course');
                                    setProdThumbnail(item.thumbnail_url || "");
                                    setProdStatus(item.status || "active");
                                    setProdContactMethod(item.contact_method || "whatsapp");
                                    setProdContactInfo(item.contact_info || "");
                                    setPortalSubTab('add');
                                  } else {
                                    setEditingId(item.id);
                                    setSTitle(item.title);
                                    setSDesc(item.description);
                                    setSIcon(item.icon_name || "Settings");
                                    setSColor(item.bg_color || "bg-slate-50");
                                    setSPrice(item.price?.toString() || "");
                                    setSPriceJod(item.price_jod?.toString() || "");
                                    setSCategory(item.category || "خدمات طلابية");
                                    setSProviderId(item.provider_id || "");
                                    setSContactMethod(item.contact_method || "whatsapp");
                                    setSContactInfo(item.contact_info || "");
                                    setSThumbnail(item.thumbnail_url || "");
                                    setSIsActive(item.is_active ?? true);
                                    setSStatus(item.status || "active");
                                    setPortalSubTab('add');
                                  }
                                }}
                                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                تعديل
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteItem(portalTab === 'products' ? 'products' : 'services', item.id)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      }
                    </div>
                  ) : (
                    /* Embedded Form Block inside Portal */
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                        <button
                          type="button"
                          onClick={() => { setPortalSubTab('list'); resetForms(); }}
                          className="px-4 py-2 text-slate-500 hover:text-slate-900 font-bold text-xs flex items-center gap-1"
                        >
                          <ChevronRight className="w-4 h-4" />
                          إلغاء والعودة للقائمة
                        </button>
                        <h4 className="font-black text-slate-900 text-lg">
                          {editingId ? 'تعديل البيانات' : portalTab === 'products' ? 'إضافة منتج/دورة جديدة' : 'إضافة خدمة جديدة'}
                        </h4>
                      </div>

                      {/* We dynamically render either the products form or the services form */}
                      {portalTab === 'products' ? (
                        <form onSubmit={addProduct} className="space-y-8 max-w-4xl mx-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
                            <div className="space-y-2 col-span-2 text-right">
                              <label className="text-xs font-black text-slate-500">اسم المنتج / الدورة</label>
                              <input type="text" required className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={prodTitle} onChange={e => setProdTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-2 text-right">
                              <label className="text-xs font-black text-slate-500">الوصف التفصيلي</label>
                              <textarea rows={4} required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-medium" value={prodDesc} onChange={e => setProdDesc(e.target.value)} />
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">المدرب / المقدم</label>
                              <input type="text" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={prodInstructor} onChange={e => setProdInstructor(e.target.value)} />
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">التصنيف</label>
                              <input type="text" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={prodCategory} onChange={e => setProdCategory(e.target.value)} placeholder="دورات تدريبية, الخ..." />
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">السعر بالدولار ($)</label>
                              <input type="number" required step="0.01" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">السعر القديم (قبل الخصم - اختياري)</label>
                              <input type="number" step="0.01" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={prodOldPrice} onChange={e => setProdOldPrice(e.target.value)} />
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">النوع</label>
                              <select className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={prodType} onChange={e => setProdType(e.target.value as any)}>
                                <option value="course">دورة مسجلة</option>
                                <option value="session">جلسة مباشرة</option>
                                <option value="file">ملف / ملزمة</option>
                              </select>
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">حالة العرض</label>
                              <select className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={prodStatus} onChange={e => setProdStatus(e.target.value)}>
                                <option value="active">نشط (متاح للشراء والمشاهدة)</option>
                                <option value="inactive">معطل (مخفي)</option>
                              </select>
                            </div>
                            <div className="space-y-2 text-right col-span-2">
                              <label className="text-xs font-black text-slate-500">صورة المنتج / الغلاف</label>
                              <div className="flex gap-4 items-center">
                                <input type="text" placeholder="رابط الصورة أو ارفع واحدة..." className="flex-1 h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-mono text-sm" value={prodThumbnail} onChange={e => setProdThumbnail(e.target.value)} />
                                <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-6 h-12 rounded-xl flex items-center gap-2 transition-all font-bold text-xs whitespace-nowrap">
                                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                  رفع صورة
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setProdImageFile(file);
                                      setProdThumbnail(URL.createObjectURL(file));
                                    }
                                  }} />
                                </label>
                              </div>
                              {prodThumbnail && <img src={prodThumbnail} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200 mt-2" />}
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">وسيلة التواصل لشراء المنتج</label>
                              <select className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={prodContactMethod} onChange={e => setProdContactMethod(e.target.value)}>
                                <option value="whatsapp">واتساب</option>
                                <option value="phone">اتصال هاتف</option>
                                <option value="email">بريد إلكتروني</option>
                                <option value="link">رابط خارجي</option>
                              </select>
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">رابط / رقم وسيلة التواصل</label>
                              <input type="text" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={prodContactInfo} onChange={e => setProdContactInfo(e.target.value)} placeholder="00962xxxxxxx" />
                            </div>
                          </div>
                          <button type="submit" disabled={loading} className="w-full h-14 bg-red-600 text-white rounded-2xl font-black hover:bg-slate-900 transition-all shadow-lg flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            {editingId ? 'حفظ التعديلات' : 'إضافة المنتج الجديد للأكاديمية'}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={addService} className="space-y-8 max-w-4xl mx-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
                            <div className="space-y-2 col-span-2 text-right">
                              <label className="text-xs font-black text-slate-500">اسم الخدمة</label>
                              <input type="text" required className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={sTitle} onChange={e => setSTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-2 text-right">
                              <label className="text-xs font-black text-slate-500">وصف الخدمة ومميزاتها</label>
                              <textarea rows={4} required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-medium" value={sDesc} onChange={e => setSDesc(e.target.value)} />
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">التصنيف</label>
                              <input type="text" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={sCategory} onChange={e => setSCategory(e.target.value)} />
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">السعر بالدينار الأردني (JOD - اختياري)</label>
                              <input type="number" step="0.01" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={sPriceJod} onChange={e => setSPriceJod(e.target.value)} />
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">السعر بالدولار ($ - اختياري)</label>
                              <input type="number" step="0.01" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={sPrice} onChange={e => setSPrice(e.target.value)} />
                            </div>
                            <div className="space-y-2 text-right col-span-2">
                              <label className="text-xs font-black text-slate-500">صورة الغلاف / الأيقونة التوضيحية</label>
                              <div className="flex gap-4 items-center">
                                <input type="text" placeholder="رابط الصورة أو ارفع صورة..." className="flex-1 h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-mono text-sm" value={sThumbnail} onChange={e => setSThumbnail(e.target.value)} />
                                <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-6 h-12 rounded-xl flex items-center gap-2 transition-all font-bold text-xs whitespace-nowrap">
                                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                  رفع صورة
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setSImageFile(file);
                                      setSThumbnail(URL.createObjectURL(file));
                                    }
                                  }} />
                                </label>
                              </div>
                              {sThumbnail && <img src={sThumbnail} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200 mt-2" />}
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">وسيلة التواصل</label>
                              <select className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-bold" value={sContactMethod} onChange={e => setSContactMethod(e.target.value)}>
                                <option value="whatsapp">واتساب</option>
                                <option value="phone">اتصال هاتف</option>
                                <option value="email">بريد إلكتروني</option>
                                <option value="link">رابط خارجي</option>
                              </select>
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">رابط / رقم وسيلة التواصل</label>
                              <input type="text" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600 font-mono" placeholder="رقم الهاتف أو الرابط" value={sContactInfo} onChange={e => setSContactInfo(e.target.value)} />
                            </div>
                            <div className="space-y-2 text-right">
                              <label className="text-xs font-black text-slate-500">الحالة</label>
                              <select className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-red-600" value={sStatus} onChange={e => setSStatus(e.target.value)}>
                                <option value="active">نشط (متاح على المنصة)</option>
                                <option value="inactive">معطل (مخفي)</option>
                              </select>
                            </div>
                          </div>
                          <button type="submit" disabled={loading} className="w-full h-14 bg-red-600 text-white rounded-2xl font-black hover:bg-slate-900 transition-all shadow-lg flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            {editingId ? 'حفظ التعديلات' : 'إضافة الخدمة المهنية الجديدة'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
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
                        
                        <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-slate-400 uppercase">تفسير الإجابة (اختياري - يظهر للطالب بعد الانتهاء)</label>
                          <textarea 
                            rows={4} 
                            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:bg-white focus:border-red-600 text-sm font-medium" 
                            value={qExplanation} 
                            onChange={e => setQExplanation(e.target.value)} 
                            placeholder="اكتب تفسيراً أو شرحاً لهذا السؤال..."
                          />
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
                      {fUrl && (
                        <div className="col-span-2 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-4 text-emerald-900 text-xs font-mono dir-ltr text-left">
                          <span className="truncate flex-1 font-semibold">{fUrl}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              type="button" 
                              onClick={() => { 
                                navigator.clipboard.writeText(fUrl); 
                                setStatus({ type: 'success', msg: 'تم نسخ الرابط المولّد بنجاح!' }); 
                              }}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-sans font-bold text-xs hover:bg-emerald-700 transition-all"
                            >
                              نسخ الرابط
                            </button>
                            <a 
                              href={fUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-700 rounded-lg font-sans font-bold text-xs hover:bg-emerald-100 transition-all"
                            >
                              فتح الملف
                            </a>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2 col-span-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">رابط التحميل (يتولد تلقائياً أو أدخله يدوياً)</label>
                        <input 
                          type="text" 
                          required={!fUploadFile && !fUrl} 
                          placeholder="https://... أو يتولد تلقائياً عند الرفع"
                          className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none font-mono text-sm" 
                          value={fUrl} 
                          onChange={e => setFUrl(e.target.value)} 
                        />
                      </div>
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
                <form onSubmit={addService} className="space-y-8 max-w-3xl mx-auto py-6">
                   <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">عنوان الخدمة</label>
                        <input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" value={sTitle} onChange={e => setSTitle(e.target.value)} />
                      </div>
                      
                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">الوصف التفصيلي</label>
                        <textarea rows={6} required className="w-full p-6 bg-white border border-slate-200 rounded-3xl outline-none focus:border-red-600" value={sDesc} onChange={e => setSDesc(e.target.value)} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">التصنيف</label>
                            <input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={sCategory} onChange={e => setSCategory(e.target.value)} />
                         </div>
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">معرف المزود (Provider UUID)</label>
                            <input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none font-mono text-[10px]" placeholder="اتركه فارغاً للنظام" value={sProviderId} onChange={e => setSProviderId(e.target.value)} />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">السعر بالدينار (JOD)</label>
                            <input type="number" step="0.01" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={sPriceJod} onChange={e => setSPriceJod(e.target.value)} />
                         </div>
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">السعر الافتراضي</label>
                            <input type="number" step="0.01" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={sPrice} onChange={e => setSPrice(e.target.value)} />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">وسيلة التواصل</label>
                            <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={sContactMethod} onChange={e => setSContactMethod(e.target.value)}>
                               <option value="whatsapp">واتساب</option>
                               <option value="phone">هاتف</option>
                               <option value="email">ايميل</option>
                               <option value="link">رابط خارجي</option>
                            </select>
                         </div>
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">معلومات التواصل</label>
                            <input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none font-mono" placeholder="رقم الهاتف أو الرابط" value={sContactInfo} onChange={e => setSContactInfo(e.target.value)} />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">الأيقونة</label>
                            <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={sIcon} onChange={e => setSIcon(e.target.value)}>
                               <option value="Settings">إعدادات</option>
                               <option value="Sparkles">بريق</option>
                               <option value="Star">نجمة</option>
                               <option value="Award">جائزة</option>
                               <option value="Tool">أداة</option>
                               <option value="Zap">صاعقة</option>
                               <option value="Activity">نشاط</option>
                               <option value="Shield">درع</option>
                            </select>
                         </div>
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">لون الخلفية</label>
                            <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={sColor} onChange={e => setSColor(e.target.value)}>
                               <option value="bg-slate-50">رمادي فاتح</option>
                               <option value="bg-red-50">أحمر فاتح</option>
                               <option value="bg-blue-50">أزرق فاتح</option>
                               <option value="bg-emerald-50">أخضر فاتح</option>
                               <option value="bg-amber-50">عنبري فاتح</option>
                               <option value="bg-purple-50">بنفسجي فاتح</option>
                            </select>
                         </div>
                      </div>

                      <div className="space-y-2 text-right">
                         <label className="text-xs font-black text-slate-400 uppercase">صورة الخدمة / الغلاف</label>
                         <div className="flex gap-4 items-center">
                            <input type="text" placeholder="رابط الصورة المباشر أو ارفع صورة..." className="flex-1 h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-mono text-sm" value={sThumbnail} onChange={e => setSThumbnail(e.target.value)} />
                            <label className="cursor-pointer bg-slate-900 text-white px-6 h-14 rounded-2xl flex items-center gap-2 hover:bg-emerald-600 transition-all font-bold text-sm whitespace-nowrap">
                              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                              رفع صورة
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSImageFile(file);
                                  setSThumbnail(URL.createObjectURL(file));
                                }
                              }} />
                            </label>
                         </div>
                         {sThumbnail && <img src={sThumbnail} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200 mt-2" />}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2 text-right">
                            <label className="text-xs font-black text-slate-400 uppercase">الحالة</label>
                            <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={sStatus} onChange={e => setSStatus(e.target.value)}>
                               <option value="active">نشط (منشور)</option>
                               <option value="pending">قيد الانتظار</option>
                               <option value="rejected">مرفوض</option>
                            </select>
                         </div>
                         <div className="space-y-2 text-right flex items-center justify-end gap-4 pt-8">
                            <label className="text-xs font-black text-slate-400 uppercase">تفعيل الخدمة</label>
                            <button 
                              type="button"
                              onClick={() => setSIsActive(!sIsActive)}
                              className={`w-14 h-7 rounded-full transition-all relative ${sIsActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${sIsActive ? 'left-1' : 'left-8'}`} />
                            </button>
                         </div>
                      </div>
                   </div>
                   <button type="submit" disabled={isUploading} className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-emerald-600 transition-all shadow-2xl disabled:opacity-50">
                     {isUploading ? 'جاري الرفع...' : (editingId ? 'تحديث الخدمة' : 'إضافة خدمة جديدة')}
                   </button>
                </form>
              )}

               {/* ADD/EDIT FORM FOR REVIEWS */}
               {subTab === 'add' && activeTab === 'reviews' && (
                <form onSubmit={addReview} className="space-y-8 max-w-2xl mx-auto py-6">
                   <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 bg-white p-6 rounded-3xl border-2 border-dashed border-slate-200 text-right">
                           <label className="text-xs font-black text-slate-400 uppercase block mb-2">إرفاق ملف المراجعة</label>
                           <input 
                             type="file" 
                             onChange={(e) => handleReviewFileUpload(e, 'file')} 
                             disabled={loading}
                             className="block w-full text-sm text-slate-500 file:ml-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                           />
                        </div>
                        <div className="space-y-4 bg-white p-6 rounded-3xl border-2 border-dashed border-slate-200 text-right">
                           <label className="text-xs font-black text-slate-400 uppercase block mb-2">صورة المعاينة</label>
                           <input 
                             type="file" 
                             accept="image/*"
                             onChange={(e) => handleReviewFileUpload(e, 'image')} 
                             disabled={loading}
                             className="block w-full text-sm text-slate-500 file:ml-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                           />
                        </div>
                      </div>

                      {(rFileUrl || rImageUrl) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rFileUrl && (
                            <div className="space-y-2 text-right">
                              <label className="text-[10px] font-black text-slate-400 uppercase">رابط الملف المرفوع</label>
                              <input type="text" readOnly className="w-full h-10 px-4 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500 text-[10px] font-mono" value={rFileUrl} />
                            </div>
                          )}
                          {rImageUrl && (
                            <div className="space-y-2 text-right">
                              <label className="text-[10px] font-black text-slate-400 uppercase">رابط صورة المعاينة</label>
                              <div className="flex gap-2">
                                <input type="text" readOnly className="flex-1 h-10 px-4 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500 text-[10px] font-mono" value={rImageUrl} />
                                <img 
                                  src={rImageUrl} 
                                  alt="Preview" 
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm" 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">عنوان المراجعة</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={rTitle} onChange={e => setRTitle(e.target.value)} /></div>
                        <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">اسم المرجع (مثلاً: الدكتور فلان)</label><input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={rReference} onChange={e => setRReference(e.target.value)} /></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">الكاتب الرسمي</label><input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={rAuthor} onChange={e => setRAuthor(e.target.value)} /></div>
                        <div className="space-y-2 text-right">
                          <label className="text-xs font-black text-slate-400 uppercase">وقت القراءة/الدراسة التقريبي</label>
                          <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={rReadTime} onChange={e => setRReadTime(e.target.value)}>
                            <option value="٥ دقائق">٥ دقائق</option>
                            <option value="١٠ دقائق">١٠ دقائق</option>
                            <option value="١٥ دقيقة">١٥ دقيقة</option>
                            <option value="٣٠ دقيقة">٣٠ دقيقة</option>
                            <option value="ساعة">ساعة</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-right"><label className="text-xs font-black text-slate-400 uppercase">نص المراجعة أو الوصف</label><textarea rows={4} required className="w-full p-6 bg-white border border-slate-200 rounded-3xl outline-none focus:border-red-600" value={rDesc} onChange={e => setRDesc(e.target.value)} /></div>
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

              {/* ADD/EDIT FORM FOR ANNOUNCEMENTS */}
              {subTab === 'add' && activeTab === 'announcements' && (
                <form onSubmit={addAnnouncement} className="space-y-8 max-w-3xl mx-auto py-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                      <div className="space-y-2 col-span-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">عنوان الإعلان</label>
                        <input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" value={annTitle} onChange={e => setAnnTitle(e.target.value)} />
                      </div>
                      
                      <div className="space-y-2 col-span-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">المحتوى</label>
                        <textarea rows={4} required className="w-full p-6 bg-white border border-slate-200 rounded-3xl outline-none focus:border-red-600" value={annContent} onChange={e => setAnnContent(e.target.value)} />
                      </div>

                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">نوع الإعلان</label>
                        <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={annType} onChange={e => setAnnType(e.target.value as any)}>
                          <option value="banner">شريط علوي (Banner)</option>
                          <option value="popup">نافذة منبثقة (Popup)</option>
                        </select>
                      </div>

                      <div className="space-y-2 text-right flex items-center justify-end gap-4 pt-8">
                        <label className="text-xs font-black text-slate-400 uppercase">تفعيل الإعلان</label>
                        <button 
                          type="button"
                          onClick={() => setAnnIsActive(!annIsActive)}
                          className={`w-14 h-7 rounded-full transition-all relative ${annIsActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${annIsActive ? 'left-1' : 'left-8'}`} />
                        </button>
                      </div>

                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">تفعيل العداد التنازلي</label>
                        <div className="flex items-center justify-end gap-4 h-14">
                           <button 
                            type="button"
                            onClick={() => setAnnShowCountdown(!annShowCountdown)}
                            className={`w-14 h-7 rounded-full transition-all relative ${annShowCountdown ? 'bg-blue-500' : 'bg-slate-300'}`}
                           >
                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${annShowCountdown ? 'left-1' : 'left-8'}`} />
                           </button>
                        </div>
                      </div>

                      {annShowCountdown && (
                        <div className="space-y-2 text-right border-r-4 border-blue-500 pr-4">
                          <label className="text-xs font-black text-slate-400 uppercase">تاريخ انتهاء العد (Target Date)</label>
                          <input type="datetime-local" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none" value={annTargetDate} onChange={e => setAnnTargetDate(e.target.value)} />
                        </div>
                      )}

                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">نص الزر (اختياري)</label>
                        <input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none font-bold" value={annBtnText} onChange={e => setAnnBtnText(e.target.value)} placeholder="مثلاً: اضغط هنا" />
                      </div>

                      <div className="space-y-2 text-right">
                        <label className="text-xs font-black text-slate-400 uppercase">رابط الزر (اختياري)</label>
                        <input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none font-mono text-sm" value={annBtnUrl} onChange={e => setAnnBtnUrl(e.target.value)} placeholder="https://..." />
                      </div>

                      <div className="space-y-2 text-right col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase">صورة الإعلان (Popups Only)</label>
                        <div className="flex flex-col gap-4">
                          <div className="relative">
                            <input 
                              type="text" 
                              className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none font-mono text-sm" 
                              value={annImageUrl} 
                              onChange={e => setAnnImageUrl(e.target.value)} 
                              placeholder="رابط الصورة المباشر..." 
                            />
                            <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                          </div>
                          <div className="relative group">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={e => setAnnImageFile(e.target.files?.[0] || null)}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className={`w-full h-14 px-6 border-2 border-dashed rounded-2xl flex items-center justify-between transition-all ${annImageFile ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200 group-hover:border-red-300'}`}>
                               <span className="text-xs font-bold text-slate-500 overflow-hidden truncate max-w-[200px]">
                                 {annImageFile ? annImageFile.name : 'أو قم برفع صورة مباشرة من جهازك'}
                               </span>
                               <UploadCloud className={`w-5 h-5 ${annImageFile ? 'text-red-500' : 'text-slate-400'}`} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-right col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase">رابط الملف المرفق (يدوي أو عبر الرفع)</label>
                        <div className="flex flex-col gap-4">
                          <div className="relative">
                            <input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none font-mono text-sm pr-12" value={annFileUrl} onChange={e => setAnnFileUrl(e.target.value)} placeholder="رابط الملف المباشر..." />
                            <Download className="absolute top-4 right-4 text-slate-300 w-5 h-5" />
                          </div>
                          
                          <div className="flex items-center gap-4 p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                             <input 
                               type="file" 
                               id="ann-file-upload"
                               className="hidden" 
                               onChange={e => setAnnFile(e.target.files?.[0] || null)}
                             />
                             <label htmlFor="ann-file-upload" className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-black cursor-pointer hover:bg-slate-200 transition-all">
                               {annFile ? "تغيير الملف" : "رفع ملف جديد"}
                             </label>
                             <span className="text-[10px] text-slate-400 font-bold truncate">
                               {annFile ? annFile.name : "سيتم رفع الملف إلى Storage عند الحفظ"}
                             </span>
                          </div>
                        </div>
                      </div>
                   </div>
                   <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-emerald-600 transition-all shadow-2xl">حفظ الإعلان الآن</button>
                </form>
              )}
              {/* ADD/EDIT FORM FOR PRODUCTS */}
              {subTab === 'add' && activeTab === 'academy_products' && (
                <form onSubmit={addProduct} className="space-y-8 max-w-3xl mx-auto py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                    <div className="space-y-2 col-span-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">اسم المنتج / الدورة</label>
                      <input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" value={prodTitle} onChange={e => setProdTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">الوصف</label>
                      <textarea rows={4} required className="w-full p-6 bg-white border border-slate-200 rounded-3xl outline-none focus:border-red-600" value={prodDesc} onChange={e => setProdDesc(e.target.value)} />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">المدرب / المقدم</label>
                      <input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={prodInstructor} onChange={e => setProdInstructor(e.target.value)} />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">التصنيف</label>
                      <input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={prodCategory} onChange={e => setProdCategory(e.target.value)} placeholder="دورات تدريبية, الخ..." />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">السعر الحالي</label>
                      <input type="number" required step="0.01" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">السعر القديم (اختياري)</label>
                      <input type="number" step="0.01" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={prodOldPrice} onChange={e => setProdOldPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">النوع</label>
                      <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={prodType} onChange={e => setProdType(e.target.value as any)}>
                        <option value="course">دورة مسجلة</option>
                        <option value="session">جلسة مباشرة</option>
                        <option value="file">ملف / ملزمة</option>
                      </select>
                    </div>
                    <div className="space-y-2 text-right col-span-2">
                       <label className="text-xs font-black text-slate-400 uppercase">صورة المنتج / الغلاف</label>
                       <div className="flex gap-4 items-center">
                          <input type="text" placeholder="رابط الصورة أو ارفع واحدة..." className="flex-1 h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-mono text-sm" value={prodThumbnail} onChange={e => setProdThumbnail(e.target.value)} />
                          <label className="cursor-pointer bg-slate-900 text-white px-6 h-14 rounded-2xl flex items-center gap-2 hover:bg-emerald-600 transition-all font-bold text-sm whitespace-nowrap">
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                            رفع صورة
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setProdImageFile(file);
                                setProdThumbnail(URL.createObjectURL(file));
                              }
                            }} />
                          </label>
                       </div>
                       {prodThumbnail && <img src={prodThumbnail} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200 mt-2" />}
                    </div>
                    <div className="space-y-2 text-right">
                       <label className="text-xs font-black text-slate-400 uppercase">وسيلة التواصل</label>
                       <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" value={prodContactMethod} onChange={e => setProdContactMethod(e.target.value)}>
                         <option value="whatsapp">واتساب</option>
                         <option value="phone">اتصال هاتف</option>
                         <option value="email">بريد إلكتروني</option>
                                <option value="link">رابط خارجي</option>
                       </select>
                    </div>
                    <div className="space-y-2 text-right">
                       <label className="text-xs font-black text-slate-400 uppercase">رقم التواصل / الإيميل</label>
                       <input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={prodContactInfo} onChange={e => setProdContactInfo(e.target.value)} placeholder="مثلاً: 9627XXXXXXXX" />
                    </div>
                    <div className="space-y-2 text-right col-span-2">
                       <label className="text-xs font-black text-slate-400 uppercase">الحالة</label>
                       <select className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" value={prodStatus} onChange={e => setProdStatus(e.target.value)}>
                         <option value="active">نشط (يظهر في المتجر)</option>
                         <option value="pending">بانتظار الموافقة</option>
                         <option value="inactive">معطل / مسودة</option>
                       </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-emerald-600 transition-all shadow-2xl">حفظ المنتج الآن</button>
                </form>
              )}

              {/* ADD/EDIT FORM FOR JOBS */}
              {subTab === 'add' && activeTab === 'jobs' && (
                <form onSubmit={addJob} className="space-y-8 max-w-3xl mx-auto py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                    <div className="space-y-2 col-span-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">المسمى الوظيفي</label>
                      <input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600 font-bold" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">الجهة / الشركة</label>
                      <input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={jobCompany} onChange={e => setJobCompany(e.target.value)} />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">الموقع / المدينة</label>
                      <input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={jobLocation} onChange={e => setJobLocation(e.target.value)} />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">نوع الدوام</label>
                      <input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={jobType} onChange={e => setJobType(e.target.value)} placeholder="دوام كامل, جزئي..." />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-slate-400 uppercase">الخبرة المطلوبة</label>
                      <input type="text" className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={jobExp} onChange={e => setJobExp(e.target.value)} />
                    </div>
                    <div className="space-y-2 text-right col-span-2">
                       <label className="text-xs font-black text-slate-400 uppercase">معلومات التواصل للتقديم</label>
                       <input type="text" required className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-red-600" value={jobContact} onChange={e => setJobContact(e.target.value)} placeholder="ايميل أو رقم هاتف أو رابط" />
                    </div>
                  </div>
                  <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-emerald-600 transition-all shadow-2xl">حفظ الوظيفة الآن</button>
                </form>
              )}

              {/* BULK ADD VIEW */}
              {subTab === 'bulk' && activeTab === 'questions' && (
                <form onSubmit={handleBulkAdd} className="space-y-8 animate-in fade-in duration-500">
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl text-right space-y-3">
                    <div className="flex items-center justify-between">
                      <button 
                        type="button"
                        onClick={() => {
                          const sample = `[\n  {\n    "text": "ما هي عاصمة المملكة الأردنية الهاشمية؟",\n    "options": ["عمان", "إربد", "الزرقاء", "العقبة"],\n    "correct": 0,\n    "major": "عام",\n    "explanation": "عمان هي العاصمة السياسية والإدارية للأردن."\n  },\n  {\n    "question": "كم عدد أضلاع المربع؟",\n    "choices": ["3", "4", "5", "6"],\n    "answer": "ب",\n    "major": "رياضيات"\n  }\n]`;
                          setBulkText(sample);
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        تعبئة صيغة نموذجية للتجربة
                      </button>
                      <h3 className="text-amber-900 font-black flex items-center gap-2 text-sm">
                        تعليمات وإرشادات الرفع الجماعي للأسئلة
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      </h3>
                    </div>
                    <p className="text-amber-800 text-xs leading-relaxed">
                      النظام أصبح يقبل التنسيق بمرونة فائقة! يمكنك إلصاق مصفوفة JSON مع أي مسميات متداولة (مثل <code className="bg-white/70 px-1 py-0.5 rounded text-amber-900">text</code> أو <code className="bg-white/70 px-1 py-0.5 rounded text-amber-900">question</code>، أو <code className="bg-white/70 px-1 py-0.5 rounded text-amber-900">options</code> أو <code className="bg-white/70 px-1 py-0.5 rounded text-amber-900">choices</code>، والإجابة رقم أو حرف <code className="bg-white/70 px-1 py-0.5 rounded text-amber-900">أ / ب / ج / د</code>).
                    </p>
                    <div className="bg-white/80 p-3 rounded-2xl border border-amber-200 font-mono text-[11px] text-amber-900 text-left ltr overflow-x-auto">
                      [{ "{" } "text": "نص السؤال؟", "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"], "correct": 0, "major": "عام", "explanation": "شرح اختياري" { "}" }]
                    </div>
                  </div>
                  <textarea 
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    required
                    placeholder="الصق نص الأسئلة أو مصفوفة JSON هنا..."
                    className="w-full h-[380px] p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:bg-white focus:border-red-600 font-mono text-sm leading-relaxed"
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
                        [{"{"} "text": "السؤال؟", "options": ["أ", "ب", "ج", "د"], "correct": 0, "major": "رياضيات", "explanation": "تفسير اختياري" {"}"}]
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

      {/* MODAL FOR VIEWING FULL DETAILS (Instructor Requests / Messages) */}
      <AnimatePresence>
        {(viewingRequest || viewingMessage) && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={() => { setViewingRequest(null); setIsApproving(false); setViewingMessage(null); }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                 {/* Decorative background circle */}
                 <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl" />
                 
                 <button 
                    onClick={() => { setViewingRequest(null); setIsApproving(false); setViewingMessage(null); }}
                    className="absolute left-6 top-7 p-2.5 bg-white/10 hover:bg-red-500 rounded-xl transition-all z-20 group"
                 >
                   <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                 </button>
                 
                 <div className="text-right relative z-10">
                    <div className="bg-red-500/30 text-red-200 px-3 py-1 rounded-full inline-block mb-3 border border-red-500/20">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                        {viewingRequest ? "مراجعة طلب الانضمام" : "مراجعة الرسالة"}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black">
                      {viewingRequest ? (viewingRequest.full_name || viewingRequest.fullName) : (viewingMessage.full_name || viewingMessage.name)}
                    </h2>
                    <div className="flex items-center justify-end gap-2 text-slate-400 mt-1">
                      <span className="text-xs font-bold">{viewingRequest ? viewingRequest.email : viewingMessage.email}</span>
                      <Mail className="w-3 h-3" />
                    </div>
                 </div>
              </div>

              <div className="p-8 space-y-6 text-right bg-white">
                {viewingRequest ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 transition-colors hover:border-red-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">الهاتف</p>
                        <p className="font-bold text-slate-900 text-sm ltr">{viewingRequest.phone}</p>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 transition-colors hover:border-red-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                          {viewingRequest.type === 'business' ? 'الشركة' : 'المادة / التخصص'}
                        </p>
                        <p className="font-black text-red-600 text-sm truncate">
                          {viewingRequest.metadata?.major || viewingRequest.major || viewingRequest.metadata?.company_name || viewingRequest.entity_name}
                        </p>
                      </div>
                    </div>
                    {viewingRequest.type === 'business' && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">الموقع الإلكتروني / العنوان</p>
                            <p className="text-xs font-bold text-slate-900">
                                {viewingRequest.metadata?.website} - {viewingRequest.metadata?.location}
                            </p>
                        </div>
                    )}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-end gap-2 mb-3 pb-2 border-b border-slate-200/50">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">التفاصيل والخبرة</span>
                        <HelpCircle className="w-3 h-3 text-slate-300" />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar pr-1">
                        {viewingRequest.content || viewingRequest.experience || viewingRequest.experience_summary || "لا توجد تفاصيل إضافية مزودة."}
                      </p>
                    </div>
                    <div className="flex flex-col gap-4 pt-2 mt-2">
                      {isApproving ? (
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                          <p className="text-xs font-black text-emerald-800 mb-3 text-right">سيتم إنشاء حساب لهذا المستخدم تلقائياً بنفس بريده الإلكتروني. يرجى اختيار نوع الحساب وإدخال كلمة المرور:</p>
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <select 
                                value={approvalRole}
                                onChange={e => setApprovalRole(e.target.value)}
                                className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                              >
                                <option value="user">طالب / مستخدم عادي</option>
                                <option value="instructor">مدرب مكثفات</option>
                                <option value="company">شركة / عمل</option>
                                <option value="service_provider">مقدم خدمة</option>
                                <option value="admin">مدير نظام</option>
                              </select>
                              <input
                                 type="text"
                                 placeholder="كلمة المرور للحساب..."
                                 value={approvalPassword}
                                 onChange={e => setApprovalPassword(e.target.value)}
                                 className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 outline-none"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                 onClick={() => { setIsApproving(false); setApprovalPassword(""); }}
                                 className="px-6 py-2 bg-white text-slate-500 rounded-xl font-black text-[10px] border border-slate-200 hover:bg-slate-50 transition-all"
                              >
                                 إلغاء
                              </button>
                              <button
                                 onClick={() => handleApproveAndCreateUser(viewingRequest)}
                                 disabled={approvingLoading || !approvalPassword}
                                 className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                              >
                                 {approvingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء حساب وموافقة"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(viewingRequest.created_at).toLocaleDateString('ar-JO')}
                          </span>
                          <div className="flex gap-2">
                            {viewingRequest.status !== 'approved' && (
                              <button 
                                onClick={() => {
                                  setIsApproving(true);
                                  let defaultRole = 'user';
                                  if (viewingRequest.type === 'instructor') defaultRole = 'instructor';
                                  else if (viewingRequest.type === 'business') defaultRole = 'company';
                                  else if (viewingRequest.type === 'service_provider') defaultRole = 'service_provider';
                                  setApprovalRole(defaultRole);
                                }}
                                className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" /> موافقة وإنشاء حساب
                              </button>
                            )}
                            <button onClick={() => { deleteItem('system_submissions', viewingRequest.id); setViewingRequest(null); }} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all shadow-sm">حذف</button>
                            <a href={`mailto:${viewingRequest.email}`} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] hover:bg-red-600 transition-all shadow-md">تواصل الآن</a>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-300 uppercase mb-1">الموضوع</p>
                      <h4 className="text-lg font-black text-slate-900 mb-4">{viewingMessage.subject}</h4>
                      <div className="flex items-center justify-end gap-2 mb-3 pb-2 border-b border-slate-200/50">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">نص الرسالة</span>
                        <MessageSquare className="w-3 h-3 text-slate-300" />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {viewingMessage.content || viewingMessage.message}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(viewingMessage.created_at || Date.now()).toLocaleDateString('ar-JO')}
                      </span>
                      <div className="flex gap-2">
                         <button onClick={() => { deleteItem('system_submissions', viewingMessage.id); setViewingMessage(null); }} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all shadow-sm">حذف</button>
                         <a href={`mailto:${viewingMessage.email}`} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] hover:bg-red-600 transition-all shadow-md">رد ايميل</a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Visitors Modal Window for Admins and Content Managers */}
      <AnimatePresence>
        {showVisitorModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-6 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">سجل وجداول الزوار اليومي</h3>
                    <p className="text-xs text-slate-300 font-bold">تتبع شامل لحركة الدخول وزيارات الموقع لكل يوم</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => fetchData()}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                    title="تحديث البيانات"
                  >
                    <Clock className="w-3.5 h-3.5 text-red-400" />
                    تحديث
                  </button>
                  <button 
                    onClick={() => setShowVisitorModal(false)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                {/* Metrics Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Today Count */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50/60 border border-red-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        زيارات اليوم
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date().toISOString().split('T')[0]}
                      </span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight my-1">
                      {dailyVisitorsCount}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">إجمالي التصفحات المسجلة اليوم</p>
                  </div>

                  {/* Online Now */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase">المتواجدون الآن</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 my-1">{onlineCount}</div>
                    <span className="text-[11px] text-slate-400 font-bold">متصفح نشط في الوقت الحالي</span>
                  </div>

                  {/* Total Visitors */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase">إجمالي الزوار الكلي</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 my-1">{Number(siteSet.visitor_count || 0).toLocaleString('ar-JO')}</div>
                    <span className="text-[11px] text-slate-400 font-bold">مجموع كافة زيارات الموقع</span>
                  </div>
                </div>

                {/* Table Header Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="بحث بتاريخ اليوم (مثال 2026-08-03)..."
                      value={visitorSearchTerm}
                      onChange={(e) => setVisitorSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  
                  <button 
                    onClick={exportVisitorReport}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                    تصدير تقرير Excel
                  </button>
                </div>

                {/* Daily Visitor Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                          <th className="py-3.5 px-4">التاريخ واليوم</th>
                          <th className="py-3.5 px-4">عدد الزوار</th>
                          <th className="py-3.5 px-4 hidden sm:table-cell">نسبة النشاط</th>
                          <th className="py-3.5 px-4">الحالة</th>
                          <th className="py-3.5 px-4 text-left">التحكم</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                        {(() => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          const yesterdayObj = new Date();
                          yesterdayObj.setDate(yesterdayObj.getDate() - 1);
                          const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

                          const filteredList = dailyVisitorsList.filter(item => 
                            item.date.includes(visitorSearchTerm) ||
                            new Date(item.date).toLocaleDateString('ar-JO', { weekday: 'long' }).includes(visitorSearchTerm)
                          );

                          const maxVal = Math.max(...dailyVisitorsList.map(i => i.count), 1);

                          if (filteredList.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                                  لا توجد سجلات زوار تطابق معايير البحث
                                </td>
                              </tr>
                            );
                          }

                          return filteredList.map((item, idx) => {
                            const isToday = item.date === todayStr;
                            const isYesterday = item.date === yesterdayStr;
                            const dateFormatted = new Date(item.date).toLocaleDateString('ar-JO', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            });
                            const percent = Math.min(Math.round((item.count / maxVal) * 100), 100);

                            return (
                              <tr key={idx} className={isToday ? "bg-red-50/40" : "hover:bg-slate-50/80 transition-colors"}>
                                <td className="py-3.5 px-4">
                                  <div className="flex flex-col">
                                    <span className="font-black text-slate-900 text-xs">{item.date}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{dateFormatted}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  {editingVisitorDate === item.date ? (
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        value={editingVisitorCount}
                                        onChange={(e) => setEditingVisitorCount(Number(e.target.value))}
                                        className="w-20 px-2 py-1 border border-red-500 rounded-lg text-xs font-bold bg-white focus:outline-none"
                                        min="0"
                                      />
                                      <button 
                                        onClick={() => handleSaveVisitorCount(item.date, editingVisitorCount)}
                                        className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold"
                                      >
                                        حفظ
                                      </button>
                                      <button 
                                        onClick={() => setEditingVisitorDate(null)}
                                        className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                                      >
                                        إلغاء
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-black text-slate-900">{item.count}</span>
                                      <span className="text-[10px] text-slate-400 font-bold">زيارة</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 hidden sm:table-cell">
                                  <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${isToday ? 'bg-red-600' : 'bg-slate-700'}`}
                                      style={{ width: `${Math.max(percent, 4)}%` }}
                                    />
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  {isToday ? (
                                    <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black border border-red-200 flex items-center gap-1 w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                      اليوم (نشط)
                                    </span>
                                  ) : isYesterday ? (
                                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200 w-fit inline-block">
                                      أمس
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold w-fit inline-block">
                                      سابق
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-left">
                                  <button 
                                    onClick={() => {
                                      setEditingVisitorDate(item.date);
                                      setEditingVisitorCount(item.count);
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                                    title="تعديل القيمة"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span className="text-[10px]">تعديل</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-400 font-bold">
                  إجمالي الأيام الموثقة: {dailyVisitorsList.length} يوم
                </span>
                <button
                  onClick={() => setShowVisitorModal(false)}
                  className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  إغلاق النافذة
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
