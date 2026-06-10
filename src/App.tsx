import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Logs from './components/Logs';
import LinkCrawler from './components/LinkCrawler';
import { UptimeLog, CrawledLink } from './types';
import axios from 'axios';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'crawler' | 'settings'>('dashboard');
  const [logs, setLogs] = useState<UptimeLog[]>([]);
  const [crawledLinks, setCrawledLinks] = useState<CrawledLink[]>([]);

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

    const fetchCrawledLinks = async () => {
      if (activeTab !== 'crawler') return;
      try {
        const res = await axios.get('/api/crawled-links');
        setCrawledLinks(res.data);
      } catch (err) {
        console.error('Failed to fetch crawled links', err);
      }
    };

    fetchLogs();
    fetchCrawledLinks();
    
    const interval = setInterval(() => {
      fetchLogs();
      fetchCrawledLinks();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard logs={logs} />}
      {activeTab === 'logs' && <Logs logs={logs} />}
      {activeTab === 'crawler' && <LinkCrawler links={crawledLinks} setLinks={setCrawledLinks} />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  );
}

