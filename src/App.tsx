import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Installer from "./pages/Installer";
import Login from "./pages/Login";
import AdminLayout from "./pages/admin/Layout";
import Dashboard from "./pages/admin/Dashboard";
import Monitors from "./pages/admin/Monitors";
import MonitorDetail from "./pages/admin/MonitorDetail";
import Billing from "./pages/admin/Billing";
import LiveActivity from "./pages/admin/LiveActivity";
import Logs from "./pages/admin/Logs";
import Reports from "./pages/admin/Reports";
import Proxies from "./pages/admin/Proxies";
import Settings from "./pages/admin/Settings";
import Users from "./pages/admin/Users";
import Companies from "./pages/admin/Companies";

import PortalLogin from "./pages/portal/Login";
import PortalLayout from "./pages/portal/Layout";
import PortalDashboard from "./pages/portal/Dashboard";
import PortalMonitors from "./pages/portal/Monitors";

function PlaceholderView() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Module Under Construction</h2>
      <p className="text-gray-500">This feature is being developed.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/install" element={<Installer />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/portal/login" element={<PortalLogin />} />
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalDashboard />} />
          <Route path="monitors" element={<PortalMonitors />} />
        </Route>
        
        {/* Admin Portal Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="monitors" element={<Monitors />} />
          <Route path="monitors/:id" element={<MonitorDetail />} />
          <Route path="live" element={<LiveActivity />} />
          <Route path="logs" element={<Logs />} />
          <Route path="reports" element={<Reports />} />
          <Route path="proxies" element={<Proxies />} />
          <Route path="users" element={<Users />} />
          <Route path="companies" element={<Companies />} />
          <Route path="settings" element={<Settings />} />
          <Route path="billing" element={<Billing />} />
          <Route path="*" element={<PlaceholderView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
