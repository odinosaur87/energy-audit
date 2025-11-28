
export type Language = 'en' | 'es' | 'fr' | 'de' | 'da' | 'pl';
export type AppStyle = 'classic' | 'pixel';

export interface Theme {
  id: string;
  name: string;
  bgApp: string;
  bgCard: string;
  bgInput: string;
  border: string;
  textMain: string;
  textSub: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentHover: string;
  selection: string;
  gradient: string;
  chartLine1: string;
  chartLine2: string;
  backgroundImage: string;
}

export interface Log {
  id: string;
  mood: number; // 1-5
  energy: 'draining' | 'neutral' | 'energizing';
  activities: string[];
  note: string;
  createdAt: Date;
}

export interface ActivityStat {
  name: string;
  avgMood: number;
  netEnergy: number;
  count: number;
}

export interface Stats {
  recentLogs: Log[];
  energizers: ActivityStat[];
  drainers: ActivityStat[];
  averageMood: string | number;
}

export interface Reminders {
  [key: string]: string[]; // Day name -> Array of times
}
