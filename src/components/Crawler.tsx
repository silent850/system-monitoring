import React, { useEffect, useState } from 'react';
import { api } from '../App';
import { CrawledLink } from '../types';
import { Search, Link as LinkIcon, Globe, Lock, Unlock, Trash2, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Crawler() {
  const [links, setLinks] = useState<CrawledLink[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchLinks = async () => {
    try {
      const data = await api.get('/crawled-links');
      setLinks(data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const clearLinks = async () => {
    if (!confirm('Clear all discovered links?')) return;
    await api.delete('/crawled-links/clear');
    await fetchLinks();
  };

  const toggleBlock = async (href: string, currentlyBlocked: boolean) => {
    await api.post(currentlyBlocked ? '/crawled-links/unblock' : '/crawled-links/block', { href });
    await fetchLinks();
  };

  const filteredLinks = links.filter(l => {
    if (filter === 'Static' && !l.isStatic) return false;
    if (filter === 'Dynamic' && !l.isDynamic) return false;
    if (filter === 'External' && !l.isExternal) return false;
    if (filter === 'Down' && l.lastStatus !== 'down') return false;
    if (filter === 'Blocked' && !l.isBlocked) return false;
    if (search && !l.href.toLowerCase().includes(search.toLowerCase()) && !l.linkText.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const parentGroups = filteredLinks.reduce((acc, link) => {
    if (!acc[link.parentUrl]) acc[link.parentUrl] = [];
    acc[link.parentUrl].push(link);
    return acc;
  }, {} as Record<string, CrawledLink[]>);

  const stats = {
    total: links.length,
    up: links.filter(l => l.lastStatus === 'up').length,
    down: links.filter(l => l.lastStatus === 'down').length,
    external: links.filter(l => l.isExternal).length,
    blocked: links.filter(l => l.isBlocked).length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total</div>
          <div className="text-xl font-semibold text-slate-200">{stats.total}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Up</div>
          <div className="text-xl font-semibold text-emerald-400">{stats.up}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Down</div>
          <div className="text-xl font-semibold text-rose-400">{stats.down}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">External</div>
          <div className="text-xl font-semibold text-amber-400">{stats.external}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Blocked</div>
          <div className="text-xl font-semibold text-slate-400">{stats.blocked}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['All', 'Static', 'Dynamic', 'External', 'Down', 'Blocked'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search links..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <button onClick={clearLinks} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {(Object.entries(parentGroups) as [string, CrawledLink[]][]).map(([parent, groupLinks]) => (
          <div key={parent} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-800/30 border-b border-slate-800 flex items-center gap-2">
              <Globe className="text-indigo-400 size-4" />
              <span className="font-mono text-sm text-slate-300 truncate">{parent}</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{groupLinks.length} links</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <tbody className="divide-y divide-slate-800/50">
                  {groupLinks.map(link => {
                    const isUp = link.lastStatus === 'up';
                    const isDown = link.lastStatus === 'down';
                    return (
                      <tr key={link.href} className={`hover:bg-slate-800/20 transition-colors ${link.isBlocked ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 w-1">
                          <div className={`px-2.5 py-1 text-xs font-bold rounded flex items-center justify-center min-w-[70px] ${
                            isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            isDown ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {link.lastStatus.toUpperCase()}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[200px] sm:max-w-xs md:max-w-sm truncate whitespace-normal leading-tight">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {link.isExternal && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">EXT</span>}
                            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">{link.linkType}</span>
                          </div>
                          <div className="font-mono text-xs text-slate-300 break-all">{link.href}</div>
                          {link.linkText && <div className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1"><LinkIcon size={10}/> {link.linkText}</div>}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          {link.lastChecked ? (
                            <div className="flex flex-col text-slate-500">
                              <span className="text-slate-400">{link.statusCode ? `HTTP ${link.statusCode}` : '...'}</span>
                              <span>{formatDistanceToNow(new Date(link.lastChecked), { addSuffix: true })}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 w-1 text-right">
                          <button 
                            onClick={() => toggleBlock(link.href, link.isBlocked)}
                            className={`p-1.5 rounded-md transition-colors border ${link.isBlocked ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'}`}
                            title={link.isBlocked ? 'Unblock' : 'Block'}
                          >
                            {link.isBlocked ? <Ban size={16} /> : <Lock size={16} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {Object.keys(parentGroups).length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">No links found</div>
        )}
      </div>
    </div>
  );
}
