import React, { useState, useEffect, useReducer, useRef } from "react";
import { useParams, Link } from "react-router";
import { 
  ArrowLeft, Play, Pause, User, Image as ImageIcon, Download, 
  MapPin, Clock, Globe, Target, Terminal, Eye, ExternalLink, ShieldAlert,
  ChevronRight, CheckCircle2, XCircle, AlertCircle, Settings,
  RotateCw, Copy, RotateCcw, BoxSelect, Maximize, X
} from "lucide-react";
import type { Monitor, Session, SessionStep, DetectedLink } from "../../types";

type LinkAction = 
  | { type: 'SET_LINKS'; payload: DetectedLink[] }
  | { type: 'IGNORE_LINK'; id: string | number }
  | { type: 'BLOCK_LINK'; id: string | number }
  | { type: 'TEST_LINK'; id: string | number; state: 'testing' | 'done' };

function linkReducer(state: DetectedLink[], action: LinkAction): DetectedLink[] {
  switch (action.type) {
    case 'SET_LINKS':
      return action.payload;
    case 'IGNORE_LINK':
      return state.map(l => l.id === action.id ? { ...l, state: 'ignored' } : l);
    case 'BLOCK_LINK':
      return state.map(l => l.id === action.id ? { ...l, state: 'blocked' } : l);
    case 'TEST_LINK':
      // Just handled via component state for spinning, but we could update state here
      return state;
    default:
      return state;
  }
}

