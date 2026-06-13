import React from "react";
import { Link } from "react-router";
import { TerminalSquare, Play, Pause, Camera, Copy } from "lucide-react";

export default function LiveActivity() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center w-full">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Live Activity</h1>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Pause className="mr-2 h-4 w-4" />
            Pause Feed
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden w-full">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-slate-800 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
            <TerminalSquare className="mr-2 h-5 w-5 text-gray-400" />
            Automated Session Replays
          </h3>
          <div className="flex space-x-2">
            <input type="text" placeholder="Filter by monitor..." className="block w-64 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-transparent dark:text-white" />
          </div>
        </div>
        <div className="p-0">
          <ul className="divide-y divide-gray-200 dark:divide-slate-800">
            {[1, 2, 3].map((i) => (
              <li key={i} className="px-6 py-4 flex flex-col justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 mr-3 animate-pulse"></span>
                    <Link to="/admin/monitors/1" className="flex-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                        Acme Production API <span className="ml-2 px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Proxy: US-East Route</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Time: {new Date().toLocaleTimeString()} • Result: 200 OK • 120ms</p>
                    </Link>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1.5 text-gray-400 hover:text-gray-500"><Camera className="h-4 w-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-500"><Copy className="h-4 w-4" /></button>
                  </div>
                </div>
                {/* Session replay sequence */}
                <div className="pl-5 border-l-2 border-gray-200 dark:border-gray-700 space-y-3 ml-1 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">0ms</span>
                    <span>Opening URL: https://api.acmeprod.com/health</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">45ms</span>
                    <span>DNS Resolved, establishing TCP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">120ms</span>
                    <span className="text-green-600 font-semibold">Response 200 OK</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
