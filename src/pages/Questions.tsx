import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, ChevronDown, Loader2, FileText, Download, Calendar, HardDrive } from "lucide-react";
import { supabase } from "../lib/supabase";

interface QuestionFile {
  title: string;
  category: string;
  date: string;
  size: string;
  downloadCount: number;
  url: string;
}

const STATIC_QUESTION_FILES: QuestionFile[] = [
  // ... Keep static files as fallback ...
  // --- مختبرات (English - Question Banks) ---
  { 
    category: "مختبرات", 
    title: "Clinical Laboratory Science - MCQ Exam Bank (High Quality)", 
    date: "2024/02/10", 
    size: "2.8 MB", 
    downloadCount: 4500, 
    url: "https://www.meded.pitt.edu/sites/default/files/Laboratory%20Medicine%20Practice%20Guideline.pdf" 
  },
  { 
    category: "مختبرات", 
    title: "Hematology & Blood Bank - Practice Questions Set", 
    date: "2024/05/12", 
    size: "1.9 MB", 
    downloadCount: 2800, 
    url: "https://www.cdc.gov/labstandards/pdf/nsqap/nsqap_summary_report_2023.pdf" 
  },
  { 
    category: "مختبرات", 
    title: "Microbiology & Immunology Exam Samples (Questions only)", 
    date: "2024/01/20", 
    size: "3.4 MB", 
    downloadCount: 5100, 
    url: "https://www.asm.org/ASM/media/Education/Curriculum%20Guidelines/Microbiology-Question-Bank.pdf" 
  },
  { 
    category: "مختبرات", 
    title: "Pathology MCQs for Laboratory Specialists", 
    date: "2024/05/22", 
    size: "2.1 MB", 
    downloadCount: 1900, 
    url: "https://www.who.int/docs/default-source/primary-health-care-conference/lab.pdf" 
  },
  
  // --- تمريض (English - NCLEX/Exam Models) ---
  { 
    category: "تمريض", 
    title: "NCLEX-RN Style Practice Questions - Fundamentals of Nursing", 
    date: "2024/03/15", 
    size: "2.1 MB", 
    downloadCount: 8900, 
    url: "https://www.ncsbn.org/public-files/2023_RN_Test_Plan_English.pdf" 
  },
  { 
    category: "تمريض", 
    title: "Surgical & Medical Nursing - Critical Thinking Questions", 
    date: "2024/04/05", 
    size: "1.7 MB", 
    downloadCount: 3200, 
    url: "https://www.ahrq.gov/sites/default/files/wysiwyg/professionals/education/curriculum-tools/teamstepps/instructor/fundamentals/module2/igcommunication.pdf" 
  },
  { 
    category: "تمريض", 
    title: "Pediatric and Neonatal Care Exam Bank", 
    date: "2024/05/18", 
    size: "1.3 MB", 
    downloadCount: 2100, 
    url: "https://www.who.int/docs/default-source/maternal-health/nursing-and-midwifery/nursing-midwifery-strategy.pdf" 
  },
  
  // --- قانون (Arabic - نماذج امتحانات ديوان الخدمة) ---
  { 
    category: "قانون", 
    title: "بنك أسئلة القانون الإداري والخدمة المدنية (نموذج التخصص)", 
    date: "2024/06/01", 
    size: "2.2 MB", 
    downloadCount: 12400, 
    url: "http://www.csb.gov.jo/web/images/pdf/nizam-2020.pdf" 
  },
  { 
    category: "قانون", 
    title: "أسئلة مقترحة في الثقافة الدستورية والقانونية - الأردن", 
    date: "2024/05/20", 
    size: "1.5 MB", 
    downloadCount: 7600, 
    url: "https://www.representatives.jo/sites/default/files/Dostour_Arabic_New.pdf" 
  },
  { 
    category: "قانون", 
    title: "نموذج امتحان الكفاية القانونية لعام 2023 - شامل", 
    date: "2023/12/10", 
    size: "2.6 MB", 
    downloadCount: 5400, 
    url: "https://www.moj.gov.jo/ebv4.0/root_storage/ar/eb_list_page/%D8%A7%D9%84%D9%82%D8%A7%D9%86%D9%88%D9%86_%D8%A7%D9%84%D9%85%D8%AF%D9%86%D9%8A.pdf" 
  },
  
  // --- معلم صف (Arabic - كفايات تعليمية) ---
  { 
    category: "معلم صف", 
    title: "بنك أسئلة الكفاية المهنية للمعلمين - تخصص معلم صف", 
    date: "2024/03/10", 
    size: "2.9 MB", 
    downloadCount: 9200, 
    url: "https://www.moe.gov.jo/sites/default/files/Teacher_Competencies_Framework.pdf" 
  },
  { 
    category: "معلم صف", 
    title: "نماذج اختبارات التدريس والتربية الحديثة - بنك الأسئلة", 
    date: "2024/02/28", 
    size: "1.8 MB", 
    downloadCount: 4500, 
    url: "https://www.moe.gov.jo/sites/default/files/Educational_Training_Materials.pdf" 
  },
  { 
    category: "معلم صف", 
    title: "دليل تقييم أداء المعلم وبنك أسئلة القياس التربوي", 
    date: "2024/01/15", 
    size: "3.1 MB", 
    downloadCount: 3800, 
    url: "https://www.moe.gov.jo/sites/default/files/Teacher_Evaluation_Protocols.pdf" 
  },

  // --- IT (English - Certification Banks) ---
  { 
    category: "IT", 
    title: "Networking and System Admin - Practice Exam Bank", 
    date: "2024/05/19", 
    size: "2.5 MB", 
    downloadCount: 6300, 
    url: "https://nptel.ac.in/content/storage2/courses/106105081/pdf/mod12les33.pdf" 
  },
  { 
    category: "IT", 
    title: "Database Management Systems - Sample Questions Bank", 
    date: "2024/04/10", 
    size: "3.2 MB", 
    downloadCount: 4100, 
    url: "https://nptel.ac.in/content/storage2/courses/106106093/Lesson01.pdf" 
  },
  { 
    category: "IT", 
    title: "Cybersecurity Fundamentals - Practice Exam Questions", 
    date: "2024/05/12", 
    size: "1.9 MB", 
    downloadCount: 2200, 
    url: "https://csrc.nist.gov/CSRC/media/Publications/sp/800-53/rev-5/final/documents/sp800-53r5-advisory-v2.pdf" 
  },

  // --- إدارة عامة (Arabic - كفايات إدارية) ---
  { 
    category: "الإدارة العامة", 
    title: "بنك أسئلة الكفايات الإدارية والقيادية - هيئة الخدمة", 
    date: "2024/06/05", 
    size: "1.4 MB", 
    downloadCount: 15600, 
    url: "http://www.csb.gov.jo/web/images/stories/behavioral%20code-ar.pdf" 
  },
  { 
    category: "الإدارة العامة", 
    title: "تجميعات أسئلة الإدارة العامة - نماذج سنوات سابقة", 
    date: "2024/05/25", 
    size: "2.1 MB", 
    downloadCount: 8800, 
    url: "http://www.csb.gov.jo/web/images/stories/behavioral%20code-ar.pdf" 
  },
  { 
    category: "الإدارة العامة", 
    title: "أسئلة المهارات الرقمية والقيادة لموظفي القطاع العام", 
    date: "2024/04/30", 
    size: "1.8 MB", 
    downloadCount: 4200, 
    url: "http://www.csb.gov.jo/web/images/stories/behavioral%20code-ar.pdf" 
  },
  { 
    category: "قانون", 
    title: "نموذج امتحان الكفاية القانونية لعام 2024 - المستوى الأول", 
    date: "2024/02/12", 
    size: "1.9 MB", 
    downloadCount: 3100, 
    url: "https://www.moj.gov.jo/ebv4.0/root_storage/ar/eb_list_page/law_regulations.pdf" 
  },
  { 
    category: "تمريض", 
    title: "Nursing Care Plans and practice exam questions", 
    date: "2024/01/05", 
    size: "2.4 MB", 
    downloadCount: 6700, 
    url: "https://www.who.int/docs/default-source/nursing-midwifery/nursing-and-midwifery-strategy.pdf" 
  },
  { 
    category: "IT", 
    title: "Full Stack Development Practice Exam and Interview Questions", 
    date: "2024/05/28", 
    size: "3.5 MB", 
    downloadCount: 1500, 
    url: "https://nptel.ac.in/content/storage2/courses/106105084/pdf/m1l1.pdf" 
  },
];

