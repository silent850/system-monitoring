import React, { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export default function PortalMonitors() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/monitors")
      .then(r => r.json())
      .then(data => { setMonitors(data); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your Monitors</h1>
      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800">
        {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Checked</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
              {monitors.map(m => (
                <tr key={m.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      m.status === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      m.status === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {m.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{m.url}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {m.lastChecked ? new Date(m.lastChecked).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center"><Activity className="mr-1.5 h-4 w-4 text-gray-400" />{m.avgLoadTime || '--'} ms</div>
                  </td>
                </tr>
              ))}
              {monitors.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No monitors.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
