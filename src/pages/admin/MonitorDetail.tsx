import React, { useState } from "react";
import { useParams, Link } from "react-router";
import { 
  ArrowLeft, Play, Pause, User, Image as ImageIcon, Download, 
  MapPin, Clock, Globe, Target, Terminal, Eye, ExternalLink, ShieldAlert,
  ChevronRight, CheckCircle2, XCircle, AlertCircle
} from "lucide-react";

export default function MonitorDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('live');
  const [simulateHuman, setSimulateHuman] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [proxyGroup, setProxyGroup] = useState('us-east-1');

  // Dummy simulation progress
  const [progressStatus, setProgressStatus] = useState<string>("Ready to start session.");

  const handleRunNow = () => {
    setSessionActive(true);
    setProgressStatus("Initializing browser session...");
    setTimeout(() => setProgressStatus("Resolving DNS..."), 1000);
    setTimeout(() => setProgressStatus("Establishing TCP/TLS..."), 2000);
    setTimeout(() => setProgressStatus("Loading DOM..."), 3000);
    setTimeout(() => setProgressStatus("Executing JavaScript & tracking..."), 4500);
    setTimeout(() => {
      setProgressStatus("Session complete.");
      setSessionActive(false);
    }, 7000);
  };

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
                Acme Production API
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                Operational
              </span>
            </div>
            <a href="https://api.acmeprod.com/health" target="_blank" rel="noreferrer" className="text-sm text-gray-500 dark:text-gray-400 flex items-center hover:text-slate-900 dark:hover:text-white transition-colors mt-0.5">
              https://api.acmeprod.com/health <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={proxyGroup} 
            onChange={(e) => setProxyGroup(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          >
            <option value="us-east-1">Proxy: US-East-1</option>
            <option value="eu-west-1">Proxy: EU-West-1</option>
            <option value="rotated">Proxy: Rotating (Global)</option>
          </select>
          
          <button 
            onClick={() => setSimulateHuman(!simulateHuman)}
            className={`flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${
              simulateHuman 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-400' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-slate-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800'
            }`}
          >
            <User className="mr-2 h-4 w-4" />
            Simulate Human: {simulateHuman ? 'On' : 'Off'}
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

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-8">
          {['Overview', 'Live Activity', 'History', 'Crawler Config'].map((tab) => (
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
          <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
            {/* Left Column: Browser View & Waterfall */}
            <div className="flex-1 flex flex-col space-y-6">
              
              {/* Browser View Card */}
              <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950/50">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Browser Session</span>
                    {simulateHuman && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        Human Profile: Light
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded" title="Take Screenshot">
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded" title="Download HAR">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Simulated Rendering Area */}
                <div className="relative bg-slate-100 dark:bg-black border-b border-gray-200 dark:border-slate-800 h-64 md:h-80 flex items-center justify-center p-4">
                  {sessionActive ? (
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mb-4"></div>
                      <p className="text-sm font-mono text-slate-600 dark:text-slate-400">{progressStatus}</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-cover bg-center opacity-80 dark:opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000')" }}>
                      <div className="absolute inset-0 bg-slate-900/10 dark:bg-black/40"></div>
                      {/* Simulated overlay for detected dynamic object */}
                      <div className="absolute top-[30%] left-[20%] w-32 h-10 border-2 border-indigo-500 bg-indigo-500/20 rounded z-10 flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-indigo-600 px-1 rounded shadow-sm absolute -top-4 -right-2">Linked Button</span>
                      </div>
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur pb-1 pt-1.5 px-3 rounded shadow-sm border border-gray-200 dark:border-slate-700/50 flex items-center text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <Eye className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                        Visitor Counter Visible
                      </div>
                    </div>
                  )}
                </div>

                {/* Waterfall / Progress */}
                <div className="px-4 py-3 bg-white dark:bg-slate-900">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Load Waterfall</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">Total: 120ms</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5 flex overflow-hidden">
                    <div className="bg-blue-400 h-2.5" style={{ width: '15%' }} title="DNS (18ms)"></div>
                    <div className="bg-orange-400 h-2.5" style={{ width: '25%' }} title="TCP (30ms)"></div>
                    <div className="bg-purple-400 h-2.5" style={{ width: '20%' }} title="SSL (24ms)"></div>
                    <div className="bg-green-500 h-2.5" style={{ width: '40%' }} title="TTFB (48ms)"></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 px-1 font-mono">
                    <span>DNS</span>
                    <span>TCP</span>
                    <span>SSL</span>
                    <span>Response</span>
                  </div>
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800 flex-1">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Terminal className="mr-2 h-4 w-4 text-gray-500" />
                    Session Timeline
                  </h3>
                </div>
                <div className="p-4 overflow-y-auto max-h-64">
                  <ul className="space-y-4">
                    {[
                      { time: "0ms", msg: "Opening URL: https://api.acmeprod.com/health", status: "ok" },
                      { time: "45ms", msg: "Network connection established via US-East-1 proxy", status: "ok" },
                      { time: "120ms", msg: "Page loaded (200 OK), injecting tracking observers", status: "ok" },
                      { time: "150ms", msg: "Executing JS payload (Simulate Human: Light profile)", status: "ok" },
                      { time: "400ms", msg: "Detected 4 dynamic links in DOM", status: "info" },
                      { time: "850ms", msg: "Analyzed dynamic element: <button id='checkout'>", status: "ok" },
                    ].map((step, idx) => (
                      <li key={idx} className="flex text-sm">
                        <span className="w-16 flex-shrink-0 text-gray-500 dark:text-gray-400 font-mono text-xs pt-0.5">{step.time}</span>
                        <div className="flex-1 text-gray-700 dark:text-gray-300">
                          <span className="flex items-start">
                            {step.status === 'ok' && <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />}
                            {step.status === 'info' && <AlertCircle className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />}
                            {step.msg}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>

            {/* Right Column: Detected Links */}
            <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Target className="mr-2 h-4 w-4 text-gray-500" />
                  Detected Links & Elements
                </h3>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">
                  4 Found
                </span>
              </div>
              
              <div className="flex border-b border-gray-200 dark:border-slate-800">
                <button className="flex-1 py-2 text-xs font-medium text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white">
                  Discovered (2)
                </button>
                <button className="flex-1 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Buttons/Images (2)
                </button>
                <button className="flex-1 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Ignored (0)
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-0">
                <ul className="divide-y divide-gray-200 dark:divide-slate-800">
                  <li className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-2 border-transparent hover:border-indigo-500">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate pr-2">
                        Checkout Button (Dynamic)
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                        200 OK
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate mb-2">/api/v1/checkout/session</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1">
                         <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded text-[10px] uppercase font-bold border border-gray-200 dark:border-slate-700">BUTTON</span>
                         <span className="text-xs text-gray-400 ml-1">45ms load</span>
                     </div>
                      <div className="text-xs flex space-x-2 text-gray-400">
                        <button className="hover:text-red-500 transition-colors uppercase tracking-wider font-semibold">Block</button>
                        <button className="hover:text-indigo-500 transition-colors uppercase tracking-wider font-semibold">Ignore</button>
                      </div>
                    </div>
                  </li>
                  <li className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-2 border-transparent hover:border-indigo-500">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">
                        Documentation Link
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                        200 OK
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate mb-2">https://docs.acmeprod.com</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1">
                         <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded text-[10px] uppercase font-bold border border-gray-200 dark:border-slate-700">A (LINK)</span>
                         <span className="text-xs text-gray-400 ml-1">112ms load</span>
                     </div>
                      <div className="text-xs flex space-x-2 text-gray-400">
                        <button className="hover:text-red-500 transition-colors uppercase tracking-wider font-semibold">Block</button>
                        <button className="hover:text-indigo-500 transition-colors uppercase tracking-wider font-semibold">Ignore</button>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50">
                <button className="w-full justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center transition-colors">
                  <Download className="w-4 h-4 mr-2" />
                  Export Link Report
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Fallback for other tabs */}
        {activeTab !== 'live activity' && (
          <div className="flex-1 flex items-center justify-center border-4 border-dashed border-gray-200 dark:border-slate-800 rounded-lg">
             <div className="text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white flex capitalize">{activeTab} Interface</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This module is part of the detail management view.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
