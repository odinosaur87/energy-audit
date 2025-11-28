
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, Plus, Menu, LayoutDashboard, History, Settings, WifiOff, AlertTriangle
} from 'lucide-react';

import { THEMES, APP_VERSION, TRANSLATIONS, PIXEL_TRANSLATIONS } from './constants';
import { Log, Stats, Theme, Language, AppStyle } from './types';

// Components - Now imported from root
import { Dashboard } from './Dashboard';
import { LogHistory } from './LogHistory';
import { LogEntry } from './LogEntry';
import { Preferences } from './Preferences';

const STORAGE_KEY_LOGS = 'energy_audit_logs_local';
const STORAGE_KEY_PREFS = 'energy_audit_prefs_local';

export default function EnergyAuditApp() {
  const [view, setView] = useState<'dashboard' | 'history' | 'log' | 'preferences'>('dashboard'); 
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // App Preferences
  const [currentThemeId, setCurrentThemeId] = useState('default');
  const [reminders, setReminders] = useState<any>({});
  const [language, setLanguage] = useState<Language>('en');
  const [appStyle, setAppStyle] = useState<AppStyle>('classic');

  const theme = THEMES[currentThemeId] || THEMES.default;
  const isPixel = appStyle === 'pixel';

  // Translation Helper
  const t = (key: string) => {
    if (isPixel && PIXEL_TRANSLATIONS[key]) {
      return PIXEL_TRANSLATIONS[key];
    }
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en'][key] || key;
  };

  // --- Notification Logic ---
  useEffect(() => {
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
      const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      const todayReminders = reminders[dayName];
      if (todayReminders && Array.isArray(todayReminders)) {
        if (todayReminders.includes(timeString)) {
          const lastFiredKey = `energy_notif_${dayName}_${timeString}`;
          const lastFired = sessionStorage.getItem(lastFiredKey);
          
          if (!lastFired) {
            new Notification(t('checkIn'), {
              body: t('howFeeling'),
              icon: "/icon.png"
            });
            sessionStorage.setItem(lastFiredKey, 'true');
          }
        }
      }
    };

    const interval = setInterval(checkReminders, 20000);
    return () => clearInterval(interval);
  }, [reminders, language, isPixel]);

  // --- Data Loading (Local Storage) ---
  useEffect(() => {
    const loadLocalData = () => {
      try {
        // Load Logs
        const localLogs = localStorage.getItem(STORAGE_KEY_LOGS);
        if (localLogs) {
          const parsed = JSON.parse(localLogs).map((l: any) => ({
            ...l,
            createdAt: new Date(l.createdAt)
          }));
          // Sort desc
          parsed.sort((a: Log, b: Log) => b.createdAt.getTime() - a.createdAt.getTime());
          setLogs(parsed);
        }

        // Load Preferences
        const localPrefs = localStorage.getItem(STORAGE_KEY_PREFS);
        if (localPrefs) {
          const parsed = JSON.parse(localPrefs);
          if (parsed.themeId && THEMES[parsed.themeId]) setCurrentThemeId(parsed.themeId);
          if (parsed.reminders) setReminders(parsed.reminders);
          if (parsed.language) setLanguage(parsed.language);
          if (parsed.appStyle) setAppStyle(parsed.appStyle);
        }
      } catch (e) {
        console.error("Error loading local data", e);
      } finally {
        setLoading(false);
      }
    };

    loadLocalData();
  }, []);

  // --- Derived Statistics ---
  const stats: Stats = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = logs.filter(l => l.createdAt >= sevenDaysAgo);
    const activityImpact: Record<string, { count: number; energyScore: number; moodScore: number }> = {};

    recentLogs.forEach(log => {
      log.activities.forEach(activity => {
        if (!activityImpact[activity]) {
          activityImpact[activity] = { count: 0, energyScore: 0, moodScore: 0 };
        }
        activityImpact[activity].count += 1;
        activityImpact[activity].moodScore += log.mood; 
        
        const impactVal = log.energy === 'draining' ? -1 : log.energy === 'energizing' ? 1 : 0;
        activityImpact[activity].energyScore += impactVal;
      });
    });

    const sortedActivities = Object.entries(activityImpact).map(([name, data]) => ({
      name,
      avgMood: data.moodScore / data.count,
      netEnergy: data.energyScore,
      count: data.count
    }));

    return {
      recentLogs,
      energizers: sortedActivities.filter(a => a.netEnergy > 0).sort((a, b) => b.netEnergy - a.netEnergy),
      drainers: sortedActivities.filter(a => a.netEnergy < 0).sort((a, b) => a.netEnergy - b.netEnergy),
      averageMood: recentLogs.length ? (recentLogs.reduce((acc, curr) => acc + curr.mood, 0) / recentLogs.length).toFixed(1) : 0
    };
  }, [logs]);

  // --- Actions ---
  const handleSaveLog = (logData: any) => {
    const newLog = {
      id: Date.now().toString(),
      ...logData,
      createdAt: new Date()
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
    setView('dashboard');
  };

  const handleDeleteLog = (logId: string) => {
    setDeleteId(logId);
  };

  const performDeleteLog = () => {
    if (!deleteId) return;
    const updatedLogs = logs.filter(l => l.id !== deleteId);
    setLogs(updatedLogs);
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
    setDeleteId(null);
  };

  const handleSavePreferences = (newThemeId: string, newReminders: any, newLanguage: Language, newStyle: AppStyle) => {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({
      themeId: newThemeId,
      reminders: newReminders,
      language: newLanguage,
      appStyle: newStyle
    }));
  };

  const handleLoadDemoData = () => {
    setLoading(true);
    const demoLogs: any[] = [];
    const activitiesList = ['Work', 'Meeting', 'Exercise', 'Gaming', 'Reading', 'Socializing', 'Cooking', 'Commute', 'Chores', 'Sleep', 'Music', 'Coding', 'TV/Movies', 'Meditation'];
    const now = new Date();
    
    // Generate ~60 logs over last 60 days
    for (let i = 0; i < 60; i++) {
        const daysAgo = Math.floor(Math.random() * 60);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        date.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60)); // 8am - 10pm
        
        const mood = Math.floor(Math.random() * 5) + 1;
        const energyOptions = ['draining', 'neutral', 'energizing'];
        let energyIndex = 1;
        if (mood <= 2) energyIndex = Math.random() > 0.3 ? 0 : 1;
        if (mood >= 4) energyIndex = Math.random() > 0.3 ? 2 : 1;
        
        const numActs = Math.floor(Math.random() * 3) + 1;
        const acts = [];
        for(let j=0; j<numActs; j++) {
            acts.push(activitiesList[Math.floor(Math.random() * activitiesList.length)]);
        }
        
        demoLogs.push({
            id: 'demo-' + Math.random().toString(36).substr(2, 9),
            mood,
            energy: energyOptions[energyIndex],
            activities: [...new Set(acts)], // unique
            note: 'Demo entry',
            createdAt: date
        });
    }

    const merged = [...demoLogs, ...logs].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
    setLogs(merged);
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(merged));
    setView('history');
    setLoading(false);
  };

  const handleNav = (targetView: typeof view) => {
    setView(targetView);
    setIsMenuOpen(false);
  };

  const MenuButton = ({ icon, label, active, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
        isPixel ? 'rounded-none border-b-2 border-transparent hover:border-white/50 font-pixel-header text-xs tracking-widest' : 'rounded-xl'
      } ${
        active 
          ? `${theme.accentBg}/20 ${theme.accent} ${isPixel ? 'border-b-2 !border-current' : ''}` 
          : `${theme.textSub} hover:bg-white/5 hover:${theme.textMain}`
      }`}
    >
      {icon}
      <span className={isPixel ? 'mt-1' : 'font-medium'}>{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bgApp} ${theme.textMain} flex items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center">
          <Zap className={`h-10 w-10 ${theme.accent} mb-4`} />
          <p className={`${theme.textSub} ${isPixel ? 'font-pixel-body' : ''}`}>Loading Local Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bgApp} ${theme.textMain} ${isPixel ? 'font-pixel-body' : 'font-sans'} ${theme.selection} pb-20 overflow-x-hidden transition-colors duration-500`}>
      
      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsMenuOpen(false)} 
        />
      )}

      {/* Side Menu Drawer */}
      <div className={`fixed inset-y-0 left-0 w-3/4 max-w-xs ${theme.bgCard} ${isPixel ? 'border-r-4' : 'border-r'} ${theme.border} z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <Zap className="text-yellow-400 fill-yellow-400" size={24} />
            <h1 className={`font-bold text-xl tracking-tight ${isPixel ? 'font-pixel-header' : ''}`}>Energy<span className={theme.accent}>Audit</span></h1>
          </div>

          <nav className="space-y-2">
            <MenuButton 
              icon={<LayoutDashboard size={20} />} 
              label={t('dashboard')}
              active={view === 'dashboard'} 
              onClick={() => handleNav('dashboard')} 
            />
            <MenuButton 
              icon={<History size={20} />} 
              label={t('history')}
              active={view === 'history'} 
              onClick={() => handleNav('history')} 
            />
            <MenuButton 
              icon={<Plus size={20} />} 
              label={t('newEntry')}
              active={view === 'log'} 
              onClick={() => handleNav('log')} 
            />
          </nav>
        </div>

        {/* Bottom Section */}
        <div className={`p-4 border-t ${theme.border} bg-black/10`}>
           <MenuButton 
              icon={<Settings size={20} />} 
              label={t('preferences')}
              active={view === 'preferences'} 
              onClick={() => handleNav('preferences')} 
            />
           <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>v{APP_VERSION}</span>
            <span className="flex items-center gap-1 text-emerald-500"><Zap size={10}/> {t('offline')}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className={`${theme.bgCard}/50 backdrop-blur-lg border-b ${isPixel ? 'border-b-4' : ''} ${theme.border} sticky top-0 z-30 px-4 py-3 flex justify-between items-center transition-colors duration-500`}>
        <button 
          onClick={() => setIsMenuOpen(true)}
          className={`flex items-center gap-2 hover:bg-white/5 p-1.5 -ml-1.5 ${isPixel ? 'rounded-none border-2 border-transparent hover:border-white/20' : 'rounded-lg'} transition-colors group`}
        >
          <Menu className={`${theme.textSub} group-hover:${theme.textMain}`} size={24} />
          <div className="flex items-center gap-1">
             <Zap className="text-yellow-400 fill-yellow-400" size={20} />
             <h1 className={`font-bold text-lg tracking-tight hidden sm:block ${isPixel ? 'font-pixel-header text-sm mt-1' : ''}`}>Energy<span className={theme.accent}>Audit</span></h1>
          </div>
        </button>
        {view === 'dashboard' && (
           <button 
             onClick={() => setView('log')}
             className={`${theme.accentBg} hover:opacity-90 text-white px-4 py-1.5 ${isPixel ? 'rounded-none border-b-4 border-black/30 active:border-b-0 active:translate-y-1 font-pixel-header text-xs tracking-wider' : 'rounded-full shadow-lg shadow-black/20'} text-sm font-medium transition-all flex items-center gap-2`}
           >
             <Plus size={16} />
             {t('checkIn')}
           </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto p-4">
        {view === 'dashboard' && <Dashboard stats={stats} logs={logs} onDelete={handleDeleteLog} onViewHistory={() => setView('history')} theme={theme} t={t} lang={language} isPixel={isPixel} />}
        {view === 'log' && <LogEntry onSave={handleSaveLog} onCancel={() => setView('dashboard')} theme={theme} t={t} isPixel={isPixel} />}
        {view === 'history' && <LogHistory logs={logs} onDelete={handleDeleteLog} theme={theme} t={t} lang={language} isPixel={isPixel} />}
        {view === 'preferences' && (
          <Preferences 
            currentTheme={currentThemeId} 
            currentLanguage={language}
            currentStyle={appStyle}
            reminders={reminders}
            onSave={(tId, r, l, s) => {
              setCurrentThemeId(tId);
              setReminders(r);
              setLanguage(l);
              setAppStyle(s);
              handleSavePreferences(tId, r, l, s);
            }}
            onLoadDemoData={handleLoadDemoData}
            theme={theme}
            t={t}
            isPixel={isPixel}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`${theme.bgCard} border ${isPixel ? 'border-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]' : 'rounded-2xl shadow-2xl'} ${theme.border} w-full max-w-sm p-6 scale-100 animate-in zoom-in-95 duration-200`}>
            <div className="flex items-center gap-3 mb-3 text-red-400">
              <div className={`p-2 ${isPixel ? 'rounded-none border-2 border-red-500' : 'bg-red-500/10 rounded-full'}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className={`text-lg font-bold ${theme.textMain} ${isPixel ? 'font-pixel-header' : ''}`}>{t('deleteConfirmTitle')}</h3>
            </div>
            <p className={`${theme.textSub} mb-6 text-sm ml-1`}>
              {t('deleteConfirmMessage')}
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteId(null)}
                className={`px-4 py-2 ${isPixel ? 'rounded-none border-b-4 border-black/30 active:border-b-0 active:translate-y-1 font-pixel-header text-xs' : 'rounded-lg'} ${theme.bgInput} ${theme.textMain} text-sm font-medium hover:opacity-80 transition-opacity`}
              >
                {t('cancel')}
              </button>
              <button 
                onClick={performDeleteLog}
                className={`px-4 py-2 ${isPixel ? 'rounded-none border-b-4 border-black/30 active:border-b-0 active:translate-y-1 font-pixel-header text-xs' : 'rounded-lg shadow-lg shadow-red-500/20'} bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all`}
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
