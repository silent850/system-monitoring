import React, { useState } from "react";
import { Download, FileText, Calendar } from "lucide-react";

export default function Reports() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setData([
        { name: "API Production", checks: 1440, uptime: "99.98%", avgResp: "120ms", incidents: 1 },
        { name: "Marketing Site", checks: 1440, uptime: "100%", avgResp: "850ms", incidents: 0 },
        { name: "Auth Service", checks: 1440, uptime: "98.5%", avgResp: "240ms", incidents: 3 }
      ]);
      setGenerating(false);
    }, 1000);
  };

  const handleExport = () => {
    if (data.length === 0) return;
    const header = "Monitor Name,Total Checks,Uptime %,Avg Response,Incidents\n";
    const csv = data.map(r => `${r.name},${r.checks},${r.uptime},${r.avgResp},${r.incidents}`).join("\n");
    const blob = new Blob([header + csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uptime_report.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Reports</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Generate aggregated statistics.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-end">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-800 text-white" />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm sm:text-sm bg-white dark:bg-slate-800 text-white" />
          </div>
          <button onClick={handleGenerate} disabled={generating || !fromDate || !toDate} className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 disabled:opacity-50">
            <FileText className="mr-2 h-4 w-4" /> {generating ? "Generating..." : "Generate"}
          </button>
          
          <button onClick={handleExport} disabled={data.length === 0} className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {data.length > 0 && (
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-gray-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monitor Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Checks</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uptime %</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Response</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incidents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
              {data.map((r, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{r.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.checks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.uptime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.avgResp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.incidents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
