
import React, { useState } from 'react';
import { 
  Smile, Meh, Frown, 
  Battery, BatteryCharging, BatteryWarning, 
  X, Check, Plus, Tag,
  Briefcase, Users, Dumbbell, Gamepad2, BookOpen, 
  MessageCircle, Utensils, Car, Home, Moon, 
  Music, Code, Tv, Brain
} from 'lucide-react';
import { Theme } from './types';

interface LogEntryProps {
  onSave: (log: any) => void;
  onCancel: () => void;
  theme: Theme;
  t: (key: string) => string;
  isPixel: boolean;
}

const PRESET_ACTIVITIES = [
  { id: 'Work', icon: Briefcase },
  { id: 'Meeting', icon: Users },
  { id: 'Exercise', icon: Dumbbell },
  { id: 'Gaming', icon: Gamepad2 },
  { id: 'Reading', icon: BookOpen },
  { id: 'Socializing', icon: MessageCircle },
  { id: 'Cooking', icon: Utensils },
  { id: 'Commute', icon: Car },
  { id: 'Chores', icon: Home },
  { id: 'Sleep', icon: Moon },
  { id: 'Music', icon: Music },
  { id: 'Coding', icon: Code },
  { id: 'TV/Movies', icon: Tv },
  { id: 'Meditation', icon: Brain }
];

