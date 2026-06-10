import React, { useEffect, useState } from 'react';
import { api } from '../App';
import { AppConfig } from '../types';
import { Save, ShieldAlert, Globe, Server, Activity } from 'lucide-react';

export function Settings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [urlsStr, setUrlsStr] = useState('');
  const [proxiesStr, setProxiesStr] = useState('');
  const [blockedStr, setBlockedStr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/config').then(data => {
      if (data) {
        setConfig(data);
        setUrlsStr(data.urls?.join('\\n') || '');
        setProxiesStr(data.proxies?.join('\\n') || '');
        setBlockedStr(data.blockedLinks?.join('\\n') || '');
      }
    });
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const newConfig: AppConfig = {
        ...config,
        urls: urlsStr.split('\\n').map(s => s.trim()).filter(Boolean),
        proxies: proxiesStr.split('\\n').map(s => s.trim()).filter(Boolean),
        blockedLinks: blockedStr.split('\\n').map(s => s.trim()).filter(Boolean),
      };
      await api.post('/config', newConfig);
      setConfig(newConfig);
      alert('Settings saved successfully!');
    } catch (e) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!config) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2 font-medium">
          <Activity className="text-indigo-400 size-5" />
          Monitoring Rules
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Target URLs (one per line)</label>
            <textarea
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
              placeholder="https://example.com"
              value={urlsStr}
              onChange={e => setUrlsStr(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Alert Email</label>
              <input
                type="email"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                value={config.email}
                onChange={e => setConfig({ ...config, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Check Interval (Seconds)</label>
              <input
                type="number"
                min="30"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                value={config.intervalSeconds}
                onChange={e => setConfig({ ...config, intervalSeconds: parseInt(e.target.value) || 60 })}
              />
              <p className="text-xs text-slate-500">Minimum 30 seconds</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2 font-medium">
          <Globe className="text-indigo-400 size-5" />
          Browser & Identity
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Custom User Agent</label>
            <input
              type="text"
              placeholder="Leave empty for default Puppeteer UA"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
              value={config.userAgent}
              onChange={e => setConfig({ ...config, userAgent: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Viewport Width</label>
              <input
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                value={config.viewportWidth}
                onChange={e => setConfig({ ...config, viewportWidth: parseInt(e.target.value) || 1366 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Viewport Height</label>
              <input
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                value={config.viewportHeight}
                onChange={e => setConfig({ ...config, viewportHeight: parseInt(e.target.value) || 768 })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2 font-medium">
          <Server className="text-indigo-400 size-5" />
          Proxy Settings
        </div>
        <div className="p-6 space-y-1">
          <label className="text-sm font-medium text-slate-300">Proxy List (one per line, random per check cycle)</label>
          <textarea
            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
            placeholder="http://user:pass@127.0.0.1:8080"
            value={proxiesStr}
            onChange={e => setProxiesStr(e.target.value)}
          />
          <p className="text-xs text-slate-500">Supported format: http://[user]:[password]@[host]:[port]</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2 font-medium">
          <ShieldAlert className="text-indigo-400 size-5" />
          Link Crawler
        </div>
        <div className="p-6 space-y-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                name="toggle" 
                id="toggle" 
                checked={config.crawlEnabled}
                onChange={e => setConfig({ ...config, crawlEnabled: e.target.checked })}
                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-5 rounded-full bg-slate-800 cursor-pointer ${config.crawlEnabled ? 'bg-indigo-500' : ''}`}></label>
            </div>
            <span className="text-sm font-medium text-slate-300">Enable Sub-Link Crawling</span>
          </label>
          
          <div className="space-y-1 opacity-50 pointer-events-none">
            <label className="text-sm font-medium text-slate-300">Crawl Depth</label>
            <input
              type="number"
              disabled
              className="w-full max-w-[150px] bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 cursor-not-allowed"
              value={config.crawlDepth}
            />
            <p className="text-xs text-slate-500">Locked to Depth 1 for stability</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Blocked Links (one pattern per line)</label>
            <textarea
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
              placeholder="/logout\n/delete\n/admin"
              value={blockedStr}
              onChange={e => setBlockedStr(e.target.value)}
            />
            <div className="text-xs text-amber-400 mt-1 flex gap-1 items-start">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>Warning: Always block destructive action routes like /logout, /delete, or /admin. The browser will click them!</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-2.5 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <style>{`
        .toggle-checkbox:checked { right: 0; border-color: #6366f1; }
        .toggle-checkbox:checked + .toggle-label { background-color: #6366f1; }
        .toggle-checkbox { transition: all 0.3s; right: 20px; border-color: #1e293b; border-width: 1px; }
      `}</style>
    </div>
  );
}
