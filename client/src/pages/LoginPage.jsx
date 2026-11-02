import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, UserCheck, KeyRound } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const demoAccounts = [
    { label: 'Super Admin', email: 'superadmin@bribeshield.org', role: 'Full Root Access' },
    { label: 'Administrator', email: 'admin@bribeshield.org', role: 'Operations & Escalation' },
    { label: 'Investigator', email: 'investigator@bribeshield.org', role: 'Evidence & Remarks' },
    { label: 'Analyst', email: 'analyst@bribeshield.org', role: 'Pattern & Heatmap' },
    { label: 'Auditor', email: 'auditor@bribeshield.org', role: 'Audit Chain Verifier' }
  ];

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword('BribeShield@2026!');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 shadow-lg shadow-sky-500/20 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Staff & Vigilance Sign In</h1>
        <p className="text-xs text-slate-400">
          Role-Based Access Control (RBAC) portal for verified anti-corruption officers and statutory ombudsmen.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>{error}</div>
        </div>
      )}

      {/* Demo Credentials Quick-Select */}
      <div className="mb-6 glass-panel rounded-2xl p-4 border border-slate-800">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
          Demo Role Quick Fill:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {demoAccounts.map((acc) => (
            <button
              key={acc.label}
              type="button"
              onClick={() => handleSelectDemo(acc)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-sky-500/10 hover:text-sky-400 text-slate-300 border border-slate-800 transition-colors"
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Official Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@bribeshield.org"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Security Credential / Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
        >
          {loading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 text-center pt-2">
          Encrypted TLS session • All login actions recorded in tamper-evident audit ledger.
        </p>
      </form>
    </div>
  );
};

