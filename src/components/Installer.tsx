import React, { useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function Installer({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    systemName: 'Uptime SaaS',
    companyName: 'My Company',
    logoUrl: '',
    faviconUrl: '',
    supportEmail: 'support@example.com',
    timezone: 'UTC',
    adminName: 'Admin',
    adminEmail: 'admin@example.com',
    adminPassword: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    smtpEncryption: 'tls',
    sonicPesaAccessKey: '',
    sonicPesaSecretKey: '',
    sonicPesaWebhookSecret: '',
    sonicPesaEnv: 'sandbox'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/installer/install', form);
      // Automatically log them in by fetching token from regular login later, 
      // or just assume completion and let them login usually
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Installation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Uptime Monitor SaaS</h1>
          <p className="text-slate-400">Complete the initial setup to get started.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Settings */}
          <div>
            <h2 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">System Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">System Name</label>
                <input required type="text" name="systemName" value={form.systemName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input required type="text" name="companyName" value={form.companyName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Support Email</label>
                <input required type="email" name="supportEmail" value={form.supportEmail} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timezone</label>
                <input required type="text" name="timezone" value={form.timezone} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          {/* Admin Account */}
          <div>
            <h2 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">Administrator Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Admin Name</label>
                <input required type="text" name="adminName" value={form.adminName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Admin Email</label>
                <input required type="email" name="adminEmail" value={form.adminEmail} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Password</label>
                <input required type="password" name="adminPassword" value={form.adminPassword} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          {/* SMTP */}
          <div>
            <h2 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">SMTP Configuration (Optional here)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">SMTP Host</label>
                <input type="text" name="smtpHost" value={form.smtpHost} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SMTP Port</label>
                <input type="text" name="smtpPort" value={form.smtpPort} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SMTP Username</label>
                <input type="text" name="smtpUsername" value={form.smtpUsername} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SMTP Password</label>
                <input type="password" name="smtpPassword" value={form.smtpPassword} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          {/* SonicPesa */}
          <div>
            <h2 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">SonicPesa Payment Gateway (Optional here)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Access Key</label>
                <input type="text" name="sonicPesaAccessKey" value={form.sonicPesaAccessKey} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Secret Key</label>
                <input type="password" name="sonicPesaSecretKey" value={form.sonicPesaSecretKey} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Webhook Secret</label>
                <input type="password" name="sonicPesaWebhookSecret" value={form.sonicPesaWebhookSecret} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors flex items-center"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Complete Installation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
