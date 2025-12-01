
import React, { useState, useEffect } from 'react';
import { Palette, Bell, Plus, Trash2, Clock, Check, Calendar, RefreshCw, Database, BellRing, Globe, Monitor, Gamepad2 } from 'lucide-react';
import { Theme, Reminders, Language, AppStyle } from './types';
import { THEMES } from './constants';

interface PreferencesProps {
  currentTheme: string;
  currentLanguage: Language;
  currentStyle: AppStyle;
  reminders: Reminders;
  onSave: (themeId: string, reminders: Reminders, language: Language, style: AppStyle) => void;
  onLoadDemoData: () => void;
  theme: Theme;
  t: (key: string) => string;
  isPixel: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WORKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKENDS = ['Saturday', 'Sunday'];

const LANGUAGES = [
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { id: 'da', label: 'Dansk', flag: '🇩🇰' },
  { id: 'pl', label: 'Polski', flag: '🇵🇱' }
];

export const Preferences: React.FC<PreferencesProps> = ({ currentTheme, currentLanguage, currentStyle, reminders, onSave, onLoadDemoData, theme, t, isPixel }) => {
  const [workdayTemplate, setWorkdayTemplate] = useState<string[]>(['09:00', '17:00']);
  const [weekendTemplate, setWeekendTemplate] = useState<string[]>(['10:00']);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      new Notification("Notifications Enabled", {
        body: "You will now receive energy check-in reminders!",
        icon: "/icon.png"
      });
    }
  };

  const handleThemeChange = (id: string) => {
    onSave(id, reminders, currentLanguage, currentStyle);
  };

  const handleLanguageChange = (id: Language) => {
    onSave(currentTheme, reminders, id, currentStyle);
  };

  const handleStyleChange = (style: AppStyle) => {
    onSave(currentTheme, reminders, currentLanguage, style);
  };

  // --- Helper Functions for Reminders ---
  const getDayReminders = (day: string): string[] => {
    return reminders[day] || [];
  };

  const updateDayReminders = (day: string, newTimes: string[]) => {
    const sortedTimes = [...newTimes].sort();
    onSave(currentTheme, {
      ...reminders,
      [day]: sortedTimes
    }, currentLanguage, currentStyle);
  };

  const addTime = (day: string) => {
    const current = getDayReminders(day);
    if (current.length < 3) {
      const defaultTime = current.length === 0 ? '09:00' : '12:00';
      updateDayReminders(day, [...current, defaultTime]);
    }
  };

  const removeTime = (day: string, index: number) => {
    const current = getDayReminders(day);
    const updated = current.filter((_, i) => i !== index);
    updateDayReminders(day, updated);
  };

  // --- Bulk Actions ---
  const applyTemplate = (targetDays: string[], templateTimes: string[]) => {
    const newReminders = { ...reminders };
    targetDays.forEach(day => {
      newReminders[day] = [...templateTimes].sort();
    });
    onSave(currentTheme, newReminders, currentLanguage, currentStyle);
  };

  // Helper for template inputs
  const updateTemplate = (
    setTemplate: React.Dispatch<React.SetStateAction<string[]>>, 
    index: number, 
    value: string | null
  ) => {
    setTemplate(prev => {
      if (value === null) {
        return prev.filter((_, i) => i !== index);
      } else {
        const next = [...prev];
        next[index] = value;
        return next;
      }
    });
  };

  const addTemplateTime = (setTemplate: React.Dispatch<React.SetStateAction<string[]>>, current: string[]) => {
    if (current.length < 3) {
      setTemplate([...current, '12:00']);
    }
  };

  // Styles
  const cardStyle = isPixel ? `rounded-none border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]` : `rounded-2xl shadow-lg`;
  const buttonStyle = isPixel ? `rounded-none border-b-4 border-black/30 active:border-b-0 active:translate-y-1 font-pixel-header text-[10px]` : `rounded-xl`;
  const inputStyle = isPixel ? `rounded-none border-2 border-black/30 font-pixel-body` : `rounded-xl border-b`;
  const headerFont = isPixel ? `font-pixel-header tracking-wide text-xs mt-1` : `font-bold`;
  const labelFont = isPixel ? `font-pixel-header text-[10px]` : `font-bold text-xs uppercase tracking-wider`;

  const TemplateEditor = ({ 
    label, 
    times, 
    setTimes, 
    onApply 
  }: { 
    label: string, 
    times: string[], 
    setTimes: React.Dispatch<React.SetStateAction<string[]>>, 
    onApply: () => void 
  }) => (
    <div className={`${theme.bgInput} p-4 border ${theme.border} ${isPixel ? 'rounded-none border-2' : 'rounded-xl'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`${theme.textMain} ${isPixel ? 'font-pixel-header text-xs' : 'text-sm font-bold'}`}>{label}</h3>
        <button 
          onClick={onApply}
          className={`px-2 py-1 bg-white/10 hover:bg-white/20 ${theme.textMain} flex items-center gap-1 transition-colors ${isPixel ? 'text-[10px] font-pixel-body rounded-none border border-white/20' : 'text-xs rounded'}`}
        >
          <Check size={12} /> {t('apply')}
        </button>
      </div>
      <div className="space-y-2">
        {times.map((t, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input 
              type="time" 
              value={t}
              onChange={(e) => updateTemplate(setTimes, idx, e.target.value)}
              className={`bg-transparent ${theme.textMain} text-sm focus:${theme.accentBorder} outline-none w-full ${isPixel ? 'font-pixel-body border-b-2' : 'border-b'}`}
            />
            <button 
              onClick={() => updateTemplate(setTimes, idx, null)}
              className="text-red-400 opacity-50 hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {times.length < 3 && (
          <button 
            onClick={() => addTemplateTime(setTimes, times)}
            className={`${theme.accent} flex items-center gap-1 mt-2 hover:opacity-80 ${isPixel ? 'text-[10px] font-pixel-body' : 'text-xs'}`}
          >
            <Plus size={12} /> {t('addTime')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Master Style Selection */}
      <div className={`${theme.bgCard} border ${theme.border} p-5 ${cardStyle}`}>
        <div className="flex items-center gap-3 mb-4">
          <Gamepad2 className={theme.accent} size={20} />
          <h2 className={`${theme.textMain} ${headerFont}`}>{t('style')}</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleStyleChange('classic')}
            className={`p-4 border transition-all flex flex-col items-center gap-2 ${
               currentStyle === 'classic'
                ? `${theme.accentBg}/20 ${theme.accentBorder} ${theme.textMain} ${isPixel ? 'border-4' : 'border-2'}`
                : `${theme.bgInput} ${theme.border} ${theme.textSub} hover:opacity-80`
            } ${isPixel ? 'rounded-none font-pixel-header text-[10px]' : 'rounded-xl'}`}
          >
            <Monitor size={24} />
            <span>{t('classic')}</span>
          </button>
          <button
            onClick={() => handleStyleChange('pixel')}
            className={`p-4 border transition-all flex flex-col items-center gap-2 ${
               currentStyle === 'pixel'
                ? `${theme.accentBg}/20 ${theme.accentBorder} ${theme.textMain} ${isPixel ? 'border-4' : 'border-2'}`
                : `${theme.bgInput} ${theme.border} ${theme.textSub} hover:opacity-80`
            } ${isPixel ? 'rounded-none font-pixel-header text-[10px]' : 'rounded-xl'}`}
          >
            <Gamepad2 size={24} />
            <span>{t('pixel')}</span>
          </button>
        </div>
      </div>

      {/* Theme Selection */}
      <div className={`${theme.bgCard} border ${theme.border} p-5 ${cardStyle}`}>
        <div className="flex items-center gap-3 mb-4">
          <Palette className={theme.accent} size={20} />
          <h2 className={`${theme.textMain} ${headerFont}`}>{t('appearance')}</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {Object.values(THEMES).map((t) => {
            const baseColor = t.bgApp.replace('bg-', '');
            return (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              className={`relative h-24 overflow-hidden border-2 transition-all group ${
                currentTheme === t.id 
                  ? `${theme.accentBorder} scale-105 z-10 ${theme.accentBorder.replace('border', 'ring')} ${isPixel ? 'border-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]' : 'shadow-xl ring-2 ring-offset-2 ring-offset-black/50'}` 
                  : 'border-transparent opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:scale-105'
              } ${isPixel ? 'rounded-none' : 'rounded-xl'}`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${t.backgroundImage})` }}
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-${baseColor} via-${baseColor}/40 to-transparent`} />
              
              <div className="absolute inset-0 flex items-end p-3 relative z-10">
                <div className="flex justify-between items-center w-full">
                  <span className={`font-semibold ${t.textMain} shadow-black drop-shadow-md ${isPixel ? 'font-pixel-header text-[10px]' : 'text-sm'}`}>{t.name}</span>
                  {currentTheme === t.id && (
                    <div className={`${theme.accentBg} p-1 ${isPixel ? 'rounded-none border border-white' : 'rounded-full shadow-lg'}`}>
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          )})}
        </div>
      </div>

      {/* Language Selection */}
      <div className={`${theme.bgCard} border ${theme.border} p-5 ${cardStyle}`}>
        <div className="flex items-center gap-3 mb-4">
          <Globe className={theme.accent} size={20} />
          <h2 className={`${theme.textMain} ${headerFont}`}>{t('language')}</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => handleLanguageChange(lang.id as Language)}
              className={`p-2 border transition-all flex flex-col items-center gap-1 ${
                currentLanguage === lang.id
                  ? `${theme.accentBg}/20 ${theme.accentBorder} ${theme.textMain} ${isPixel ? 'border-2' : ''}`
                  : `${theme.bgInput} ${theme.border} ${theme.textSub} hover:opacity-80`
              } ${isPixel ? 'rounded-none font-pixel-body' : 'rounded-lg'}`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className={`font-medium ${isPixel ? 'text-[10px]' : 'text-xs'}`}>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div className={`${theme.bgCard} border ${theme.border} p-5 ${cardStyle}`}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <Bell className={theme.accent} size={20} />
            <div>
              <h2 className={`${theme.textMain} ${headerFont}`}>{t('notifications')}</h2>
              {notificationPermission === 'denied' && (
                <p className="text-xs text-red-400 mt-1">Permission denied by browser</p>
              )}
            </div>
          </div>
          {notificationPermission === 'default' && (
            <button 
              onClick={requestNotificationPermission}
              className={`px-3 py-1.5 ${theme.accentBg} text-white flex items-center gap-1 hover:opacity-90 ${buttonStyle}`}
            >
              <BellRing size={12} /> {t('enable')}
            </button>
          )}
        </div>

        {/* Quick Set Templates */}
        <div className="mb-6">
          <h3 className={`${theme.textSub} mb-3 ml-1 ${labelFont}`}>{t('quickTemplates')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <TemplateEditor 
              label={t('workdays')} 
              times={workdayTemplate} 
              setTimes={setWorkdayTemplate}
              onApply={() => applyTemplate(WORKDAYS, workdayTemplate)}
            />
            <TemplateEditor 
              label={t('weekends')} 
              times={weekendTemplate} 
              setTimes={setWeekendTemplate}
              onApply={() => applyTemplate(WEEKENDS, weekendTemplate)}
            />
          </div>
        </div>

        {/* Detailed Schedule */}
        <div>
          <h3 className={`${theme.textSub} mb-3 ml-1 ${labelFont}`}>{t('dailySchedule')}</h3>
          <div className="space-y-3">
            {DAYS.map(day => {
              const times = getDayReminders(day);
              return (
                <div key={day} className={`flex items-center justify-between p-3 ${theme.bgInput} border ${theme.border} ${isPixel ? 'rounded-none border-2' : 'rounded-xl'}`}>
                  <span className={`${theme.textMain} w-24 ${isPixel ? 'font-pixel-body text-sm' : 'text-sm font-medium'}`}>{day}</span>
                  
                  <div className="flex-1 flex flex-wrap gap-2 justify-end">
                    {times.map((time, idx) => (
                      <div key={idx} className={`relative group px-2 py-1 bg-black/20 border ${theme.border} flex items-center gap-1 ${isPixel ? 'rounded-none border-2' : 'rounded'}`}>
                        <Clock size={10} className={theme.textSub} />
                        <span className={`text-xs ${theme.textMain} ${isPixel ? 'font-pixel-body' : ''}`}>{time}</span>
                        <button 
                          onClick={() => removeTime(day, idx)}
                          className="ml-1 text-red-400 hover:text-red-300 opacity-50 group-hover:opacity-100"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                    {times.length < 3 ? (
                      <button 
                        onClick={() => addTime(day)}
                        className={`p-1.5 bg-black/20 ${theme.textSub} hover:${theme.textMain} hover:bg-white/10 transition-colors ${isPixel ? 'rounded-none' : 'rounded'}`}
                      >
                        <Plus size={14} />
                      </button>
                    ) : (
                      <span className={`text-[10px] ${theme.textSub} self-center opacity-50`}>Max 3</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className={`${theme.bgCard} border ${theme.border} p-5 ${cardStyle}`}>
        <div className="flex items-center gap-3 mb-4">
          <Database className={theme.accent} size={20} />
          <h2 className={`${theme.textMain} ${headerFont}`}>{t('data')}</h2>
        </div>
        
        <button 
          onClick={onLoadDemoData}
          className={`w-full py-3 border border-dashed ${theme.border} ${theme.textSub} hover:${theme.textMain} hover:bg-white/5 flex items-center justify-center gap-2 transition-all ${isPixel ? 'rounded-none font-pixel-body border-2 border-dashed' : 'rounded-xl'}`}
        >
          <RefreshCw size={16} /> {t('generateData')} (2 Months)
        </button>
      </div>

    </div>
  );
};
