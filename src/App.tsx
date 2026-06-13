import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Logs from './components/Logs';
import LinkCrawler from './components/LinkCrawler';
import Login from './components/Login';
import Installer from './components/Installer';
import { UptimeLog, CrawledLink } from './types';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

function ProtectedApp() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'crawler' | 'settings'>('dashboard');
  const [logs, setLogs] = useState<UptimeLog[]>([]);
  const [crawledLinks, setCrawledLinks] = useState<CrawledLink[]>([]);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
        const res = await axios.get('/api/auth/verify');
        setIsAuthenticated(true);
        setUserRoles(res.data.roles || []);
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

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/logs');
        setLogs(res.data);
      } catch (err) {
        console.error('Failed to fetch logs', err);
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

  const handleLoginSuccess = (token: string, roles: string[]) => {
    localStorage.setItem('uptime_token', token);
    setUserRoles(roles);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('uptime_token');
    setIsAuthenticated(false);
    setUserRoles([]);
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

  const isAdmin = userRoles.includes('Admin');

  if (!isAdmin) {
    // Basic portal for standard users
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 p-8">
        <div className="max-w-4xl mx-auto pb-4 flex justify-between items-center border-b border-slate-800 mb-8">
          <h1 className="text-2xl font-bold text-white">Customer Portal</h1>
          <button onClick={handleLogout} className="text-sm px-4 py-2 border border-slate-800 rounded hover:bg-slate-800">Logout</button>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-8">
          <p>Welcome to the portal. Your monitors will appear here.</p>
        </div>
      </div>
    );
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

function BootComponent() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    const checkInstaller = async () => {
      try {
        const res = await axios.get('/api/installer/status');
        setIsInstalled(res.data.isInstalled);
      } catch(err) {
        setIsInstalled(false);
      } finally {
        setIsVerifying(false);
      }
    };
    checkInstaller();
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/install" element={
        isInstalled ? <Navigate to="/admin" /> : <Installer onComplete={() => window.location.href = '/admin'} />
      } />
      <Route path="/admin/*" element={
        !isInstalled ? <Navigate to="/install" /> : <ProtectedApp />
      } />
      <Route path="*" element={<Navigate to="/admin" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BootComponent />
    </BrowserRouter>
  );
}

