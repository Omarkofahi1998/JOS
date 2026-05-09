import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Megaphone, Clock, ExternalLink, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'banner' | 'popup';
  is_active: boolean;
  show_countdown: boolean;
  target_date: string | null;
  button_text: string | null;
  button_url: string | null;
  file_url: string | null;
  image_url: string | null;
  created_at: string;
}

export default function AnnouncementPortal() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [activePopup, setActivePopup] = useState<Announcement | null>(null);
  const [activeBanner, setActiveBanner] = useState<Announcement | null>(null);

  useEffect(() => {
    async function fetchAnnouncements() {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setAnnouncements(data);
        const banner = data.find(a => a.type === 'banner');
        const popup = data.find(a => a.type === 'popup');
        
        if (banner) setActiveBanner(banner);
        if (popup) {
          // Check if this popup was already dismissed in this session
          const dismissed = sessionStorage.getItem(`announcement_dismissed_${popup.id}`);
          if (!dismissed) {
            setActivePopup(popup);
            setShowPopup(true);
          }
        }
      }
    }

    fetchAnnouncements();

    // Real-time subscription
    if (supabase) {
      const channel = supabase
        .channel('announcements_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'announcements' },
          () => {
            fetchAnnouncements();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const closePopup = () => {
    if (activePopup) {
      sessionStorage.setItem(`announcement_dismissed_${activePopup.id}`, 'true');
    }
    setShowPopup(false);
  };

  const closeBanner = () => {
    setActiveBanner(null);
  };

  return (
    <>
      {/* Banner Announcement */}
      <AnimatePresence>
        {activeBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`bg-red-600 text-white relative overflow-hidden z-40 transition-all hover:bg-red-700 ${activeBanner.button_url ? 'cursor-pointer' : ''}`}
            onClick={() => {
              if (activeBanner.button_url) {
                window.open(activeBanner.button_url, '_blank');
              }
            }}
          >
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">
                    {activeBanner.title}: <span className="font-normal opacity-90">{activeBanner.content}</span>
                  </p>
                </div>
                {activeBanner.show_countdown && activeBanner.target_date && (
                  <div className="hidden sm:flex flex-shrink-0 items-center gap-2 px-3 py-1 bg-black/20 rounded-full border border-white/10 ml-4">
                    <Clock className="w-3 h-3" />
                    <Countdown date={activeBanner.target_date} onComplete={() => {}} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {activeBanner.button_url && activeBanner.button_text && (
                  <a
                    href={activeBanner.button_url}
                    className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-black hover:bg-slate-100 transition-colors whitespace-nowrap"
                  >
                    {activeBanner.button_text}
                  </a>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeBanner();
                  }}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Announcement */}
      <AnimatePresence>
        {showPopup && activePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 relative"
            >
              <div className="absolute top-4 left-4 z-10">
                <button
                  onClick={closePopup}
                  className="p-2 bg-white/80 backdrop-blur-md hover:bg-white text-slate-500 rounded-full transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activePopup.image_url ? (
                <div className="w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                  <img 
                    src={activePopup.image_url} 
                    alt={activePopup.title} 
                    className="w-full h-auto max-h-[450px] object-contain"
                  />
                </div>
              ) : (
                <div className="relative aspect-video bg-red-600 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 jordan-flag-gradient opacity-20" />
                  <motion.div
                     animate={{ scale: [1, 1.1, 1] }}
                     transition={{ duration: 2, repeat: Infinity }}
                     className="relative z-10"
                  >
                    <Bell className="w-16 h-16 text-white/50" />
                  </motion.div>
                  <div className="absolute bottom-4 right-4 text-right">
                    <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 inline-block">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">إعلان هام</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 text-right">
                <h3 className="text-xl font-black text-slate-900 mb-3">{activePopup.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium whitespace-pre-wrap">
                  {activePopup.content}
                </p>

                {activePopup.show_countdown && activePopup.target_date && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-slate-400">
                       <Clock className="w-3 h-3" />
                       <span className="text-[10px] font-bold uppercase">متبقي على الموعد</span>
                    </div>
                    <Countdown date={activePopup.target_date} onComplete={() => {}} detailed />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {activePopup.button_url && activePopup.button_text && (
                    <a
                      href={activePopup.button_url}
                      className="w-full bg-red-600 text-white px-6 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
                    >
                      {activePopup.button_text}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {/* File Download Option */}
                  {activePopup.file_url && (
                    <a
                      href={activePopup.file_url}
                      download
                      className="w-full bg-emerald-600 text-white px-6 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                    >
                      تحميل الملف الهام الآن
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={closePopup}
                    className="w-full bg-slate-100 text-slate-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function Countdown({ date, onComplete, detailed = false }: { date: string, onComplete: () => void, detailed?: boolean }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const target = new Date(date).getTime();
    
    const calculate = () => {
      const now = new Date().getTime();
      const difference = target - now;
      
      if (difference <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        onComplete();
        return;
      }
      
      setTimeLeft({
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((difference % (1000 * 60)) / 1000)
      });
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [date, onComplete]);

  if (!timeLeft) return null;

  if (!detailed) {
    return (
      <span className="text-xs font-black font-mono">
        {timeLeft.d > 0 ? `${timeLeft.d}d ` : ''}
        {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div className="flex gap-4" dir="ltr">
      <TimeUnit value={timeLeft.d} label="DAYS" />
      <TimeUnit value={timeLeft.h} label="HRS" />
      <TimeUnit value={timeLeft.m} label="MINS" />
      <TimeUnit value={timeLeft.s} label="SECS" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: number, label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 mb-1">
        <span className="text-xl font-black text-slate-900 font-mono">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[8px] font-black text-slate-400 tracking-widest">{label}</span>
    </div>
  );
}
