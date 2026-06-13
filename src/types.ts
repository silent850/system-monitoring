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
