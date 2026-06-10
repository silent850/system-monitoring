import { useState, FormEvent } from 'react';
import axios from 'axios';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Form stating
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      onLoginSuccess(res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message);
      setView('reset');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('/api/auth/reset-password', { email, token: resetToken, newPassword });
      setMessage('Password reset successfully. You can now log in.');
      setView('login');
      setPassword('');
      setResetToken('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-400">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          {view === 'login' && 'Sign in to your account'}
          {view === 'forgot' && 'Reset your password'}
          {view === 'reset' && 'Enter reset code'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow sm:rounded-xl border border-slate-800 sm:px-10">
          
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-md p-3">
              <p className="text-sm text-rose-400 font-medium">{error}</p>
            </div>
          )}
          
          {message && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3">
              <p className="text-sm text-emerald-400 font-medium">{message}</p>
            </div>
          )}

          {view === 'login' && (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-slate-300" htmlFor="email">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full appearance-none rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300" htmlFor="password">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full appearance-none rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <button type="button" onClick={() => { setView('forgot'); setError(''); setMessage(''); }} className="font-medium text-indigo-400 hover:text-indigo-300">
                    Forgot your password?
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sign In
                </button>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            <form className="space-y-6" onSubmit={handleForgot}>
              <div>
                <label className="block text-sm font-medium text-slate-300" htmlFor="email-forgot">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email-forgot"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full appearance-none rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send reset code
                </button>
              </div>

              <div className="text-center text-sm">
                <button type="button" onClick={() => { setView('login'); setError(''); setMessage(''); }} className="font-medium text-slate-400 hover:text-slate-300">
                  Back to login
                </button>
              </div>
            </form>
          )}

          {view === 'reset' && (
            <form className="space-y-6" onSubmit={handleReset}>
              <div>
                <label className="block text-sm font-medium text-slate-300" htmlFor="email-reset">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email-reset"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full appearance-none rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300" htmlFor="resetToken">
                  Reset code
                </label>
                <div className="mt-1">
                  <input
                    id="resetToken"
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="block w-full appearance-none rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm font-mono tracking-widest uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300" htmlFor="newPassword">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full appearance-none rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Reset Password
                </button>
              </div>
              
              <div className="text-center text-sm">
                <button type="button" onClick={() => { setView('login'); setError(''); setMessage(''); }} className="font-medium text-slate-400 hover:text-slate-300">
                  Back to login
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
