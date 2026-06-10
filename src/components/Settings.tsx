import { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import axios from 'axios';
import { Save, Loader2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [config, setConfig] = useState<AppConfig>({
    urls: [],
    proxies: [],
    email: '',
    intervalSeconds: 60,
    blockedLinks: [],
    crawlEnabled: false,
    crawlDepth: 1,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form input states
  const [urlsInput, setUrlsInput] = useState('');
  const [proxiesInput, setProxiesInput] = useState('');
  const [blockedLinksInput, setBlockedLinksInput] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/config');
      setConfig(res.data);
      setUrlsInput(res.data.urls.join('\n'));
      setProxiesInput(res.data.proxies.join('\n'));
      setBlockedLinksInput(res.data.blockedLinks?.join('\n') || '');
    } catch (err) {
      console.error('Failed to load config', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    // Parse textareas back into arrays
    const parsedUrls = urlsInput.split('\n').map(s => s.trim()).filter(Boolean);
    const parsedProxies = proxiesInput.split('\n').map(s => s.trim()).filter(Boolean);
    const parsedBlockedLinks = blockedLinksInput.split('\n').map(s => s.trim()).filter(Boolean);
    
    const newConfig: AppConfig = {
      ...config,
      urls: parsedUrls,
      proxies: parsedProxies,
      blockedLinks: parsedBlockedLinks,
    };

    try {
      const res = await axios.post('/api/config', newConfig);
      setConfig(res.data.config);
      setMessage('Settings saved successfully. Monitoring loop updated.');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-tight text-white">Configuration</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <form onSubmit={handleSave} className="p-6 space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Target URLs (One per line)
              </label>
              <textarea
                value={urlsInput}
                onChange={(e) => setUrlsInput(e.target.value)}
                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm leading-relaxed"
                placeholder="https://example.com&#10;https://api.mywebsite.com"
                required
              />
              <p className="text-xs text-slate-500 mt-2">The URLs you want to actively monitor for uptime.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Alert Email Address
                </label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="alerts@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Check Interval (Seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  value={config.intervalSeconds}
                  onChange={(e) => setConfig({ ...config, intervalSeconds: parseInt(e.target.value) || 60 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="60"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Proxy List (One per line, Optional)
              </label>
              <textarea
                value={proxiesInput}
                onChange={(e) => setProxiesInput(e.target.value)}
                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm leading-relaxed"
                placeholder="http://user:pass@192.168.1.1:8080&#10;10.0.0.1:3128"
              />
              <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <p>To avoid regional blocks, the monitor will randomly rotate through these proxies on every check. If left empty, direct connections are used.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <h2 className="text-lg font-medium text-white mb-4">Link Crawler Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center justify-between bg-slate-950 border border-slate-700 rounded-lg p-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">
                      Enable Link Crawling
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Automatically discover and check links found on target pages.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={config.crawlEnabled}
                      onChange={(e) => setConfig({...config, crawlEnabled: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>
                
                <div className="bg-slate-950 border border-slate-700 rounded-lg p-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Crawl Depth
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    value={config.crawlDepth}
                    onChange={(e) => setConfig({ ...config, crawlDepth: parseInt(e.target.value) || 1 })}
                    disabled={!config.crawlEnabled}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-2">Depth 1 = only links on homepage, Depth 2 = also follow those links.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Blocked Links (Never Visit These)
                </label>
                <textarea
                  value={blockedLinksInput}
                  onChange={(e) => setBlockedLinksInput(e.target.value)}
                  disabled={!config.crawlEnabled}
                  className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://mysite.com/logout&#10;https://mysite.com/delete&#10;/admin&#10;/wp-admin"
                />
                <div className="mt-2 flex items-start gap-2 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>Always block destructive URLs like /logout, /delete, /admin to prevent the crawler from triggering them.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {message ? (
              <span className={`text-sm ${message.includes('Failed') ? 'text-rose-400' : 'text-emerald-400'}`}>
                {message}
              </span>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
