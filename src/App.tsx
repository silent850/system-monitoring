import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Logs from './components/Logs';
import LinkCrawler from './components/LinkCrawler';
import Login from './components/Login';
import { UptimeLog, CrawledLink } from './types';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'crawler' | 'settings'>('dashboard');
  const [logs, setLogs] = useState<UptimeLog[]>([]);
  const [crawledLinks, setCrawledLinks] = useState<CrawledLink[]>([]);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Setup axios interceptor for auth headers
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('uptime_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const verifyToken = async () => {
      const token = localStorage.getItem('uptime_token');
      if (!token) {
        setIsVerifying(false);
        return;
      }
      try {
        await axios.get('/api/auth/verify');
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('uptime_token');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  // Periodically fetch logs
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/logs');
        setLogs(res.data);
      } catch (err) {
        console.error('Failed to fetch logs', err);
        // If 401, handle unauth
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem('uptime_token');
          setIsAuthenticated(false);
        }
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
  }, [activeTab, isAuthenticated]);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('uptime_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('uptime_token');
    setIsAuthenticated(false);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
      {activeTab === 'dashboard' && <Dashboard logs={logs} />}
      {activeTab === 'logs' && <Logs logs={logs} />}
      {activeTab === 'crawler' && <LinkCrawler links={crawledLinks} setLinks={setCrawledLinks} />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  );
}

