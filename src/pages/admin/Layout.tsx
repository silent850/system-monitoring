import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, Activity, Search, ListIcon, TerminalSquare, CreditCard, Settings, LogOut, FileText, Blocks, Moon, Sun, Users, Building } from "lucide-react";
import { cn } from "../../lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Monitoring", href: "/admin/monitors", icon: Activity },
  { name: "Live Activity", href: "/admin/live", icon: TerminalSquare },
  { name: "Logs", href: "/admin/logs", icon: ListIcon },
  { name: "Reports", href: "/admin/reports", icon: FileText },
  { name: "Proxies", href: "/admin/proxies", icon: Blocks },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Companies", href: "/admin/companies", icon: Building },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [systemName, setSystemName] = useState("Uptime Pulse");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    fetch("/api/system/status")
      .then(res => res.json())
      .then(data => {
        if (!data.installed) {
          navigate("/install");
          return;
        }
        if (data.systemName) setSystemName(data.systemName);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400">Loading system...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 dark:bg-slate-950 text-white flex-col hidden md:flex border-r border-slate-800 dark:border-slate-800">
        <div className="h-16 flex items-center px-6 font-bold text-lg tracking-tight bg-slate-950 dark:bg-black border-b border-transparent dark:border-slate-800">
          {systemName}
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Link to="/login" className="flex items-center px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white">
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shadow-sm z-10 w-full transition-colors duration-200">
          <div className="flex items-center flex-1">
            <div className="max-w-md w-full relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search monitors, companies..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-transparent dark:text-white rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>
          <div className="ml-4 flex items-center md:ml-6 space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300 text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