const CATEGORIES = ["مختبرات", "تمريض", "قانون", "معلم صف", "IT", "الإدارة العامة"];

export default function Questions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("مختبرات");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [filesList, setFilesList] = useState<QuestionFile[]>(STATIC_QUESTION_FILES);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    async function fetchFiles() {
      if (!supabase) return;
      setIsSupabaseLoading(true);
      try {
        const { data, error } = await supabase
          .from('question_files')
          .select('*');
        
        if (data && !error && data.length > 0) {
          // Map DB keys to component keys if they differ
          const mapped = data.map(item => ({
            title: item.title,
            category: item.category,
            date: item.file_date || item.date,
            size: item.file_size || item.size,
            downloadCount: item.download_count || 0,
            url: item.url
          }));
          setFilesList(mapped);
        }
      } catch (err) {
        console.error("Error fetching from Supabase:", err);
      } finally {
        setIsSupabaseLoading(false);
      }
    }
    fetchFiles();
  }, []);

  const filteredCategories = CATEGORIES.filter(cat => 
    cat.toLowerCase().includes(catSearch.toLowerCase())
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("search");
    if (query) {
      setSearchTerm(query);
    }
  }, [location.search]);

  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filtered = filesList.filter(f => {
    const matchesSearch = f.title.includes(debouncedTerm) || f.category.includes(debouncedTerm);
    const matchesCategory = f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-slate-900 mb-3">بنك الأسئلة والملفات</h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
          تحميل تجميعات الأسئلة والنماذج التدريبية حسب التخصص. كافة الملفات محدثة لعام 2024.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-16">
        {/* Specialty Selector */}
        <div className="w-full md:w-64 relative">
          <label className="block text-[10px] font-black text-slate-400 mb-1 mr-2 uppercase">التخصص:</label>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 flex items-center justify-between shadow-sm hover:border-red-600 transition-all text-slate-800 font-bold text-sm"
          >
            <span>{activeCategory}</span>
            <ChevronDown className={`w-4 h-4 transition-transform text-slate-400 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث..."
                    className="w-full h-8 pr-8 pl-3 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-red-600 transition-all"
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full p-3 px-4 text-right hover:bg-slate-50 transition-colors flex items-center justify-between text-xs font-bold ${
                      activeCategory === cat ? 'bg-red-50 text-red-600' : 'text-slate-600'
                    }`}
                  >
                    {cat}
                    {activeCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="w-full md:w-96 relative pt-4 md:pt-5">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 mt-5 md:mt-0">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </div>
          <input
            type="text"
            placeholder="ابحث عن ملف محدد..."
            className="w-full h-11 pr-10 pl-4 rounded-xl bg-white border border-slate-200 shadow-sm focus:outline-none focus:border-red-600 transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isDropdownOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsDropdownOpen(false)} />}

      {/* Files Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((file, idx) => (
          <a
            key={idx}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl border border-slate-200 p-6 transition-all hover:shadow-xl hover:shadow-slate-500/10 group cursor-pointer block no-underline"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-slate-300 group-hover:text-red-600 transition-colors">
                <Download className="w-5 h-5" />
              </div>
            </div>
            
            <h3 className="text-base font-bold text-slate-900 mb-4 h-12 line-clamp-2 leading-relaxed group-hover:text-red-600 transition-colors">
              {file.title}
            </h3>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">{file.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 justify-end">
                <HardDrive className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">{file.size}</span>
              </div>
            </div>
          </a>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-32">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-slate-200" />
            </div>
            <p className="text-slate-400 text-sm font-bold italic">لا توجد ملفات تطابق معايير البحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
