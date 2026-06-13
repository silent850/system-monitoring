import React, { useState, useEffect } from "react";
import { Save, Shield, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

export default function Settings() {
  const [systemName, setSystemName] = useState("");
  const [sonicPesaKey, setSonicPesaKey] = useState("");
  const [sonicPesaSecret, setSonicPesaSecret] = useState("");
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingIntegration, setSavingIntegration] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        setSystemName(data.systemName || "");
        setSonicPesaKey(data.sonicPesaKey || "");
        setSonicPesaSecret(data.sonicPesaSecret || "");
      })
      .catch(console.error);
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemName })
      });
      showToast("System name saved");
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIntegration(true);
    try {
      await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sonicPesaKey, sonicPesaSecret })
      });
      showToast("Integrations saved");
    } finally {
      setSavingIntegration(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">System Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage global configurations and integrations</p>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800">
        <form onSubmit={handleSaveGeneral} className="p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-2">General</h2>
          
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">System Name</label>
            <input 
              type="text" 
              value={systemName}
              onChange={e => setSystemName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white" 
            />
          </div>

          <div>
            <button 
              type="submit" 
              disabled={savingGlobal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingGlobal ? "Saving..." : "Save General Settings"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800">
        <form onSubmit={handleSaveIntegrations} className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Payment Integrations</h2>
            <Shield className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SonicPesa API Key</label>
              <input 
                type="text" 
                value={sonicPesaKey}
                onChange={e => setSonicPesaKey(e.target.value)}
                placeholder="Required"
                className="mt-1 block w-full border border-gray-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SonicPesa API Secret</label>
              <input 
                type="password" 
                value={sonicPesaSecret}
                onChange={e => setSonicPesaSecret(e.target.value)}
                placeholder="Required"
                className="mt-1 block w-full border border-gray-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white" 
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Keys are stored securely. Existing keys shown masked.
            </p>
          </div>

          <div>
            <button 
              type="submit" 
              disabled={savingIntegration}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingIntegration ? "Saving..." : "Save Integrations"}
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white bg-slate-900 border border-slate-700 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
