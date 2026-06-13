export interface UptimeLog {
  id: string;
  url: string;
  status: 'up' | 'down';
  timestamp: string;
  responseTime?: number;
  errorDetails?: string;
  proxyUsed?: string | null;
  isSubLink?: boolean;
  parentUrl?: string;
}

export interface CrawledLink {
  id: string;
  parentUrl: string;
  href: string;
  linkText: string;
  isStatic: boolean;
  isDynamic: boolean;
  lastChecked?: string;
  lastStatus?: 'up' | 'down' | 'pending';
  responseTime?: number;
  isBlocked: boolean;
  depth: number;
}

export interface AppConfig {
  urls: string[];
  proxies: string[];
  email: string;
  intervalSeconds: number;
  blockedLinks: string[];
  crawlEnabled: boolean;
  crawlDepth: number;
}
