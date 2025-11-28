
import React, { useMemo } from 'react';
import { 
  BarChart2, Calendar, BatteryCharging, BatteryWarning, ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Theme, Log, Language } from './types';
import { LogItem } from './LogItem';

interface LogHistoryProps {
  logs: Log[];
  onDelete: (id: string) => void;
  theme: Theme;
  t: (key: string) => string;
  lang: Language;
  isPixel: boolean;
}

// --- Helper Functions ---

const getWeekNumber = (d: Date) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return weekNo;
};

const getWeekDateRange = (date: Date, lang: string) => {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay() + 1; 
  const last = first + 6; 
  
  const firstDay = new Date(curr.setDate(first));
  const lastDay = new Date(curr.setDate(last));
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${firstDay.toLocaleDateString(lang, options)} - ${lastDay.toLocaleDateString(lang, options)}`;
};

const getActivityStats = (logs: Log[]) => {
  const activityImpact: Record<string, { count: number; energyScore: number }> = {};
  
  logs.forEach(log => {
    log.activities.forEach(activity => {
      if (!activityImpact[activity]) {
        activityImpact[activity] = { count: 0, energyScore: 0 };
      }
      activityImpact[activity].count += 1;
      const impactVal = log.energy === 'draining' ? -1 : log.energy === 'energizing' ? 1 : 0;
      activityImpact[activity].energyScore += impactVal;
    });
  });

  const sorted = Object.entries(activityImpact).map(([name, data]) => ({
    name,
    netEnergy: data.energyScore,
    count: data.count
  }));

  return {
    energizers: sorted.filter(a => a.netEnergy > 0).sort((a, b) => b.netEnergy - a.netEnergy).slice(0, 3),
    drainers: sorted.filter(a => a.netEnergy < 0).sort((a, b) => a.netEnergy - b.netEnergy).slice(0, 3)
  };
};

export const LogHistory: React.FC<LogHistoryProps> = ({ logs, onDelete, theme, t, lang, isPixel }) => {
  
  const groupedData = useMemo(() => {
    // 1. Sort logs descending
    const sortedLogs = [...logs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 2. Group by Month -> Week
    const months: Record<string, any> = {};

    sortedLogs.forEach(log => {
      const d = new Date(log.createdAt);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      // Use lang for month label
      const monthLabel = d.toLocaleString(lang, { month: 'long', year: 'numeric' });
      
      const weekNum = getWeekNumber(d);
      const weekKey = `${d.getFullYear()}-W${weekNum}`;

      if (!months[monthKey]) {
        months[monthKey] = {
          key: monthKey,
          label: monthLabel,
          logs: [],
          weeks: {}
        };
      }
      
      months[monthKey].logs.push(log);

      if (!months[monthKey].weeks[weekKey]) {
        months[monthKey].weeks[weekKey] = {
          id: weekKey,
          weekLabel: `${t('week')} ${weekNum}`,
          dateRange: getWeekDateRange(d, lang),
          logs: [],
          // Initialize chart data with 0s for mood and energy sums
          chartData: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({
            day, 
            moodSum: 0, 
            energySum: 0,
            count: 0, 
            avgMood: null as number | null,
            avgEnergy: null as number | null
          }))
        };
      }
      
      const weekGroup = months[monthKey].weeks[weekKey];
      weekGroup.logs.push(log);
      
      const dayIndex = d.getDay();
      
      // Mood Accumulation
      weekGroup.chartData[dayIndex].moodSum += log.mood;

      // Energy Accumulation (Map to 1-5 scale to match Mood)
      // Draining = 1, Neutral = 3, Energizing = 5
      let energyVal = 3; 
      if (log.energy === 'draining') energyVal = 1;
      if (log.energy === 'energizing') energyVal = 5;
      
      weekGroup.chartData[dayIndex].energySum += energyVal;
      weekGroup.chartData[dayIndex].count += 1;
    });

    // 3. Process Final Structure
    return Object.values(months).map((month: any) => {
      // Calculate Month Stats
      const stats = getActivityStats(month.logs);

      // Process Weeks
      const weeksArray = Object.values(month.weeks).map((week: any) => {
        // Calculate chart averages
        week.chartData = week.chartData.map((d: any) => ({
          ...d,
          avgMood: d.count > 0 ? parseFloat((d.moodSum / d.count).toFixed(1)) : null,
          avgEnergy: d.count > 0 ? parseFloat((d.energySum / d.count).toFixed(1)) : null
        }));
        return week;
      }).sort((a: any, b: any) => b.id.localeCompare(a.id)); // Sort weeks descending

      return {
        ...month,
        stats,
        weeks: weeksArray
      };
    }); 
  }, [logs, lang, t]);

  if (logs.length === 0) {
    return (
      <div className={`text-center py-20 opacity-50`}>
        <Calendar size={48} className={`mx-auto mb-4 ${theme.textSub}`} />
        <p className={`${theme.textSub} ${isPixel ? 'font-pixel-body' : ''}`}>{t('noLogs')}</p>
      </div>
    );
  }

  const cardStyle = isPixel ? `rounded-none border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]` : `rounded-xl`;
  const labelFont = isPixel ? `font-pixel-header text-[8px] tracking-widest` : `text-xs font-bold uppercase tracking-wider`;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {groupedData.map((month: any) => (
        <div key={month.key} className="relative">
          
          {/* Month Header - Sticky */}
          <div className={`sticky top-[60px] z-20 py-3 ${theme.bgApp}/95 backdrop-blur-md border-b ${theme.border} ${isPixel ? 'border-b-4' : ''} mb-4 flex justify-between items-center`}>
            <h2 className={`text-xl font-bold ${theme.textMain} capitalize ${isPixel ? 'font-pixel-header text-sm' : ''}`}>{month.label}</h2>
            <span className={`text-xs ${theme.textSub} bg-white/5 px-2 py-1 ${isPixel ? 'rounded-none border border-white/20 font-pixel-body' : 'rounded-full'}`}>
              {month.logs.length} {t('entries').toLowerCase()}
            </span>
          </div>

          {/* Monthly Insights (Ranked Lists) */}
          {(month.stats.energizers.length > 0 || month.stats.drainers.length > 0) && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              {/* Energizers */}
              <div className={`${theme.bgCard} p-3 border ${theme.border} ${cardStyle}`}>
                <div className="flex items-center gap-2 mb-2">
                   <BatteryCharging size={14} className="text-emerald-400" />
                   <h4 className={`${theme.textSub} ${labelFont}`}>{t('topEnergizers')}</h4>
                </div>
                {month.stats.energizers.length > 0 ? (
                  <div className="space-y-1">
                    {month.stats.energizers.map((act: any, idx: number) => (
                      <div key={idx} className={`flex justify-between items-center text-xs ${isPixel ? 'font-pixel-body' : ''}`}>
                        <span className={theme.textMain}>{t(act.name) || act.name}</span>
                        <span className={`font-mono text-emerald-400 ${isPixel ? 'font-pixel-header text-[8px]' : ''}`}>+{act.netEnergy}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-[10px] ${theme.textSub} italic`}>No data yet</p>
                )}
              </div>

              {/* Drainers */}
              <div className={`${theme.bgCard} p-3 border ${theme.border} ${cardStyle}`}>
                <div className="flex items-center gap-2 mb-2">
                   <BatteryWarning size={14} className="text-red-400" />
                   <h4 className={`${theme.textSub} ${labelFont}`}>{t('energyVampires')}</h4>
                </div>
                {month.stats.drainers.length > 0 ? (
                  <div className="space-y-1">
                    {month.stats.drainers.map((act: any, idx: number) => (
                      <div key={idx} className={`flex justify-between items-center text-xs ${isPixel ? 'font-pixel-body' : ''}`}>
                        <span className={theme.textMain}>{t(act.name) || act.name}</span>
                        <span className={`font-mono text-red-400 ${isPixel ? 'font-pixel-header text-[8px]' : ''}`}>{act.netEnergy}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-[10px] ${theme.textSub} italic`}>No data yet</p>
                )}
              </div>
            </div>
          )}

          {/* Horizontal Weeks Carousel */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 -mx-4 px-4 no-scrollbar">
            {month.weeks.map((week: any) => (
              <div 
                key={week.id} 
                className={`snap-center shrink-0 w-[85vw] max-w-sm ${theme.bgCard} border ${theme.border} p-4 flex flex-col h-[500px] ${isPixel ? 'rounded-none border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]' : 'rounded-2xl'}`}
              >
                {/* Week Header */}
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className={`text-lg ${theme.textMain} ${isPixel ? 'font-pixel-header text-sm' : 'font-bold'}`}>{week.weekLabel}</h3>
                    <p className={`text-xs ${theme.textSub} ${isPixel ? 'font-pixel-body' : ''}`}>{week.dateRange}</p>
                  </div>
                  <BarChart2 className={theme.accent} size={20} />
                </div>

                {/* Week Chart */}
                <div className="h-40 w-full -ml-2 mb-4 shrink-0 relative">
                   <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={week.chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray={isPixel ? "0 0" : "3 3"} vertical={false} stroke={isPixel ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"} />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: isPixel ? 8 : 10, fontFamily: isPixel ? 'VT323' : 'Inter' }} 
                        interval={0}
                        padding={{ left: 10, right: 10 }}
                      />
                      {/* Fixed domain to keep Mood and Energy scale consistent (1-5) */}
                      <YAxis domain={[1, 5]} hide />
                      
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: isPixel ? '2px solid white' : '1px solid rgba(255,255,255,0.1)', borderRadius: isPixel ? 0 : '8px', fontSize: isPixel ? '14px' : '12px', fontFamily: isPixel ? 'VT323' : 'Inter' }}
                        itemStyle={{ padding: 0 }}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                      />
                      <Legend 
                        iconType={isPixel ? 'square' : 'circle'} 
                        iconSize={isPixel ? 10 : 8}
                        wrapperStyle={{ fontSize: isPixel ? '12px' : '10px', paddingTop: '10px', fontFamily: isPixel ? 'VT323' : 'Inter' }}
                      />
                      
                      <Line 
                        type={isPixel ? "step" : "monotone"}
                        dataKey="avgMood" 
                        name={isPixel ? "HP (Mood)" : "Mood"}
                        stroke={theme.chartLine1} 
                        strokeWidth={isPixel ? 3 : 2}
                        dot={{ r: 3, fill: theme.chartLine1, strokeWidth: 0, shape: isPixel ? "square" : "circle" }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                      <Line 
                        type={isPixel ? "step" : "monotone"}
                        dataKey="avgEnergy" 
                        name={isPixel ? "MP (Energy)" : "Energy"}
                        stroke={theme.chartLine2} 
                        strokeWidth={isPixel ? 3 : 2}
                        strokeDasharray={isPixel ? "0 0" : "4 2"}
                        dot={{ r: 3, fill: theme.chartLine2, strokeWidth: 0, shape: isPixel ? "square" : "circle" }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Scrollable Logs List */}
                <div className={`flex-1 overflow-y-auto pr-1 space-y-3 pt-4 custom-scrollbar ${isPixel ? 'border-t-2 border-dashed border-gray-600' : 'border-t border-dashed border-gray-800/50'}`}>
                  {week.logs.map((log: Log) => (
                    <LogItem key={log.id} log={log} onDelete={onDelete} theme={theme} t={t} lang={lang} isPixel={isPixel} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Horizontal Scroll Hint Overlay (Fade on right) */}
          <div className="absolute right-0 top-60 bottom-20 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none sm:hidden" />

        </div>
      ))}
    </div>
  );
};