export default function MonitorDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('live activity');
  const [proxyGroup, setProxyGroup] = useState('us-east-1');
  
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [steps, setSteps] = useState<SessionStep[]>([]);
  const [links, dispatchLinks] = useReducer(linkReducer, []);
  
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>("Ready to start session.");
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  // Advanced configurations
  const [showSimulateHumanConfig, setShowSimulateHumanConfig] = useState(false);
  const [humanProfile, setHumanProfile] = useState<'none' | 'light' | 'moderate'>('light');
  const [userAgent, setUserAgent] = useState('Chrome/Windows');
  const [autoCookies, setAutoCookies] = useState(true);

  // Crawler config
  const [crawlerDepth, setCrawlerDepth] = useState(1);
  const [maxLinks, setMaxLinks] = useState(50);
  const [followExternal, setFollowExternal] = useState(false);
  const [blocklist, setBlocklist] = useState<string[]>(['*google-analytics*', '*ads*']);
  const [blockInput, setBlockInput] = useState('');

  // UI state
  const [linkTab, setLinkTab] = useState<'discovered'|'buttons'|'ignored'>('discovered');
  const [testingLink, setTestingLink] = useState<string|number|null>(null);
  
  // Waterfall
  const [waterfall, setWaterfall] = useState({ dns: 0, tcp: 0, ssl: 0, ttfb: 0 });

  const timelineRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`/api/monitors/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setMonitor(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
      
    fetch(`/api/monitors/${id}/sessions`)
      .then(res => res.json())
      .then(data => {
        if (!data.error && Array.isArray(data)) {
          setSessions(data.sort((a,b) => b.startedAt - a.startedAt));
        }
      })
  }, [id]);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [steps]);

  const handleRunNow = async () => {
    setSessionActive(true);
    setProgressStatus("Initializing browser session...");
    setSteps([]);
    dispatchLinks({ type: 'SET_LINKS', payload: [] });
    setWaterfall({ dns: 0, tcp: 0, ssl: 0, ttfb: 0 });
    
    // Simulate waterfall filling
    setTimeout(() => setWaterfall(prev => ({ ...prev, dns: 20 })), 500);
    setTimeout(() => setWaterfall(prev => ({ ...prev, tcp: 35 })), 1000);
    setTimeout(() => setWaterfall(prev => ({ ...prev, ssl: 30 })), 1500);
    setTimeout(() => setWaterfall(prev => ({ ...prev, ttfb: 60 })), 2000);

    setTimeout(() => setProgressStatus("Resolving DNS..."), 500);
    setTimeout(() => setProgressStatus("Establishing TCP/TLS..."), 1000);
    setTimeout(() => setProgressStatus("Loading DOM..."), 1500);
    setTimeout(() => setProgressStatus("Executing JavaScript & tracking..."), 2000);

    try {
      const res = await fetch(`/api/monitors/${id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          proxyUsed: proxyGroup, 
          simulateHuman: showSimulateHumanConfig,
          humanProfile,
          crawlerDepth,
          maxLinks,
          followExternal
        })
      });
      const session = await res.json();
      
      // Poll session status until completed
      let sessionData;
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const sessionRes = await fetch(`/api/sessions/${session.id}`);
        sessionData = await sessionRes.json();
        if (sessionData && sessionData.session && sessionData.session.status !== "running") {
          break;
        }
      }
      
      setProgressStatus("Session complete.");
      setSteps(sessionData?.steps || []);
      dispatchLinks({ type: 'SET_LINKS', payload: sessionData?.links || [] });
      setSessions([sessionData?.session, ...sessions.filter(s => s.id !== session.id)]);
    } catch (e) {
      setProgressStatus("Session failed to communicate.");
      setSteps([{ id: 'error', sessionId: 'none', timestamp: Date.now(), message: 'Failed to communicate with service', status: 'fail' }]);
    }
    setSessionActive(false);
  };

  const copyLogs = () => {
    const text = steps.map(s => `[${s.durationMs}ms] ${s.status.toUpperCase()}: ${s.message}`).join('\n');
    navigator.clipboard.writeText(text);
    showToast("Logs copied to clipboard");
  };

  const downloadHar = () => {
    const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ log: { version: "1.2", pages: [], entries: [] } }));
    const a = document.createElement('a');
    a.href = data;
    a.download = `monitor_${id}_session.har`;
    a.click();
    showToast("HAR downloaded");
  };

  const downloadScreenshot = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px sans-serif";
      ctx.fillText("Simulated Screenshot", 300, 300);
    }
    const a = document.createElement('a');
    a.href = canvas.toDataURL("image/png");
    a.download = `screenshot_${id}.png`;
    a.click();
    showToast("Screenshot downloaded");
  };

  const testLink = (linkId: string | number) => {
    setTestingLink(linkId);
    setTimeout(() => {
      setTestingLink(null);
      showToast("Link re-test complete");
    }, 1500);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">Loading monitor detail...</div>;
  if (!monitor) return <div className="flex-1 flex items-center justify-center p-8 text-red-500">Monitor not found.</div>;

  const filteredLinks = links.filter(l => {
    if (linkTab === 'ignored') return l.state === 'ignored';
    if (l.state === 'ignored') return false;
    if (linkTab === 'buttons') return l.elementType === 'button' || l.elementType === 'img';
    return true; // discovered covers everything not ignored
  });

  const lastSession = sessions[0];
  const totalWaterfall = waterfall.dns + waterfall.tcp + waterfall.ssl + waterfall.ttfb;

  return (
    <div className="space-y-6 flex flex-col h-full -mt-2">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:justify-between md:items-center w-full">
        <div className="flex items-center">
          <Link to="/admin/monitors" className="p-2 mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight mr-3">
                {monitor.name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                monitor.status === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50' :
                monitor.status === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}>
                {monitor.status.toUpperCase()}
              </span>
            </div>
            <a href={monitor.url} target="_blank" rel="noreferrer" className="text-sm text-gray-500 dark:text-gray-400 flex items-center hover:text-slate-900 dark:hover:text-white transition-colors mt-0.5">
              {monitor.url} <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={downloadScreenshot} className="p-2 text-gray-500 bg-white border border-gray-300 dark:bg-slate-900 dark:border-slate-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md shadow-sm transition-colors" title="Download Screenshot">
            <ImageIcon className="h-4 w-4" />
          </button>
          <button onClick={downloadHar} className="p-2 text-gray-500 bg-white border border-gray-300 dark:bg-slate-900 dark:border-slate-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md shadow-sm transition-colors" title="Export HAR">
            <Download className="h-4 w-4" />
          </button>

          <select 
            value={proxyGroup} 
            onChange={(e) => setProxyGroup(e.target.value)}
            className="pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-slate-500 focus:border-slate-500 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          >
            <option value="us-east-1">US-East-1</option>
            <option value="eu-west-1">EU-West-1</option>
            <option value="ap-southeast-1">Asia-Pacific</option>
            <option value="rotated">Rotating (Global)</option>
          </select>
          
          <button 
            onClick={() => setShowSimulateHumanConfig(!showSimulateHumanConfig)}
            className={`flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${
              showSimulateHumanConfig 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-400' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800'
            }`}
          >
            <User className="mr-2 h-4 w-4" />
            Simulate Human: {showSimulateHumanConfig ? 'ON' : 'OFF'}
          </button>

          {sessionActive ? (
            <button className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">
              <Pause className="mr-2 h-4 w-4" fill="currentColor" />
              Stop Session
            </button>
          ) : (
            <button onClick={handleRunNow} className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 shadow-sm transition-colors">
              <Play className="mr-2 h-4 w-4" fill="currentColor" />
              Run Now
            </button>
          )}
        </div>
      </div>

      {/* Simulate Human Config Panel */}
      {showSimulateHumanConfig && (
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-lg p-4 flex flex-wrap gap-6 items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile:</span>
            {(['none', 'light', 'moderate'] as const).map(p => (
              <label key={p} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <input type="radio" checked={humanProfile === p} onChange={() => setHumanProfile(p)} className="text-indigo-600 focus:ring-indigo-500" />
                <span className="capitalize">{p}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center space-x-2 border-l border-indigo-200 dark:border-indigo-800/50 pl-6">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User-Agent:</span>
            <select value={userAgent} onChange={(e) => setUserAgent(e.target.value)} className="text-sm border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 py-1 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="Chrome/Windows">Chrome/Windows</option>
              <option value="Safari/macOS">Safari/macOS</option>
              <option value="Firefox/Linux">Firefox/Linux</option>
              <option value="Mobile Chrome/Android">Mobile Chrome/Android</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 border-l border-indigo-200 dark:border-indigo-800/50 pl-6">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={autoCookies} onChange={(e) => setAutoCookies(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-700" />
              <span>Auto-accept cookies</span>
            </label>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-8">
          {['Overview', 'Live Activity', 'History'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`${
                activeTab === tab.toLowerCase()
                  ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'live activity' && (
          <div className="flex flex-col h-full gap-6">
            
            {/* Crawler inline config */}
            <div className={`bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between transition-all duration-300 ${sessionActive ? 'opacity-50 pointer-events-none' : ''}`}>
               {sessionActive ? (
                 <div className="text-sm font-mono text-gray-500 dark:text-gray-400">
                   Session Config Active: Depth {crawlerDepth} | Max Links {maxLinks} | Ext {followExternal ? 'ON' : 'OFF'}
                 </div>
               ) : (
                 <div className="flex flex-wrap items-center gap-6 w-full">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Depth:</span>
                      <div className="flex rounded-md shadow-sm">
                        {[0,1,2,3].map(d => (
                           <button key={d} onClick={() => setCrawlerDepth(d)} className={`px-2.5 py-1 text-xs border border-gray-300 dark:border-slate-700 first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 ${crawlerDepth === d ? 'bg-slate-900 text-white dark:bg-slate-700' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300'}`}>
                             {d}
                           </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Max Links:</span>
                      <input type="number" min="1" max="500" value={maxLinks} onChange={(e) => setMaxLinks(Number(e.target.value))} className="w-16 border-gray-300 dark:border-slate-700 rounded-md py-1 px-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white" />
                    </div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={followExternal} onChange={(e) => setFollowExternal(e.target.checked)} className="rounded text-slate-900 focus:ring-slate-900 border-gray-300" />
                      <span>Follow External</span>
                    </label>
                    <div className="flex items-center flex-1 space-x-2">
                       <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Blocklist:</span>
                       <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
                         {blocklist.map((b, i) => (
                           <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                             {b}
                             <X className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" onClick={() => setBlocklist(bl => bl.filter((_, idx) => idx !== i))} />
                           </span>
                         ))}
                         <input type="text" value={blockInput} onChange={e => setBlockInput(e.target.value)} onKeyDown={(e) => {
                           if (e.key === 'Enter' && blockInput) { setBlocklist([...blocklist, blockInput]); setBlockInput(''); }
                         }} placeholder="Add pattern..." className="text-xs bg-transparent border-none focus:ring-0 w-24 dark:text-white" />
                       </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
              {/* Left Column: Browser View & Waterfall & Timeline */}
              <div className="flex-1 flex flex-col space-y-6 overflow-hidden h-full">
                
                {/* Browser View Card */}
                <div className="bg-[#1e1e1e] shadow-sm rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col flex-shrink-0 transition-colors">
                  {/* Fake Browser Chrome */}
                  <div className="h-10 bg-[#2d2d2d] flex items-center px-4 border-b border-[#3d3d3d] flex-shrink-0">
                    <div className="flex space-x-2 mr-4">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="bg-[#1e1e1e] rounded-md px-3 py-1 flex items-center w-2/3 max-w-sm border border-[#3d3d3d]">
                        <Globe className="w-3 h-3 text-gray-400 mr-2" />
                        <span className="text-xs text-gray-300 font-mono truncate">{monitor.url}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Simulated Rendering Area */}
                  <div className="relative bg-slate-100 dark:bg-[#121212] h-64 flex items-center justify-center transition-colors overflow-hidden">
                    {sessionActive ? (
                      <>
                        <div className="absolute inset-0 bg-cover bg-center opacity-30 filter blur-sm" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000')" }}></div>
                        <div className="absolute inset-0 bg-slate-900/40 animate-pulse"></div>
                        <div className="z-10 text-center w-full max-w-md px-4">
                           <p className="text-sm font-mono text-white mb-4 animate-bounce">{progressStatus}</p>
                           <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                             <div className="bg-blue-500 h-1 transition-all duration-300" style={{ width: totalWaterfall ? '100%' : '5%' }}></div>
                           </div>
                        </div>
                      </>
                    ) : steps.length > 0 ? (
                      <>
                        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000')" }}>
                          <div className="absolute inset-0 bg-slate-900/10 dark:bg-black/40"></div>
                          {/* Colored bounding boxes based on detected links */}
                          {links.slice(0,3).map((l, i) => (
                            <div key={l.id} className={`absolute border-2 rounded ${l.state === 'blocked' ? 'border-red-500 bg-red-500/20' : 'border-[#27c93f] bg-[#27c93f]/20'} flex items-start justify-start transition-all duration-300`}
                                 style={{ 
                                   top: `${20 + i * 25}%`, 
                                   left: `${10 + i * 15}%`, 
                                   width: '140px', 
                                   height: '40px' 
                                 }}
                            >
                              <span className={`text-[10px] font-bold text-white px-1 uppercase absolute -top-4 -left-[2px] ${l.state === 'blocked' ? 'bg-red-500' : 'bg-[#27c93f]'}`}>
                                {l.elementType}
                              </span>
                            </div>
                          ))}

                          {showSimulateHumanConfig && (
                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur pb-1 pt-1.5 px-3 rounded shadow-sm border border-gray-200 dark:border-slate-700/50 flex items-center text-xs font-semibold text-slate-800 dark:text-slate-200">
                              <Eye className="w-3.5 h-3.5 mr-1.5 text-[#27c93f]" />
                              Visitor Counter Detected
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                       <div className="text-center text-gray-500 dark:text-gray-400">
                         <BoxSelect className="w-8 h-8 mx-auto mb-2 opacity-50" />
                         <p className="text-sm">Run a session to capture rendering</p>
                       </div>
                    )}
                  </div>

                  {/* Waterfall Component */}
                  <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex-shrink-0 transition-colors h-[68px]">
                    <div className="flex justify-between items-center mb-1.5">
                      <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Load Waterfall</h4>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">Total: {totalWaterfall > 0 ? totalWaterfall : '--'}ms</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 flex overflow-hidden">
                       <div className="bg-blue-400 h-full transition-all duration-300" style={{ width: totalWaterfall ? `${(waterfall.dns/totalWaterfall)*100}%` : '0%' }} title={`DNS (${waterfall.dns}ms)`}></div>
                       <div className="bg-orange-400 h-full transition-all duration-300" style={{ width: totalWaterfall ? `${(waterfall.tcp/totalWaterfall)*100}%` : '0%' }} title={`TCP (${waterfall.tcp}ms)`}></div>
                       <div className="bg-purple-400 h-full transition-all duration-300" style={{ width: totalWaterfall ? `${(waterfall.ssl/totalWaterfall)*100}%` : '0%' }} title={`SSL (${waterfall.ssl}ms)`}></div>
                       <div className="bg-green-500 h-full transition-all duration-300" style={{ width: totalWaterfall ? `${(waterfall.ttfb/totalWaterfall)*100}%` : '0%' }} title={`Response (${waterfall.ttfb}ms)`}></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 dark:text-gray-500 mt-1 px-1 font-mono">
                      <span>DNS</span>
                      <span>TCP</span>
                      <span>SSL</span>
                      <span>Resp</span>
                    </div>
                  </div>
                </div>

                {/* Timeline Steps */}
                <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800 flex-1 flex flex-col min-h-[200px] transition-colors">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Terminal className="mr-2 h-4 w-4 text-gray-500" />
                      Session Timeline
                    </h3>
                    <button onClick={copyLogs} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded" title="Copy logs">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div ref={timelineRef} className="p-4 overflow-y-auto flex-1 scroll-smooth">
                    {steps.length === 0 ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 italic text-center">No timeline events yes. Run a session.</div>
                    ) : (
                      <ul className="space-y-3">
                        {steps.map((step) => (
                          <li key={step.id} className="flex text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <span className="w-16 flex-shrink-0 text-gray-400 font-mono text-[11px] pt-0.5">{new Date(step.timestamp).toISOString().substring(11,23)}</span>
                            <div className="flex-1 text-gray-700 dark:text-gray-300 flex items-start justify-between">
                              <span className="flex items-start">
                                {step.status === 'ok' && <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />}
                                {step.status === 'info' && <AlertCircle className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />}
                                {step.status === 'fail' && <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />}
                                <span className="text-xs">{step.message}</span>
                              </span>
                              {step.durationMs ? <span className="ml-2 text-[10px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-500 font-mono">{step.durationMs}ms</span> : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Detected Links */}
              <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800 transition-colors h-full">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 flex justify-between items-center flex-shrink-0">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Target className="mr-2 h-4 w-4 text-gray-500" />
                    Detected Objects
                  </h3>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                    {links.length} Found
                  </span>
                </div>
                
                <div className="flex border-b border-gray-200 dark:border-slate-800 flex-shrink-0">
                  <button onClick={() => setLinkTab('discovered')} className={`flex-1 py-2 text-[11px] font-medium transition-colors border-b-2 ${linkTab === 'discovered' ? 'text-slate-900 dark:text-white border-slate-900 dark:border-white' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    Discovered ({links.filter(l => l.state !== 'ignored').length})
                  </button>
                  <button onClick={() => setLinkTab('buttons')} className={`flex-1 py-2 text-[11px] font-medium transition-colors border-b-2 ${linkTab === 'buttons' ? 'text-slate-900 dark:text-white border-slate-900 dark:border-white' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    Buttons/Images ({links.filter(l => (l.elementType === 'button' || l.elementType === 'img') && l.state !== 'ignored').length})
                  </button>
                  <button onClick={() => setLinkTab('ignored')} className={`flex-1 py-2 text-[11px] font-medium transition-colors border-b-2 ${linkTab === 'ignored' ? 'text-slate-900 dark:text-white border-slate-900 dark:border-white' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    Ignored ({links.filter(l => l.state === 'ignored').length})
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0 relative">
                  <ul className="divide-y divide-gray-200 dark:divide-slate-800">
                    {filteredLinks.length === 0 ? (
                      <li className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                        No items
                      </li>
                    ) : filteredLinks.map((link) => (
                      <li key={link.id} className="relative px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors group">
                        {link.state === 'blocked' && (
                          <div className="absolute inset-0 bg-red-50 dark:bg-red-900/10 z-0 pointer-events-none border-l-2 border-red-500"></div>
                        )}
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-sm font-medium truncate pr-2 ${link.state === 'blocked' ? 'text-red-700 dark:text-red-400 line-through opacity-70' : 'text-slate-900 dark:text-white'}`}>
                              {link.elementLabel || "Unknown Element"}
                            </p>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0 border ${
                              link.state === 'blocked' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200' :
                              link.httpStatus === 200 ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200/50' :
                              'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400 border-gray-200'
                            }`}>
                              {link.state === 'blocked' ? 'BLOCKED' : link.httpStatus ? `${link.httpStatus} OK` : 'PENDING'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate mb-2">{link.url}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-1">
                               <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded text-[9px] uppercase font-bold border border-gray-200 dark:border-slate-700">
                                 {link.elementType}
                               </span>
                               {link.loadTimeMs && <span className="text-[10px] text-gray-400 ml-1 font-mono">{link.loadTimeMs}ms</span>}
                           </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => testLink(link.id)} className="p-1 text-gray-400 hover:text-indigo-500 transition-colors rounded" title="Re-test link">
                                <RotateCw className={`w-3.5 h-3.5 ${testingLink === link.id ? 'animate-spin text-indigo-500' : ''}`} />
                              </button>
                              {link.state !== 'blocked' && (
                                <button onClick={() => dispatchLinks({ type: 'BLOCK_LINK', id: link.id })} className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors px-1">Block</button>
                              )}
                              {link.state !== 'ignored' && (
                                <button onClick={() => dispatchLinks({ type: 'IGNORE_LINK', id: link.id })} className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-1">Ignore</button>
                              )}
                              <button className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-indigo-500 transition-colors px-1">Open</button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Session Summary Footer */}
            {lastSession && !sessionActive && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center shadow-sm transition-all duration-300">
                <div className="flex items-center space-x-6">
                   <div className="flex items-center">
                     <span className={`h-3 w-3 rounded-full mr-2 ${lastSession.status === 'passed' ? 'bg-[#27c93f]' : 'bg-[#ff5f56]'}`}></span>
                     <span className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                       {lastSession.status}
                     </span>
                   </div>
                   <div className="h-8 border-l border-gray-200 dark:border-slate-700"></div>
                   <div className="flex flex-col">
                     <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Duration</span>
                     <span className="text-sm font-mono text-gray-900 dark:text-white">{lastSession.totalDuration}ms</span>
                   </div>
                   <div className="h-8 border-l border-gray-200 dark:border-slate-700"></div>
                   <div className="flex flex-col">
                     <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Links Checked</span>
                     <span className="text-sm text-gray-900 dark:text-white font-medium">{lastSession.linksFound} <span className="text-red-500 text-xs ml-1">({lastSession.linksFailed} failed)</span></span>
                   </div>
                   <div className="h-8 border-l border-gray-200 dark:border-slate-700 hidden md:block"></div>
                   <div className="flex flex-col hidden md:flex">
                     <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Profile</span>
                     <span className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate max-w-[150px]">{lastSession.proxyUsed} / {lastSession.simulateHuman ? 'Human' : 'Bot'}</span>
                   </div>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button onClick={downloadHar} className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-slate-700 rounded shadow-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    Download HAR
                  </button>
                  <button onClick={() => showToast("Report saved — view in Reports page")} className="px-3 py-1.5 text-xs font-medium border border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-400 rounded shadow-sm transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/50">
                    Save as Report
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Fallback for other tabs */}
        {activeTab !== 'live activity' && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900/50 transition-colors">
             <div className="text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white flex capitalize">{activeTab} Interface</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This module is part of the detail management view.</p>
             </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white flex items-center transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === 'success' ? 'bg-slate-900 border border-slate-700 shadow-xl' : 'bg-red-600'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" /> : <AlertCircle className="w-4 h-4 mr-2" />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
