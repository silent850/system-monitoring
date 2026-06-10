import { formatDistanceToNow } from 'date-fns';
import { ShieldCheck, ShieldAlert, Wifi, Globe } from 'lucide-react';
import { UptimeLog } from '../types';

export default function Logs({ logs }: { logs: UptimeLog[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-tight text-white">Historical Logs</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">URL Initiated</th>
                <th className="px-6 py-4">Response Time</th>
                <th className="px-6 py-4">Network Route</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No logs recorded yet. Waiting for first check interval.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         {log.status === 'up' ? (
                            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md text-xs font-medium border border-emerald-500/20">
                              <ShieldCheck className="w-3.5 h-3.5" /> UP
                            </span>
                         ) : (
                            <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md text-xs font-medium border border-rose-500/20">
                              <ShieldAlert className="w-3.5 h-3.5" /> DOWN
                            </span>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-200 font-medium">{log.url}</span>
                      {log.errorDetails && (
                        <p className="text-xs text-rose-400 mt-1 line-clamp-1" title={log.errorDetails}>
                          {log.errorDetails}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {log.responseTime}ms
                    </td>
                    <td className="px-6 py-4">
                      {log.proxyUsed ? (
                        <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-mono">
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[150px]" title={log.proxyUsed}>{log.proxyUsed}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono">
                          <Wifi className="w-3.5 h-3.5 shrink-0" />
                          Direct
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
