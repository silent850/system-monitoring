import React from "react";
import { Activity, ServerCrash, Clock, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { name: "Total Monitored Targets", value: "142", icon: Activity, change: "+12%" },
    { name: "Currently Down", value: "3", icon: ServerCrash, textClass: "text-red-600 dark:text-red-400" },
    { name: "Avg Response Time (24h)", value: "245ms", icon: Clock },
    { name: "Pending Alerts", value: "5", icon: AlertTriangle, textClass: "text-yellow-600 dark:text-yellow-400" },
  ];

  return (
    <div className="space-y-6 flex flex-col max-w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h1>
        <div className="flex space-x-3">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            Pause All
          </button>
          <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800">
            Add Monitor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-slate-900 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-slate-800">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-6 w-6 text-gray-400 dark:text-gray-500 ${stat.textClass || ""}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1 flex flex-col">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.name}</dt>
                  <dd className="flex items-baseline">
                    <div className={`text-2xl font-semibold text-gray-900 dark:text-white ${stat.textClass || ""}`}>{stat.value}</div>
                    {stat.change && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600 dark:text-green-400">
                        {stat.change}
                      </div>
                    )}
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-950 px-5 py-3 border-t border-gray-200 dark:border-slate-800">
              <div className="text-sm">
                <a href="#" className="font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">View details</a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Checks */}
      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-slate-800 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recent Checks</h3>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-slate-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Acme Production API</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">api.acmeprod.com/health</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">120ms</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 mins ago</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
