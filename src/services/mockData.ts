export interface AnalyticsData {
  name: string;
  revenue: number;
  sessions: number;
}

export interface ConsultingSession {
  id: number;
  client: string;
  type: string;
  date: string;
  status: 'Planlandı' | 'Tamamlandı' | 'Beklemede';
  time: string;
}

export const MOCK_ANALYTICS_DATA: AnalyticsData[] = [
  { name: 'Oca', revenue: 4000, sessions: 2400 },
  { name: 'Şub', revenue: 3000, sessions: 1398 },
  { name: 'Mar', revenue: 2000, sessions: 9800 },
  { name: 'Nis', revenue: 2780, sessions: 3908 },
  { name: 'May', revenue: 1890, sessions: 4800 },
  { name: 'Haz', revenue: 2390, sessions: 3800 },
  { name: 'Tem', revenue: 3490, sessions: 4300 },
];

export const MOCK_SESSIONS: ConsultingSession[] = [
  { id: 1, client: 'Acme Corp', type: 'Stratejik Planlama', date: '2023-11-14', status: 'Planlandı', time: '14:00' },
  { id: 2, client: 'Global Tech', type: 'Dijital Dönüşüm', date: '2023-11-15', status: 'Tamamlandı', time: '10:00' },
  { id: 3, client: 'Bosphorus Retail', type: 'Kurumsal Etkinlik', date: '2023-11-18', status: 'Beklemede', time: '16:30' },
];

// Service simulation
export const MockService = {
  getAnalytics: (): Promise<AnalyticsData[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_ANALYTICS_DATA), 500);
    });
  },
  getSessions: (): Promise<ConsultingSession[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_SESSIONS), 500);
    });
  }
};
