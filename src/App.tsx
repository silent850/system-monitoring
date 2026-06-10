import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Logs from './components/Logs';
import { UptimeLog } from './types';
import axios from 'axios';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');
  const [logs, setLogs] = useState<UptimeLog[]>([]);

  // Periodically fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/logs');
        setLogs(res.data);
      } catch (err) {
        console.error('Failed to fetch logs', err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard logs={logs} />}
      {activeTab === 'logs' && <Logs logs={logs} />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  );
}

