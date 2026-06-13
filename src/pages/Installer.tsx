import React, { useState } from "react";
import { useNavigate } from "react-router";

export default function Installer() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/system/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemName: "My Custom Uptime Pulse" })
      });
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Uptime Pulse Auto-Installer
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          First-time setup for your self-hosted instance.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Database & System Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">System Name</label>
                  <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm" placeholder="Uptime Pulse" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PostgreSQL DATABASE_URL</label>
                  <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm" placeholder="postgres://user:pass@host/db" />
                </div>
                <div className="flex items-center">
                  <input id="seed" type="checkbox" className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded" defaultChecked />
                  <label htmlFor="seed" className="ml-2 block text-sm text-gray-900">Seed database with sample monitors</label>
                </div>
              </div>
              <div className="mt-6">
                <button onClick={() => setStep(2)} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800">
                  Next: Admin Account
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleInstall}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Account</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email address</label>
                  <input type="email" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-slate-500 focus:border-slate-500 sm:text-sm" placeholder="admin@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-slate-500 focus:border-slate-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SonicPesa API Key (Optional)</label>
                  <input type="password" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-slate-500 focus:border-slate-500 sm:text-sm" />
                  <p className="mt-1 items-start text-xs text-gray-500">For client billing integration.</p>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Back
                </button>
                <button type="submit" disabled={loading} className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800">
                  {loading ? "Installing..." : "Install System"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
