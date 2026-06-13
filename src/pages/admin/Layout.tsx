import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Activity, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  Building2,
  Users,
  Globe,
  FileText
} from "lucide-react";

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("AD");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchStatusAndUser = async () => {
      try {
        const [sysRes, userRes] = await Promise.all([
          fetch("/api/system/status"),
          fetch("/api/auth/me")
        ]);

        const sysData = await sysRes.json();
        if (!sysData.installed) {
          navigate("/installer");
          return;
        }

        if (!userRes.ok) {
          navigate("/");
          return;
        }

        const userData = await userRes.json();
        setUserName(userData.email?.substring(0, 2).toUpperCase() || "AD");
      } catch (err) {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchStatusAndUser();
  }, [navigate]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    navigate("/");
  };

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
    { name: "Monitors", href: "/admin/monitors", icon: Activity },
    { name: "Live Activity", href: "/admin/live", icon: Activity },
    { name: "Companies", href: "/admin/companies", icon: Building2 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Proxies", href: "/admin/proxies", icon: Globe },
    { name: "Reports", href: "/admin/reports", icon: FileText },
    { name: "Billing (SonicPesa)", href: "/admin/billing", icon: CreditCard },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex dark:bg-slate-950 dark:text-white transition-colors duration-200">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-900/80 transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col">
          <div className="flex h-16 items-center flex-shrink-0 px-4">
            <Activity className="h-8 w-8 text-indigo-400 mr-2" />
            <span className="text-xl font-bold tracking-tight">Uptime Pulse</span>
            <button className="ml-auto p-2" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto mt-5 px-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
                    isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col">
          <div className="flex h-0 flex-1 flex-col bg-slate-900 text-white border-r border-slate-800">
            <div className="flex h-16 items-center flex-shrink-0 px-4 border-b border-slate-800">
              <Activity className="h-8 w-8 text-indigo-400 mr-2 flex-shrink-0" />
              <span className="text-xl font-bold tracking-tight truncate">Uptime Pulse</span>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.exact}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive 
                          ? "bg-slate-800 text-white" 
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon 
                          className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                            isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-300"
                          }`} 
                        />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex-shrink-0 border-t border-slate-800 p-4">
              <button 
                onClick={handleLogout}
                className="flex w-full items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-300" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 transition-colors">
          <button
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-sm font-medium border border-gray-200 dark:border-slate-700">
              {userName}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
