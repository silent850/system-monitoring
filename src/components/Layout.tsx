import { ReactNode } from 'react';
import { Activity, Settings, List, ShieldCheck, Link2 } from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
  children: ReactNode;
  activeTab: 'dashboard' | 'logs' | 'crawler' | 'settings';
  onTabChange: (tab: 'dashboard' | 'logs' | 'crawler' | 'settings') => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
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
              <ShieldCheck className="h-6 w-6" />
              <span className="text-xl font-medium tracking-tight text-white">Uptime Sentinel</span>
            </div>
            <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
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
