export interface AppConfig {
  urls: string[];
  proxies: string[];
  email: string;
  intervalSeconds: number;
}

export type LogStatus = 'up' | 'down';

export interface UptimeLog {
  id: string;
  url: string;
  status: LogStatus;
  timestamp: string;
  responseTime: number; // in milliseconds
  proxyUsed: string | null;
  errorDetails?: string;
}

export interface DashboardStats {
  totalMonitored: number;
  currentlyUp: number;
  currentlyDown: number;
  totalChecks: number;
}
