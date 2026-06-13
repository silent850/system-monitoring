import React, { useState } from "react";
import { CreditCard, History, Clock } from "lucide-react";

export default function Billing() {
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [phone, setPhone] = useState("255682812345");

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/payment/create_order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 10000, phone, currency: "TZS" })
      });
      const data = await res.json();
      if (data.status === "success" && data.data?.order_id) {
        setOrderId(data.data.order_id);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center w-full">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Billing & Subscriptions</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-gray-400" />
              Current Plan
            </h3>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">Pro Tier</p>
                <p className="text-sm text-gray-500">10,000 TZS / month</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">You have 142 monitors active. Your next billing date is Mar 21, 2026.</p>
            
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Manual Payment (Push USSD)</h4>
              {orderId ? (
                <div className="bg-green-50 text-green-800 border border-green-200 rounded-md p-4 flex items-start">
                  <Clock className="mt-0.5 mr-2 h-4 w-4" />
                  <div>
                    <p className="font-semibold text-sm">Waiting for confirmation...</p>
                    <p className="text-xs mt-1">Please check phone number {phone} to complete the SonicPesa payment. Order ID: {orderId}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePayNow} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Phone Number (Tanzania)</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm" 
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 flex items-center">
                    {loading ? "Processing..." : "Pay Now (TZS 10,000)"}
                  </button>
                  <p className="text-xs text-gray-400 mt-2">Payments processed securely via SonicPesa API.</p>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <History className="mr-2 h-5 w-5 text-gray-400" />
              Recent Invoices
            </h3>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-gray-200">
              <li className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">INV-2026-02</p>
                  <p className="text-xs text-gray-500">Feb 21, 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">TZS 10,000</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Paid</span>
                </div>
              </li>
              <li className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">INV-2026-01</p>
                  <p className="text-xs text-gray-500">Jan 21, 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">TZS 10,000</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Paid</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
