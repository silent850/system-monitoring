import React from "react";
import { Server, Shield, Key } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">System Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
              <Server className="w-5 h-5 mr-2 text-gray-400" />
              General Configuration
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              System identity and core monitoring limits.
            </p>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800 p-6 transition-colors">
            <form className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">System Name</label>
                <input type="text" defaultValue="Uptime Pulse" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-transparent dark:text-white" />
              </div>
              <div className="pt-4">
                <button type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                  Save General Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="hidden sm:block" aria-hidden="true">
        <div className="py-5">
          <div className="border-t border-gray-200 dark:border-slate-800"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
              <Key className="w-5 h-5 mr-2 text-gray-400" />
              Integrations & APIS
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Connect external payment and SMS gateways.
            </p>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800 p-6 transition-colors">
            <form className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SonicPesa API Key</label>
                <input type="password" placeholder="sk_live_..." className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-transparent dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SonicPesa API Secret</label>
                <input type="password" placeholder="sec_live_..." className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-transparent dark:text-white" />
              </div>
              <div className="pt-4">
                <button type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                  Save Integrations
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
