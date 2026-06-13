import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Installer from "./pages/Installer";
import Login from "./pages/Login";
import AdminLayout from "./pages/admin/Layout";
import Dashboard from "./pages/admin/Dashboard";
import Monitors from "./pages/admin/Monitors";
import Billing from "./pages/admin/Billing";

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
        
        {/* Admin Portal Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="monitors" element={<Monitors />} />
          <Route path="billing" element={<Billing />} />
          <Route path="*" element={<PlaceholderView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
