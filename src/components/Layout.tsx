import { ReactNode, useEffect, useState } from 'react';
import { Activity, Settings, List, ShieldCheck, Link2, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import axios from 'axios';

interface LayoutProps {
  children: ReactNode;
  activeTab: 'dashboard' | 'logs' | 'crawler' | 'settings';
  onTabChange: (tab: 'dashboard' | 'logs' | 'crawler' | 'settings') => void;
  onLogout?: () => void;
}

export default function Layout({ children, activeTab, onTabChange, onLogout }: LayoutProps) {
  const [branding, setBranding] = useState({ systemName: 'Uptime Sentinel', logoUrl: '', faviconUrl: '' });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await axios.get('/api/installer/status');
        if (res.data.settings) {
          const { systemName, logoUrl, faviconUrl } = res.data.settings;
          setBranding({ 
            systemName: systemName || 'Uptime Sentinel', 
            logoUrl: logoUrl || '', 
            faviconUrl: faviconUrl || '' 
          });
          
          if (systemName) {
            document.title = systemName;
          }
          if (faviconUrl) {
            let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = faviconUrl;
          }
        }
      } catch (err) {}
    };
    fetchBranding();
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'logs', label: 'Logs', icon: List },
    { id: 'crawler', label: 'Link Crawler', icon: Link2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-400">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
              <span className="text-xl font-medium tracking-tight text-white">{branding.systemName}</span>
            </div>
            <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap',
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
              
              {onLogout && (
                <>
                  <div className="w-px bg-slate-800 my-2 mx-1 rounded-full text-transparent hidden sm:block">-</div>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 whitespace-nowrap"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
