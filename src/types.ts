export type Monitor = {
  id: string | number;
  name: string;
  url: string;
  type: "site" | "page" | "api";
  status: "up" | "down" | "paused";
  lastChecked: number;
  avgLoadTime: number;
  company: string;
};

export type LogEntry = {
  id: string | number;
  monitorId: string | number;
  timestamp: number;
  status: "up" | "down" | "error";
  loadTime: number;
};

export type SessionStep = {
  id: string | number;
  sessionId: string | number;
  timestamp: number;
  message: string;
  status: "ok" | "info" | "fail";
  durationMs?: number;
};

export type DetectedLink = {
  id: string | number;
  sessionId: string | number;
  url: string;
  elementType: "a" | "button" | "img";
  elementLabel?: string;
  httpStatus?: number;
  loadTimeMs?: number;
  state: "discovered" | "ignored" | "blocked";
};

export type Session = {
  id: string | number;
  monitorId: string | number;
  startedAt: number;
  completedAt?: number;
  status: "running" | "passed" | "failed";
  proxyUsed?: string;
  userAgent?: string;
  simulateHuman: boolean;
  humanProfile?: "none" | "light" | "moderate";
  crawlerDepth: number;
  maxLinks: number;
  followExternal: boolean;
  totalDuration?: number;
  linksFound: number;
  linksFailed: number;
};
