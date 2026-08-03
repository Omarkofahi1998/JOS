import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Search, ChevronDown, Loader2, FileText, Download, Calendar, HardDrive, Share2, Check } from "lucide-react";
import { supabase } from "../lib/supabase";

interface QuestionFile {
  id: string | number;
  title: string;
  category: string;
  date: string;
  size: string;
  downloadCount: number;
  shareCount: number;
  url: string;
}

const CATEGORIES = ["مختبرات", "تمريض", "قانون", "معلم صف", "IT", "الإدارة العامة"];

export default function Questions() {
  const { fileTitle: fileParam } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("مختبرات");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [filesList, setFilesList] = useState<QuestionFile[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>(CATEGORIES);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(true);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const location = useLocation();

  const handleShare = async (file: QuestionFile) => {
    const url = `${window.location.origin}/questions/${encodeURIComponent(file.title)}`;
    const shareData = {
      title: "بنك أسئلة - Jo Students",
      text: `ألقِ نظرة على هذا الملف في بنك أسئلة Jo Students: ${file.title}`,
      url: url
    };

    // Increment share count in Supabase
    try {
      if (supabase) {
        setFilesList(prev => prev.map(f => 
          f.id === file.id ? { ...f, shareCount: f.shareCount + 1 } : f
        ));
        
        await supabase
          .from('question_files')
          .update({ share_count: file.shareCount + 1 })
          .eq('id', file.id);
      }
    } catch (err) {
      console.error("Error updating share count:", err);
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyToClipboard(url, file.title);
      }
    } else {
      copyToClipboard(url, file.title);
    }
  };

  const copyToClipboard = (url: string, title: string) => {
    navigator.clipboard.writeText(url);
    setSharedId(title);
    setTimeout(() => setSharedId(null), 2000);
  };

  useEffect(() => {
    // Handle Shared File from dynamic route or search params
    if (fileParam) {
      try {
        setSearchTerm(decodeURIComponent(fileParam));
      } catch {
        setSearchTerm(fileParam);
      }
    } else {
      const params = new URLSearchParams(location.search);
      const fileSearch = params.get('file') || params.get('search') || params.get('title');
      if (fileSearch) {
        try {
          setSearchTerm(decodeURIComponent(fileSearch));
        } catch {
          setSearchTerm(fileSearch);
        }
      }
    }
  }, [fileParam, location.search]);

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
            id: item.id,
            title: item.title,
            category: item.category,
            date: item.file_date || item.date || "اليوم",
            size: item.file_size || item.size || "1 MB",
            downloadCount: Number(item.download_count ?? item.downloads ?? item.downloadCount ?? 0),
            shareCount: Number(item.share_count ?? item.shares ?? item.shareCount ?? 0),
            url: item.url
          }));
          setFilesList(mapped);

          // Extract unique categories
          const uniqueCats = Array.from(new Set(data.map(item => item.category)));
          if (uniqueCats.length > 0) {
            setAvailableCategories(uniqueCats);
            // If active category is not in list, set to first available
            if (!uniqueCats.includes(activeCategory)) {
              setActiveCategory(uniqueCats[0]);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching from Supabase:", err);
      } finally {
        setIsSupabaseLoading(false);
      }
    }
    fetchFiles();
  }, []);

  const filteredCategories = availableCategories.filter(cat => 
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

  useEffect(() => {
    if (debouncedTerm.trim() && filesList.length > 0) {
      const term = debouncedTerm.trim().toLowerCase();
      const matchedFile = filesList.find(f => 
        f.title.toLowerCase().includes(term) || (f.url && f.url.toLowerCase().includes(term))
      );
      if (matchedFile && matchedFile.category) {
        setActiveCategory(matchedFile.category);
      }
    }
  }, [debouncedTerm, filesList]);

  const filtered = filesList.filter(f => {
    const term = debouncedTerm.trim().toLowerCase();
    if (!term) {
      return f.category === activeCategory;
    }
    return (
      f.title.toLowerCase().includes(term) || 
      f.category.toLowerCase().includes(term)
    );
  });

  const handleDownload = async (file: QuestionFile) => {
    const nextCount = (Number(file.downloadCount) || 0) + 1;
    try {
      // Optimistic update
      setFilesList(prev => prev.map(f => 
        f.id === file.id ? { ...f, downloadCount: nextCount } : f
      ));

      // Update in Supabase
      if (supabase) {
        const { error } = await supabase
          .from('question_files')
          .update({ 
            download_count: nextCount,
            downloads: nextCount
          })
          .eq('id', file.id);
        
        if (error) {
          console.warn("Retrying download_count update with standard column:", error);
          await supabase
            .from('question_files')
            .update({ download_count: nextCount })
            .eq('id', file.id);
        }
      }
    } catch (err) {
      console.error("Error updating download count:", err);
    }
    
    // Open in new tab if URL exists
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
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
            {isSupabaseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
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
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 p-6 transition-all hover:shadow-xl hover:shadow-slate-500/10 group flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  {file.downloadCount} تحميل
                </span>
                <button 
                  onClick={() => handleShare(file)}
                  className={`w-10 h-10 flex items-center justify-center transition-colors rounded-xl relative ${
                    searchTerm === file.title ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-red-600'
                  }`}
                  title="مشاركة"
                >
                  {sharedId === file.title ? <Check className="w-5 h-5 text-white" /> : <Share2 className="w-5 h-5" />}
                  {sharedId === file.title && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap animate-in fade-in zoom-in">
                      تم النسخ!
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            <h3 className="text-base font-bold text-slate-900 mb-4 h-12 line-clamp-2 leading-relaxed">
              {file.title}
            </h3>

            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 mt-auto">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold text-center truncate">{file.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-black justify-center">
                <Download className="w-3.5 h-3.5" />
                <span className="text-xs font-extrabold">{file.downloadCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 font-bold justify-center">
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">{file.shareCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 justify-end">
                <HardDrive className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">{file.size}</span>
              </div>
            </div>

            <button 
              onClick={() => handleDownload(file)}
              className="mt-6 w-full bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all active:scale-95 no-underline shadow-sm"
            >
              <Download className="w-4 h-4" />
              تحميل الملف ({file.downloadCount})
            </button>
          </div>
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
