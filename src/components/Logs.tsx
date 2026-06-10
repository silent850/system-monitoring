import React, { useEffect, useState } from 'react';
import { api } from '../App';
import { UptimeLog } from '../types';
import { Clock, Search, Trash2, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Logs() {
  const [logs, setLogs] = useState<UptimeLog[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const data = await api.get('/logs');
      setLogs(data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const clearLogs = async () => {
    if (!confirm('Clear all logs?')) return;
    await api.post('/logs/clear');
    await fetchLogs();
  };

  const filteredLogs = logs.filter(l => {
    if (filter === 'Up' && l.status !== 'up') return false;
    if (filter === 'Down' && l.status !== 'down') return false;
    if (filter === 'SubLinks' && !l.isSubLink) return false;
    if (search && !l.url.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['All', 'Up', 'Down', 'SubLinks'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search URLs..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <button onClick={clearLogs} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-800/50 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Status / URL</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Route</th>
              <th className="px-4 py-3 font-medium">Time / Code</th>
              <th className="px-4 py-3 font-medium text-right">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredLogs.map(log => {
              const isUp = log.status === 'up';
              return (
                <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 w-max ${isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {isUp ? 'UP' : 'DOWN'}
                      </div>
                      <div className="max-w-[300px] sm:max-w-md md:max-w-lg lg:max-w-xl truncate font-mono text-slate-200">
                        {log.url}
                        {!isUp && log.errorDetails && (
                          <div className="text-rose-400/80 text-xs mt-1 truncate flex items-center gap-1">
                            <AlertTriangle size={12} /> {log.errorDetails}
                          </div>
                        )}
                        {log.isSubLink && log.parentUrl && (
                          <div className="text-slate-500 text-xs mt-1 truncate">
                            via {log.parentUrl}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    <div className="flex items-center gap-2">
                      {log.isSubLink && <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">SUBLINK</span>}
                      {log.linkType && <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">{log.linkType}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.proxyUsed || 'Direct'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col text-xs">
                      <span className="text-slate-300">{log.responseTime}ms</span>
                      <span className="text-slate-500">HTTP {log.statusCode || '???'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 text-xs">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </td>
                </tr>
              )
            })}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
