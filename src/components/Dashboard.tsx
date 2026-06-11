import React, { useEffect, useState } from 'react';
import { api } from '../App';
import { UptimeLog, AppConfig } from '../types';
import { Globe, ArrowUpCircle, ArrowDownCircle, Clock, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Dashboard() {
  const [logs, setLogs] = useState<UptimeLog[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsData, configData, statusData] = await Promise.all([
          api.get('/logs'),
          api.get('/config'),
          api.get('/status')
        ]);
        setLogs(logsData || []);
        setConfig(configData);
        setStatus(statusData);
      } catch (e) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ticker = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const monitoredUrls = config?.urls || [];
  
  // Get latest log for each url
  const latestLogs = new Map<string, UptimeLog>();
  logs.filter(l => !l.isSubLink).forEach(log => {
    if (!latestLogs.has(log.url)) {
      latestLogs.set(log.url, log);
    }
  });

  const upCount = Array.from(latestLogs.values()).filter(l => l.status === 'up').length;
  const downCount = Array.from(latestLogs.values()).filter(l => l.status === 'down').length;
  const avgResponse = latestLogs.size > 0 
    ? Math.round(Array.from(latestLogs.values()).reduce((acc, l) => acc + l.responseTime, 0) / latestLogs.size) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Monitored', value: monitoredUrls.length, icon: <Globe className="text-blue-400" /> },
          { label: 'Currently Up', value: upCount, icon: <ArrowUpCircle className="text-emerald-400" /> },
          { label: 'Currently Down', value: downCount, icon: <ArrowDownCircle className="text-rose-400" /> },
          { label: 'Avg Response', value: `${avgResponse}ms`, icon: <Clock className="text-indigo-400" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm font-medium text-slate-400">
              {stat.label}
              {stat.icon}
            </div>
            <div className="text-3xl font-semibold text-slate-100">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-medium">Live Status</h2>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {status?.isRunning && <Activity size={14} className="animate-pulse text-indigo-400" />}
            {status?.isRunning ? 'Checking now...' : status?.nextCheckTime ? `Next check in ${Math.max(0, Math.round((status.nextCheckTime - now)/1000))}s` : 'Waiting for connection...'}
          </div>
        </div>
        <div className="divide-y divide-slate-800/50">
          {monitoredUrls.map((url) => {
            const log = latestLogs.get(url);
            const isUp = log?.status === 'up';
            return (
              <div key={url} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 ${isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {isUp ? 'UP' : log ? 'DOWN' : 'PENDING'}
                  </div>
                  <div>
                    <div className="font-mono text-sm break-all text-slate-200">{url}</div>
                    <div className="text-xs text-slate-500 mt-1">{log?.pageTitle || 'Waiting for initial check...'}</div>
                  </div>
                </div>
                {log && (
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      {log.responseTime}ms
                    </div>
                    <div className="text-slate-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {monitoredUrls.length === 0 && (
            <div className="p-8 text-center text-slate-500">No URLs configured. Add targets in Settings.</div>
          )}
        </div>
      </div>
    </div>
  );
}
