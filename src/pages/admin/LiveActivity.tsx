import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { TerminalSquare, Play, Pause, Camera, Copy, Loader, Clock, ChevronDown, ChevronRight, Activity, Globe } from "lucide-react";
import type { Session, Monitor } from "../../types";

export default function LiveActivity() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [monitors, setMonitors] = useState<Record<string, Monitor>>({});
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState('');
  const [toast, setToast] = useState<{message: string} | null>(null);
  
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const showToast = (message: string) => {
    setToast({ message });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleRow = (id: string | number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    fetch("/api/monitors")
      .then(r => r.json())
      .then(data => {
        if (!data.error && Array.isArray(data)) {
          const map: Record<string, Monitor> = {};
          data.forEach(m => map[m.id] = m);
          setMonitors(map);
        }
      });
  }, []);

  useEffect(() => {
    if (paused) return;
    
    const fetchObj = () => {
      fetch("/api/sessions")
        .then(r => r.json())
        .then(data => {
          if (!data.error && Array.isArray(data)) {
            // Only update on first load and then manage locally to prevent overwriting new mock data
            setSessions(prev => prev.length === 0 ? data.slice(0, 50) : prev);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchObj();

    let timeoutId: ReturnType<typeof setTimeout>;
    
    const generateRandomSession = () => {
      setSessions(prev => {
        const monitorsList = Object.values(monitors);
        if (monitorsList.length === 0) return prev;
        
        const randomMonitor = monitorsList[Math.floor(Math.random() * monitorsList.length)];
        const isPass = Math.random() < 0.8;
        
        const newSession: Session = {
          id: Date.now() + Math.random().toString(),
          monitorId: randomMonitor.id,
          startedAt: Date.now(),
          status: isPass ? 'passed' : 'failed',
          proxyUsed: ['us-east-1', 'eu-west-1', 'ap-southeast-1', 'rotated'][Math.floor(Math.random() * 4)],
          simulateHuman: Math.random() > 0.5,
          crawlerDepth: 1,
          maxLinks: 50,
          followExternal: false,
          totalDuration: isPass ? Math.floor(Math.random() * 2000) + 500 : Math.floor(Math.random() * 5000) + 3000,
          linksFound: Math.floor(Math.random() * 20),
          linksFailed: isPass ? 0 : Math.floor(Math.random() * 5) + 1,
        };
        
        return [newSession, ...prev].slice(0, 50);
      });
      
      timeoutId = setTimeout(generateRandomSession, Math.floor(Math.random() * 4000) + 8000);
    };

    if (Object.keys(monitors).length > 0) {
      timeoutId = setTimeout(generateRandomSession, 3000);
    }

    return () => clearTimeout(timeoutId);
  }, [paused, monitors]);

  const activeCount = sessions.filter(s => s.status === 'running').length;

  const filteredSessions = sessions.filter(s => {
    if (!filter) return true;
    const m = monitors[s.monitorId];
    return m?.name.toLowerCase().includes(filter.toLowerCase()) || m?.company.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 w-full">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight flex items-center">
          <Activity className="w-6 h-6 mr-3 text-indigo-500" />
          Live Activity Feed
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
            {activeCount} Active {activeCount === 1 ? 'Session' : 'Sessions'}
          </span>
          <input 
            type="text" 
            placeholder="Filter by monitor..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-48 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white transition-colors" 
          />
          <button 
            onClick={() => setPaused(!paused)}
            className="flex items-center px-4 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            {paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4 text-red-500" />}
            {paused ? "Resume Feed" : "Pause Feed"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm rounded border border-gray-200 dark:border-slate-800 overflow-hidden w-full transition-colors relative min-h-[400px]">
        {/* Fancy top line indicator */}
        <div className={`h-0.5 w-full ${paused ? 'bg-gray-300' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] animate-[gradient_2s_linear_infinite]'}`}></div>

        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950/50 transition-colors">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
            <TerminalSquare className="mr-2 h-3.5 w-3.5" />
            Global Session Trace Log
          </h3>
          <div className="flex space-x-2">
             <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${paused ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50'}`}>
               {paused ? "Paused" : "Live Streaming"}
             </span>
          </div>
        </div>
        
        <div className="p-0 overflow-y-auto max-h-[700px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-16 text-gray-400">
               <Loader className="w-6 h-6 animate-spin mb-4" />
               <p className="text-sm">Connecting to live trace feed...</p>
             </div>
          ) : filteredSessions.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 text-gray-400">
               <TerminalSquare className="w-8 h-8 mb-4 text-gray-300 dark:text-gray-700" />
               <p className="text-sm">No recent activity matching filter.</p>
             </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-800/50">
              {filteredSessions.map((session) => {
                const monitor = monitors[session.monitorId];
                const isExpanded = expandedRows[session.id] || false;
                
                return (
                <li key={session.id} className="relative group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <button onClick={(e) => toggleRow(session.id, e)} className="mr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                         {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <span className={`h-2 w-2 rounded-full mr-3 flex-shrink-0 ${session.status === 'running' ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]' : session.status === 'passed' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <div className="flex flex-col truncate">
                        <Link to={`/admin/monitors/${session.monitorId}`} className="text-sm font-medium text-gray-900 dark:text-white flex flex-wrap items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <span className="truncate max-w-[200px] sm:max-w-xs">{monitor?.name || "Unknown Monitor"}</span>
                          <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500 hidden sm:inline">({monitor?.company || "System"})</span>
                        </Link>
                        <div className="flex items-center mt-1 space-x-3 text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                          <span className="flex items-center"><Globe className="w-3 h-3 mr-1" /> {session.proxyUsed}</span>
                          {session.simulateHuman && <span className="flex items-center bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded text-gray-600 dark:text-gray-300">HUMAN</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="hidden md:flex flex-col items-end">
                         <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                           <Clock className="w-3 h-3 mr-1" />
                           {new Date(session.startedAt).toLocaleTimeString()}
                         </span>
                         <span className="text-xs font-mono text-gray-400">
                           {session.status === 'running' ? 'Running...' : `${session.totalDuration || 0}ms`}
                         </span>
                      </div>
                      <div className="w-20 text-right">
                         <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                           session.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50' : 
                           session.status === 'passed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' : 
                           'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                         }`}>
                           {session.status}
                         </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded timeline preview */}
                  {isExpanded && (
                    <div className="px-6 pb-4 pt-1 ml-12 bg-slate-50/50 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-800/50">
                      <div className="pl-4 border-l-2 border-gray-200 dark:border-slate-700 space-y-2.5 my-3 text-xs text-gray-600 dark:text-gray-300 relative">
                        <div className="flex items-center gap-3">
                          <span className="w-10 text-right font-mono text-[10px] text-gray-400">0ms</span>
                          <span className="flex-1">Opening target URL: <span className="font-mono text-gray-500">{monitor?.url || "..."}</span></span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-10 text-right font-mono text-[10px] text-gray-400">45ms</span>
                          <span className="flex-1">DNS Resolving and TCP Establishing via <strong>{session.proxyUsed}</strong></span>
                        </div>
                        {session.status !== 'running' && (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="w-10 text-right font-mono text-[10px] text-gray-400">{Math.floor((session.totalDuration || 2000) * 0.4)}ms</span>
                              <span className="flex-1">Executed crawler profile: Depth {session.crawlerDepth}, limits {session.maxLinks}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-10 text-right font-mono text-[10px] text-gray-400">{session.totalDuration}ms</span>
                              <span className={`flex-1 font-semibold ${session.status === 'passed' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {session.status === 'passed' ? `Verified operational logic. Found ${session.linksFound} dynamic links.` : `Validation failed with ${session.linksFailed} timeouts.`}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="ml-4 mt-2">
                        <Link to={`/admin/monitors/${session.monitorId}`} className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center">
                          View full session details <ChevronRight className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    </div>
                  )}
                </li>
              )})}
            </ul>
          )}
        </div>
      </div>
      
      {toast && (
        <div className="fixed bottom-4 right-4 z-[100]">
          <div className="px-4 py-3 rounded-lg shadow-xl text-sm font-medium text-white bg-slate-900 border border-slate-700 flex items-center transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
            <Camera className="w-4 h-4 mr-2" />
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
