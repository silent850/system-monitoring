export interface AppConfig {
  urls: string[];
  proxies: string[];
  email: string;
  intervalSeconds: number;
  crawlEnabled: boolean;
  crawlDepth: number;
  blockedLinks: string[];
  userAgent: string;
  viewportWidth: number;
  viewportHeight: number;
}

export interface UptimeLog {
  id: string;
  url: string;
  status: 'up' | 'down';
  timestamp: string;
  responseTime: number;
  proxyUsed: string | null;
  errorDetails?: string;
  isSubLink?: boolean;
  parentUrl?: string;
  linkType?: string;
  screenshotBase64?: string;
  statusCode?: number;
  pageTitle?: string;
}

export interface CrawledLink {
  id: string;
  parentUrl: string;
  href: string;
  linkText: string;
  linkType: 'anchor' | 'button' | 'image' | 'form' | 'onclick' | 'srcset' | 'area';
  isStatic: boolean;
  isDynamic: boolean;
  isExternal: boolean;
  isBlocked: boolean;
  lastStatus: 'up' | 'down' | 'pending' | 'skipped';
  lastChecked?: string;
  responseTime?: number;
  statusCode?: number;
  depth: number;
  errorDetails?: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
}
