import React, { useEffect, useState } from "react";
import { Activity, ArrowUpCircle, ArrowDownCircle, Clock } from "lucide-react";

export default function PortalDashboard() {
  const [data, setData] = useState({ totalMonitors: 0, upCount: 0, downCount: 0, avgResponseTime: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  const stats = [
    { name: "Total Monitors", value: data.totalMonitors, icon: Activity, color: "text-blue-500" },
    { name: "Monitors Up", value: data.upCount, icon: ArrowUpCircle, color: "text-green-500" },
    { name: "Monitors Down", value: data.downCount, icon: ArrowDownCircle, color: "text-red-500" },
    { name: "Avg Response Time", value: `${data.avgResponseTime}ms`, icon: Clock, color: "text-indigo-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard overview</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.name} className="bg-white dark:bg-slate-900 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-slate-800">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0"><s.icon className={`h-6 w-6 ${s.color}`} /></div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{s.name}</dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{s.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
