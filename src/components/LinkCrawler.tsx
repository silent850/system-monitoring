import { useState, Dispatch, SetStateAction } from 'react';
import { CrawledLink } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ShieldCheck, ShieldAlert, Link2, Search, Filter, Ban, CheckCircle2, Clock, Globe } from 'lucide-react';
import axios from 'axios';
import { clsx } from 'clsx';

interface LinkCrawlerProps {
  links: CrawledLink[];
  setLinks: Dispatch<SetStateAction<CrawledLink[]>>;
}

export default function LinkCrawler({ links, setLinks }: LinkCrawlerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'static' | 'dynamic' | 'down' | 'blocked'>('all');

  const handleBlockToggle = async (link: CrawledLink) => {
    try {
      if (link.isBlocked) {
        await axios.post('/api/crawled-links/unblock', { href: link.href });
      } else {
        await axios.post('/api/crawled-links/block', { href: link.href });
      }
      
      // Optimitistic update
      setLinks(prev => prev.map(l => {
        if (l.href === link.href) {
          return { ...l, isBlocked: !link.isBlocked };
        }
        return l;
      }));
    } catch (err) {
      console.error('Failed to toggle block status', err);
    }
  };

  // Stats
  const total = links.length;
  const up = links.filter(l => l.lastStatus === 'up').length;
  const down = links.filter(l => l.lastStatus === 'down').length;
  const blocked = links.filter(l => l.isBlocked).length;

  // Filtering
  const filteredLinks = links.filter(link => {
    const matchesSearch = link.href.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          link.linkText.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'static') return link.isStatic;
    if (filter === 'dynamic') return link.isDynamic;
    if (filter === 'down') return link.lastStatus === 'down';
    if (filter === 'blocked') return link.isBlocked;
    
    return true;
  });

  // Grouping
  const groupedLinks = filteredLinks.reduce((acc, link) => {
    if (!acc[link.parentUrl]) acc[link.parentUrl] = [];
    acc[link.parentUrl].push(link);
    return acc;
  }, {} as Record<string, CrawledLink[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-tight text-white flex items-center gap-2">
          <Link2 className="w-6 h-6 text-indigo-400" />
          Link Crawler
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm font-medium mb-1">Total Discovered</p>
          <p className="text-2xl font-semibold text-white">{total}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm font-medium mb-1">Links UP</p>
          <p className="text-2xl font-semibold text-emerald-400">{up}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm font-medium mb-1">Links DOWN</p>
          <p className="text-2xl font-semibold text-rose-400">{down}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm font-medium mb-1">Blocked / Skipped</p>
          <p className="text-2xl font-semibold text-slate-500">{blocked}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        {/* Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-950/50">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search URLs or link text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(['all', 'static', 'dynamic', 'down', 'blocked'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors",
                  filter === f 
                    ? "bg-indigo-500 text-white" 
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          {Object.keys(groupedLinks).length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500 gap-3">
              <Globe className="w-12 h-12 text-slate-700" />
              <p className="text-lg font-medium text-slate-400">No links found yet.</p>
              <p className="max-w-md text-sm">Enable the Link Crawler in Settings and wait for the next check interval to discover links on your target URLs.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {Object.entries(groupedLinks).map(([parentUrl, pageLinks]) => (
                <div key={parentUrl} className="group">
                  <div className="bg-slate-950 px-6 py-3 border-b border-slate-800/50">
                    <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-2">
                       <Globe className="w-4 h-4" />
                       Found on: {parentUrl}
                    </h3>
                  </div>
                  <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-slate-800/10">
                      {pageLinks.map(link => (
                        <tr key={link.id} className={clsx("transition-colors hover:bg-slate-800/30", link.isBlocked && "opacity-60 bg-slate-900/50")}>
                          <td className="px-6 py-4 w-32">
                            {link.isBlocked ? (
                               <span className="flex items-center gap-1.5 w-fit text-slate-400 bg-slate-800 px-2 py-1 rounded inline-flex text-xs font-medium border border-slate-700">
                                 <Ban className="w-3.5 h-3.5" /> BLOCKED
                               </span>
                            ) : link.lastStatus === 'up' ? (
                               <span className="flex items-center gap-1.5 w-fit text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded inline-flex text-xs font-medium border border-emerald-500/20">
                                 <ShieldCheck className="w-3.5 h-3.5" /> UP
                               </span>
                            ) : link.lastStatus === 'down' ? (
                               <span className="flex items-center gap-1.5 w-fit text-rose-400 bg-rose-500/10 px-2 py-1 rounded inline-flex text-xs font-medium border border-rose-500/20">
                                 <ShieldAlert className="w-3.5 h-3.5" /> DOWN
                               </span>
                            ) : (
                               <span className="flex items-center gap-1.5 w-fit text-amber-400 bg-amber-500/10 px-2 py-1 rounded inline-flex text-xs font-medium border border-amber-500/20">
                                 <Clock className="w-3.5 h-3.5" /> PENDING
                               </span>
                            )}
                          </td>
                          <td className="px-6 py-4 max-w-[300px]">
                            <div className="flex flex-col gap-1">
                              <a href={link.href} target="_blank" rel="noreferrer" className="text-slate-200 font-medium hover:text-indigo-400 truncate" title={link.href}>
                                {link.href.replace(new URL(link.href).origin, '') || '/'}
                              </a>
                              <span className="text-xs text-slate-500 truncate" title={link.linkText}>"{link.linkText}"</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border",
                              link.isStatic ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            )}>
                              {link.isStatic ? 'Static' : 'Dynamic'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                            {link.responseTime ? `${link.responseTime}ms` : '-'}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {link.lastChecked ? formatDistanceToNow(new Date(link.lastChecked), { addSuffix: true }) : 'Never'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleBlockToggle(link)}
                              className={clsx(
                                "p-1.5 rounded-md transition-colors",
                                link.isBlocked 
                                  ? "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                  : "text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                              )}
                              title={link.isBlocked ? "Unblock Link" : "Block Link"}
                            >
                              {link.isBlocked ? <CheckCircle2 className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