export const LogEntry: React.FC<LogEntryProps> = ({ onSave, onCancel, theme, t, isPixel }) => {
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState<'draining' | 'neutral' | 'energizing'>('neutral');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      mood,
      energy,
      activities: selectedActivities,
      note,
    });
  };

  const toggleActivity = (act: string) => {
    setSelectedActivities(prev => 
      prev.includes(act) ? prev.filter(a => a !== act) : [...prev, act]
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (!tag) {
       setIsAddingTag(false);
       return;
    }

    // Check for case-insensitive match with presets to avoid duplicates
    const presetMatch = PRESET_ACTIVITIES.find(p => p.id.toLowerCase() === tag.toLowerCase());
    const finalTag = presetMatch ? presetMatch.id : tag;

    if (!selectedActivities.includes(finalTag)) {
      setSelectedActivities(prev => [...prev, finalTag]);
    }
    setCustomTag('');
    setIsAddingTag(false);
  };

  // Filter out activities that are not in presets so we can render them separately
  const customSelectedActivities = selectedActivities.filter(a => !PRESET_ACTIVITIES.some(p => p.id === a));

  // Styles
  const labelFont = isPixel ? `font-pixel-header text-xs tracking-wide` : `text-sm font-semibold uppercase tracking-wider`;
  const buttonStyle = isPixel ? `rounded-none border-b-4 border-black/30 active:border-b-0 active:translate-y-1 active:mt-1` : `rounded-xl`;
  const activityStyle = isPixel ? `rounded-none border-2` : `rounded-lg border`;
  const inputStyle = isPixel ? `rounded-none border-2 border-black/30 font-pixel-body` : `rounded-xl border`;

  const getMoodStyles = (val: number) => {
    const isSelected = mood === val;
    let base = isSelected ? `border-2 border-transparent text-white shadow-lg ${isPixel ? 'shadow-none border-4 border-black' : ''}` : `${theme.bgCard} ${theme.textSub} border-2 border-transparent hover:bg-white/5`;
    
    // Pixel override for border colors on unselected
    if (!isSelected && isPixel) base = `${theme.bgCard} ${theme.textSub} border-2 border-white/10 hover:border-white/30`;

    switch (val) {
      case 1: // Terrible - Red
        return isSelected ? `${base} bg-red-500` : `${base} text-red-500`;
      case 2: // Bad - Orange
        return isSelected ? `${base} bg-orange-500` : `${base} text-orange-500`;
      case 3: // Neutral - Yellow
        return isSelected ? `${base} bg-yellow-500` : `${base} text-yellow-400`;
      case 4: // Good - Lime
        return isSelected ? `${base} bg-lime-500` : `${base} text-lime-400`;
      case 5: // Great - Emerald
        return isSelected ? `${base} bg-emerald-500` : `${base} text-emerald-400`;
      default: return base;
    }
  };

  return (
    <div className={`h-full flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl ${theme.textMain} ${isPixel ? 'font-pixel-header' : 'font-bold'}`}>{t('newEntry')}</h2>
        <button onClick={onCancel} className={`p-2 ${theme.bgInput} ${theme.textSub} hover:${theme.textMain} ${isPixel ? 'rounded-none' : 'rounded-full'}`}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar pb-20 space-y-8">
        
        {/* Mood Section */}
        <div className="space-y-3">
          <label className={`${theme.textSub} ${labelFont}`}>{t('howFeeling')}</label>
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setMood(val)}
                className={`flex-1 h-14 flex items-center justify-center transition-all ${
                  mood === val ? 'scale-105 z-10' : ''
                } ${getMoodStyles(val)} ${buttonStyle}`}
              >
                {val === 1 && <Frown size={28} strokeWidth={isPixel ? 3 : 2.5} />}
                {val === 2 && <Frown size={28} strokeWidth={2} className="opacity-80" />}
                {val === 3 && <Meh size={28} strokeWidth={2} />}
                {val === 4 && <Smile size={28} strokeWidth={2} className="opacity-80" />}
                {val === 5 && <Smile size={28} strokeWidth={isPixel ? 3 : 2.5} />}
              </button>
            ))}
          </div>
          <div className={`flex justify-between text-[10px] uppercase tracking-wider px-1 opacity-60 ${isPixel ? 'font-pixel-header' : 'font-medium'}`}>
            <span className="text-red-400">{t('terrible')}</span>
            <span className="text-emerald-400">{t('great')}</span>
          </div>
        </div>

        {/* Energy Section */}
        <div className="space-y-3">
          <label className={`${theme.textSub} ${labelFont}`}>{t('energyImpact')}</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'draining', label: t('draining'), icon: BatteryWarning, color: 'text-red-400', activeBg: 'bg-red-500' },
              { id: 'neutral', label: t('neutral'), icon: Battery, color: 'text-gray-400', activeBg: 'bg-slate-500' },
              { id: 'energizing', label: t('energizing'), icon: BatteryCharging, color: 'text-emerald-400', activeBg: 'bg-emerald-500' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEnergy(opt.id as any)}
                className={`flex flex-col items-center gap-2 p-3 transition-all ${buttonStyle} ${
                  energy === opt.id 
                    ? `${opt.activeBg} text-white border-transparent ${isPixel ? 'border-4 border-black' : 'shadow-lg'}` 
                    : `${theme.bgCard} ${theme.textSub} ${theme.border} border ${isPixel ? 'border-2' : ''} hover:bg-white/5`
                }`}
              >
                <opt.icon size={24} className={energy === opt.id ? 'text-white' : opt.color} />
                <span className={`text-xs ${isPixel ? 'font-pixel-header text-[8px]' : 'font-medium'}`}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Activities Section */}
        <div className="space-y-3">
          <label className={`${theme.textSub} ${labelFont}`}>{t('activities')}</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_ACTIVITIES.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => toggleActivity(preset.id)}
                className={`px-3 py-2 text-sm transition-all flex items-center gap-2 ${activityStyle} ${
                  selectedActivities.includes(preset.id)
                    ? `${theme.accentBg} ${theme.accentBorder} text-white`
                    : `${theme.bgCard} ${theme.textSub} ${theme.border} hover:border-opacity-50`
                } ${isPixel ? 'font-pixel-body' : ''}`}
              >
                <preset.icon size={16} />
                {t(preset.id) || preset.id}
              </button>
            ))}

            {/* Custom Activities Display */}
            {customSelectedActivities.map(act => (
              <button
                key={act}
                type="button"
                onClick={() => toggleActivity(act)}
                className={`px-3 py-2 text-sm transition-all ${theme.accentBg} ${theme.accentBorder} text-white flex items-center gap-2 ${activityStyle} ${isPixel ? 'font-pixel-body' : ''}`}
              >
                <Tag size={16} />
                {act}
              </button>
            ))}
            
            {!isAddingTag ? (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className={`px-3 py-2 text-sm border-dashed ${theme.border} ${theme.textSub} hover:${theme.textMain} flex items-center gap-2 ${activityStyle} ${isPixel ? 'font-pixel-body' : ''}`}
              >
                <Plus size={16} /> {t('customTag')}
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className={`bg-transparent border-b ${theme.accentBorder} ${theme.textMain} text-sm px-1 py-0.5 outline-none w-24 ${isPixel ? 'font-pixel-body border-b-2' : ''}`}
                  placeholder="Tag name"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                  onBlur={() => { if(!customTag) setIsAddingTag(false); }}
                />
                <button type="button" onClick={addCustomTag} className={`${theme.accent} hover:opacity-80`}>
                  <Check size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Note Section */}
        <div className="space-y-3">
          <label className={`${theme.textSub} ${labelFont}`}>{t('notes')}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`w-full h-24 ${theme.bgInput} ${theme.textMain} ${theme.border} p-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none ${inputStyle}`}
            placeholder=""
          />
        </div>

      </form>

      {/* Footer Actions */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t ${theme.bgApp} to-transparent backdrop-blur-xs`}>
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleSubmit}
            className={`w-full py-4 ${theme.accentBg} text-white font-bold text-lg hover:opacity-90 transition-transform active:scale-95 flex items-center justify-center gap-2 ${isPixel ? 'rounded-none border-b-4 border-black/30 font-pixel-header text-sm tracking-wide' : 'rounded-xl shadow-lg'}`}
          >
            <Check size={20} /> {t('saveEntry')}
          </button>
        </div>
      </div>
    </div>
  );
};
