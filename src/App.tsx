import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Settings, Activity, Link2, List, LogOut } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Logs } from './components/Logs';
import { Crawler } from './components/Crawler';
import { Settings as SettingsPage } from './components/Settings';
import { Login } from './components/Login';

// API Service
export const api = {
  get: async (path: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api${path}`, {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
    if (!res.ok && res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
  post: async (path: string, body: any = {}) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
  delete: async (path: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api${path}`, {
      method: 'DELETE',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
    if (!res.ok) throw new Error('API Error');
    return res.json();
  }
};

function AuthRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    api.get('/auth/verify')
      .then(() => setAuth(true))
      .catch(() => setAuth(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;
  if (!auth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Activity size={18} /> },
    { name: 'Logs', path: '/logs', icon: <List size={18} /> },
    { name: 'Crawler', path: '/crawler', icon: <Link2 size={18} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold tracking-wide">
            <Activity className="size-6" />
            <span>Uptime Sentinel</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <button 
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}
                >
                  {item.icon}
                  {item.name}
                </button>
              )
            })}
          </div>
          <button 
            onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AuthRoute><Layout><Dashboard /></Layout></AuthRoute>} />
        <Route path="/logs" element={<AuthRoute><Layout><Logs /></Layout></AuthRoute>} />
        <Route path="/crawler" element={<AuthRoute><Layout><Crawler /></Layout></AuthRoute>} />
        <Route path="/settings" element={<AuthRoute><Layout><SettingsPage /></Layout></AuthRoute>} />
      </Routes>
    </Router>
  );
}
