import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import { LayoutDashboard, Activity, FileText, CreditCard, LogOut, Menu, X, Moon, Sun } from "lucide-react";

export default function PortalLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check dark mode pref
    if (document.documentElement.classList.contains('dark')) {
      setDarkMode(true);
    }
    
    fetch("/api/portal/auth/me")
      .then(r => {
        if (!r.ok) throw new Error("unauth");
        return r.json();
      })
      .then(data => {
        setCompanyName(data.company.name);
        setLoading(false);
      })
      .catch(() => navigate("/portal/login"));
  }, [navigate]);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    await fetch("/api/portal/auth/logout", { method: "POST" });
    navigate("/portal/login");
  };

  const nav = [
    { name: "Dashboard", href: "/portal", icon: LayoutDashboard, exact: true },
    { name: "Monitors", href: "/portal/monitors", icon: Activity },
    { name: "Reports", href: "/portal/reports", icon: FileText },
    { name: "Billing", href: "/portal/billing", icon: CreditCard },
  ];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setIsMobileMenuOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-indigo-900 text-white flex flex-col">
          <div className="flex h-16 items-center px-4"><span className="text-xl font-bold">{companyName} Portal</span></div>
          <nav className="flex-1 overflow-y-auto mt-5 px-2">
            {nav.map(n => <NavLink key={n.name} to={n.href} className={({isActive}) => `flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${isActive ? "bg-indigo-800 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}><n.icon className="mr-3 h-5 w-5" />{n.name}</NavLink>)}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col bg-indigo-900 text-white">
          <div className="flex h-16 items-center px-4 border-b border-indigo-800"><span className="text-xl font-bold truncate">{companyName} Portal</span></div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {nav.map(n => <NavLink end={n.exact} key={n.name} to={n.href} className={({isActive}) => `flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? "bg-indigo-800 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}><n.icon className="mr-3 h-5 w-5" />{n.name}</NavLink>)}
            </nav>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 shrink-0">
          <button className="lg:hidden p-2 text-gray-500" onClick={() => setIsMobileMenuOpen(true)}><Menu className="h-6 w-6" /></button>
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <button onClick={toggleDarkMode} className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={handleLogout} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 text-gray-900 dark:text-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
