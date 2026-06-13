import React, { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Play, Pause, ExternalLink, Activity, Filter, Trash2 } from "lucide-react";
import { Link } from "react-router";
import type { Monitor } from "../../types";

export default function Monitors() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("site");
  const [companyId, setCompanyId] = useState("");
  const [checkInterval, setCheckInterval] = useState(60);

  const fetchMonitors = () => {
    setLoading(true);
    fetch("/api/monitors")
      .then(res => res.json())
      .then(data => {
        setMonitors(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    await fetch("/api/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, type, companyId, checkInterval })
    });
    setAdding(false);
    setShowModal(false);
    // Reset form
    setName(""); setUrl(""); setType("site"); setCompanyId(""); setCheckInterval(60);
    fetchMonitors();
  };

  const toggleStatus = async (m: Monitor) => {
    const newStatus = m.status === 'paused' ? 'up' : 'paused';
    await fetch(`/api/monitors/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, status: newStatus })
    });
    fetchMonitors();
  };

  const deleteMonitor = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    fetchMonitors();
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Monitors</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            A list of all monitored endpoints and sites.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Monitor
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search monitors..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md leading-5 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
            />
          </div>
          <button className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-slate-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Response</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                {monitors.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        m.status === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' :
                        m.status === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                      }`}>
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <Link to={`/admin/monitors/${m.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            {m.name}
                          </Link>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            {m.url}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {m.company || `Company #${m.companyId}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {m.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Activity className="mr-1.5 h-4 w-4 text-gray-400" />
                        {m.avgLoadTime || '--'} ms
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button onClick={() => toggleStatus(m)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" title={m.status === 'paused' ? 'Resume' : 'Pause'}>
                          {m.status === 'paused' ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                        </button>
                        <Link to={`/admin/monitors/${m.id}`} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                          <ExternalLink className="h-5 w-5" />
                        </Link>
                        <button onClick={() => deleteMonitor(m.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {monitors.length === 0 && (
                  <tr>
                     <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No monitors configured.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Add New Monitor</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
                <input required type="text" value={url} onChange={e => setUrl(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                   <option value="site">Site/Page</option>
                   <option value="api">API Endpoint</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company ID</label>
                <input type="number" value={companyId} onChange={e => setCompanyId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Check Interval (seconds)</label>
                <input required type="number" value={checkInterval} onChange={e => setCheckInterval(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" disabled={adding} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">
                  {adding ? "Creating..." : "Create Monitor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
