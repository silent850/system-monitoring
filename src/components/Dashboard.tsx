import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Activity, Globe, RefreshCcw } from 'lucide-react';
import { UptimeLog } from '../types';

export default function Dashboard({ logs }: { logs: UptimeLog[] }) {
  // Extract unique URLs and their latest status
  const urlStatusMap = new Map<string, UptimeLog>();
  
  logs.forEach(log => {
    if (!urlStatusMap.has(log.url)) {
      urlStatusMap.set(log.url, log);
    }
  });

  const uniqueUrls = Array.from(urlStatusMap.values());
  const currentlyUp = uniqueUrls.filter(u => u.status === 'up').length;
  const currentlyDown = uniqueUrls.filter(u => u.status === 'down').length;

  // Calculate average response time
  const avgResponseTime = logs.length > 0 
    ? Math.round(logs.reduce((acc, log) => acc + log.responseTime, 0) / logs.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-tight text-white">System Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Monitored URLs" 
          value={uniqueUrls.length.toString()} 
          icon={<Globe className="h-5 w-5 text-indigo-400" />} 
        />
        <StatCard 
          title="Currently Up" 
          value={currentlyUp.toString()} 
          icon={<ShieldCheck className="h-5 w-5 text-emerald-400" />} 
        />
        <StatCard 
          title="Currently Down" 
          value={currentlyDown.toString()} 
          icon={<ShieldAlert className="h-5 w-5 text-rose-400" />} 
        />
        <StatCard 
          title="Avg Response" 
          value={`${avgResponseTime}ms`} 
          icon={<Activity className="h-5 w-5 text-cyan-400" />} 
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Latest Status by URL</h2>
        </div>
        <div className="divide-y divide-slate-800/50">
          {uniqueUrls.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              No URLs currently monitored or awaiting first check.
            </div>
          ) : (
            uniqueUrls.map((site) => (
              <div key={site.url} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
                    site.status === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {site.status === 'up' ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-200">{site.url}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">Checked {new Date(site.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      site.status === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {site.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-1">{site.responseTime}ms</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
