
import React from 'react';
import { 
  Activity, ArrowRight, BatteryCharging, BatteryWarning
} from 'lucide-react';
import { Stats, Log, Theme, Language } from './types';
import { LogItem } from './LogItem';

interface DashboardProps {
  stats: Stats;
  logs: Log[];
  onDelete: (id: string) => void;
  onViewHistory: () => void;
  theme: Theme;
  t: (key: string) => string;
  lang: Language;
  isPixel: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, logs, onDelete, onViewHistory, theme, t, lang, isPixel }) => {
  const recentDisplayLogs = logs.slice(0, 5);

  const cardStyle = isPixel ? `rounded-none border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]` : `rounded-2xl shadow-lg shadow-black/5`;
  const labelFont = isPixel ? `font-pixel-header text-[8px] tracking-widest` : `text-[10px] uppercase tracking-wider font-bold`;
  const numberFont = isPixel ? `font-pixel-header` : `font-bold`;
  const chipStyle = isPixel ? `rounded-none border-2` : `rounded-lg`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`${theme.bgCard} border ${theme.border} p-4 ${cardStyle}`}>
          <p className={`${theme.textSub} ${labelFont} mb-2 opacity-70`}>{t('avgMood')}</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl ${numberFont} ${theme.textMain}`}>{stats.averageMood}</span>
            <span className={`${theme.textSub} text-sm mb-1 ${isPixel ? 'font-pixel-body' : ''}`}>/ 5.0</span>
          </div>
        </div>
        <div className={`${theme.bgCard} border ${theme.border} p-4 ${cardStyle}`}>
          <p className={`${theme.textSub} ${labelFont} mb-2 opacity-70`}>{t('entries')}</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl ${numberFont} ${theme.textMain}`}>{stats.recentLogs.length}</span>
            <span className={`${theme.textSub} text-sm mb-1 ${isPixel ? 'font-pixel-body' : ''}`}>{t('thisWeek')}</span>
          </div>
        </div>
      </div>

      {/* Weekly Energy Summary (Only shows if data exists) */}
      {(stats.energizers.length > 0 || stats.drainers.length > 0) && (
        <div className="grid grid-cols-1 gap-4">
          {stats.energizers.length > 0 && (
            <div className={`bg-emerald-950/20 border border-emerald-900/30 p-4 ${cardStyle} ${isPixel ? 'border-4' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 bg-emerald-900/40 ${isPixel ? 'rounded-none border border-emerald-500/50' : 'rounded-lg'}`}>
                  <BatteryCharging className="text-emerald-400" size={16} />
                </div>
                <h3 className={`text-emerald-100 ${isPixel ? 'font-pixel-header text-xs' : 'font-semibold text-sm'}`}>{t('topEnergizers')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.energizers.slice(0, 3).map((item, idx) => (
                  <div key={idx} className={`bg-emerald-900/30 text-emerald-200 text-xs px-3 py-1.5 flex items-center gap-2 border border-emerald-800/30 ${chipStyle} ${isPixel ? 'font-pixel-body' : 'font-medium'}`}>
                    {t(item.name) || item.name}
                    <span className={`bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 ${isPixel ? 'font-pixel-header rounded-none' : 'font-bold rounded'}`}>+{item.netEnergy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.drainers.length > 0 && (
            <div className={`bg-red-950/20 border border-red-900/30 p-4 ${cardStyle} ${isPixel ? 'border-4' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                 <div className={`p-1.5 bg-red-900/40 ${isPixel ? 'rounded-none border border-red-500/50' : 'rounded-lg'}`}>
                  <BatteryWarning className="text-red-400" size={16} />
                </div>
                <h3 className={`text-red-100 ${isPixel ? 'font-pixel-header text-xs' : 'font-semibold text-sm'}`}>{t('energyVampires')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.drainers.slice(0, 3).map((item, idx) => (
                  <div key={idx} className={`bg-red-900/30 text-red-200 text-xs px-3 py-1.5 flex items-center gap-2 border border-red-800/30 ${chipStyle} ${isPixel ? 'font-pixel-body' : 'font-medium'}`}>
                    {t(item.name) || item.name}
                    <span className={`bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-300 ${isPixel ? 'font-pixel-header rounded-none' : 'font-bold rounded'}`}>{item.netEnergy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent History List (Always Visible) */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className={`${theme.textSub} ${labelFont} ml-1`}>{t('latestActivity')}</h3>
          <button onClick={onViewHistory} className={`${theme.accent} text-xs font-medium hover:opacity-80 flex items-center gap-1 bg-white/5 px-3 py-1 ${isPixel ? 'rounded-none border border-current font-pixel-body' : 'rounded-full'}`}>
            {t('viewAll')} <ArrowRight size={12} />
          </button>
        </div>
        
        {logs.length === 0 ? (
          <div className={`text-center py-12 ${theme.bgCard} ${theme.border} ${isPixel ? 'border-4 border-dashed rounded-none' : 'rounded-2xl border border-dashed'}`}>
            <Activity className={`mx-auto ${theme.textSub} mb-2 opacity-50`} size={32} />
            <p className={`${theme.textSub} ${isPixel ? 'font-pixel-body' : ''}`}>{t('noLogs')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentDisplayLogs.map(log => (
              <LogItem key={log.id} log={log} onDelete={onDelete} theme={theme} lang={lang} t={t} isPixel={isPixel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
