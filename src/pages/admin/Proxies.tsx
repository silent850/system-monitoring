import React, { useState, useEffect } from "react";
import { Plus, Trash2, Globe } from "lucide-react";

interface Proxy { id: number; label: string; address: string; groupId: number; status: string; lastUsed: string; }

export default function Proxies() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [adding, setAdding] = useState(false);

  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [groupId, setGroupId] = useState("");

  const fetchProxies = () => {
    setLoading(true);
    fetch("/api/proxies")
      .then(r => r.json())
      .then(data => { setProxies(data); setLoading(false); });
  };

  useEffect(() => { fetchProxies(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    await fetch("/api/proxies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, address, groupId })
    });
    setAdding(false);
    setShowModal(false);
    setLabel(""); setAddress(""); setGroupId("");
    fetchProxies();
  };

  const deleteProxy = async (id: number) => {
    if (!confirm("Delete proxy?")) return;
    await fetch(`/api/proxies/${id}`, { method: "DELETE" });
    fetchProxies();
  };

  const maskProxy = (addr: string) => {
    // mask the address simple way: split by @ or something, just returning a generic mask if too complex
    return addr.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Proxies</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage outbound proxy pools.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={() => setShowModal(true)} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800">
            <Plus className="mr-2 h-4 w-4" /> Add Proxy
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800">
        {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
              {proxies.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center"><Globe className="mr-2 w-4 h-4 text-gray-400" /> {p.label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{maskProxy(p.address)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.groupId || 'Unassigned'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className="px-2 bg-green-100 text-green-800 text-xs rounded-full">ACTIVE</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => deleteProxy(p.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
              {proxies.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No proxies.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Add Proxy</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Label</label>
                <input required type="text" value={label} onChange={e => setLabel(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-800 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address (ip:port or http://user:pass@ip:port)</label>
                <input required type="text" placeholder="IP:PORT:USER:PASS" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-800 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Group ID (Optional)</label>
                <input type="number" value={groupId} onChange={e => setGroupId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-800 text-white" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={adding} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 disabled:opacity-50">{adding ? "Adding..." : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
