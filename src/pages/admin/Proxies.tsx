import React from "react";
import { Blocks, Plus } from "lucide-react";

export default function Proxies() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center w-full">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Proxies & Groups</h1>
        <button className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800">
          <Plus className="mr-2 h-4 w-4" />
          Add Proxy
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden w-full">
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          Proxy management table.
        </div>
      </div>
    </div>
  );
}
