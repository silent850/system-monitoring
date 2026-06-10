export interface AppConfig {
  urls: string[];
  proxies: string[];
  email: string;
  intervalSeconds: number;
  blockedLinks: string[];
  crawlEnabled: boolean;
  crawlDepth: number;
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
  isSubLink?: boolean;
  parentUrl?: string; // Root URL to which this sublink belongs
}

export interface CrawledLink {
  id: string;
  parentUrl: string;
  href: string;
  linkText: string;
  isStatic: boolean;
  isDynamic: boolean;
  isBlocked: boolean;
  lastStatus: 'up' | 'down' | 'pending' | 'skipped';
  lastChecked?: string;
  responseTime?: number;
  depth: number;
}

export interface DashboardStats {
  totalMonitored: number;
  currentlyUp: number;
  currentlyDown: number;
  totalChecks: number;
}
