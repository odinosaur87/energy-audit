
import React from 'react';
import { 
  Smile, Frown, Meh, 
  Battery, BatteryCharging, BatteryWarning,
  Trash2, Clock
} from 'lucide-react';
import { Log, Theme, Language } from './types';

interface LogItemProps {
  log: Log;
  onDelete: (id: string) => void;
  theme: Theme;
  lang: Language;
  t: (key: string) => string;
  isPixel?: boolean;
}

const MoodIcon = ({ score, size = 20 }: { score: number; size?: number }) => {
  if (score >= 4) return <Smile size={size} className="text-emerald-400" />;
  if (score === 3) return <Meh size={size} className="text-yellow-400" />;
  return <Frown size={size} className="text-red-400" />;
};

const EnergyIcon = ({ impact, size = 16 }: { impact: string; size?: number }) => {
  if (impact === 'energizing') return <BatteryCharging size={size} className="text-emerald-500" />;
  if (impact === 'draining') return <BatteryWarning size={size} className="text-red-500" />;
  return <Battery size={size} className="text-slate-400" />;
};

export const LogItem: React.FC<LogItemProps> = ({ log, onDelete, theme, lang, t, isPixel }) => {
  const timeString = log.createdAt.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  const dateString = log.createdAt.toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' });

  const getImpactStyles = () => {
    switch (log.energy) {
      case 'energizing':
        return `border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-transparent hover:border-emerald-500/50`;
      case 'draining':
        return `border-red-500/30 bg-gradient-to-r from-red-500/5 to-transparent hover:border-red-500/50`;
      case 'neutral':
      default:
        // Adding a subtle slate gradient for neutral to maintain design consistency
        return `${theme.border} bg-gradient-to-r from-slate-500/5 to-transparent hover:border-slate-500/50`;
    }
  };

  const cardStyle = isPixel 
    ? `rounded-none border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]` 
    : `rounded-2xl shadow-sm`;
  
  const chipStyle = isPixel ? `rounded-none border border-white/20` : `rounded-md`;
  const textStyle = isPixel ? `font-pixel-body` : ``;

  return (
    <div className={`group relative ${theme.bgCard} border p-4 transition-all ${cardStyle} ${getImpactStyles()}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-black/20 ${theme.border} border ${isPixel ? 'rounded-none' : 'rounded-xl'}`}>
            <MoodIcon score={log.mood} size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${theme.textMain} capitalize ${isPixel ? 'font-pixel-header text-xs tracking-wide' : ''}`}>{dateString}</span>
              <span className={`text-xs ${theme.textSub} flex items-center gap-1 ${textStyle}`}>
                <Clock size={10} /> {timeString}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
               <EnergyIcon impact={log.energy} size={14} />
               <span className={`text-xs capitalize ${textStyle} ${
                  log.energy === 'energizing' ? 'text-emerald-400' :
                  log.energy === 'draining' ? 'text-red-400' :
                  theme.textSub
               }`}>{t(log.energy)}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => onDelete(log.id)}
          className={`opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-red-400 transition-all ${isPixel ? 'rounded-none' : 'rounded-full'}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {log.activities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 mb-2">
          {log.activities.map((tag, i) => (
            <span key={i} className={`text-xs px-2.5 py-1 ${theme.bgInput} ${theme.textSub} border ${theme.border} ${chipStyle} ${textStyle}`}>
              {t(tag) || tag}
            </span>
          ))}
        </div>
      )}

      {log.note && (
        <p className={`text-sm ${theme.textSub} italic mt-2 border-l-2 ${theme.border} pl-3 ${textStyle}`}>
          "{log.note}"
        </p>
      )}
    </div>
  );
};
