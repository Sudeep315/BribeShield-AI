import React, { useState, useEffect } from 'react';
import { SuspectAPI } from '../services/api';
import {
  Search,
  AlertTriangle,
  ShieldAlert,
  Phone,
  CreditCard,
  UserX,
  Globe,
  Plus,
  CheckCircle2,
  X,
  Building,
  MapPin,
  Clock
} from 'lucide-react';

export const SuspectsPage = () => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    type: 'phone',
    value: '',
    department: '',
    city: '',
    notes: ''
  });
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await SuspectAPI.search({ q: query.trim(), type: typeFilter });
      setResults(res.data.results || []);
    } catch (err) {
      console.warn(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.value) return;

    setReporting(true);
    try {
      await SuspectAPI.report(reportForm);
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportModalOpen(false);
        setReportForm({ type: 'phone', value: '', department: '', city: '', notes: '' });
      }, 2000);
    } catch (err) {
      alert('Failed to report suspect: ' + (err.response?.data?.error || err.message));
    } finally {
      setReporting(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'phone': return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'upi': return <CreditCard className="w-4 h-4 text-sky-400" />;
      case 'officer': return <UserX className="w-4 h-4 text-rose-400" />;
      default: return <Globe className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Vigilance Registry • Cybercrime Model</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Suspect Identifier Repository</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Verify phone numbers, UPI IDs, or officer names previously flagged for bribery demands, extortion, or fraudulent authority impersonation.
        </p>
      </div>

      {/* Search Bar & Actions */}
      <div className="max-w-2xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search phone (+91...), UPI handle, officer name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search Registry'}
          </button>
        </form>

        {/* Filter Chips & Report Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center space-x-2">
            {[
              { label: 'All Types', value: '' },
              { label: 'Phone', value: 'phone' },
              { label: 'UPI Handle', value: 'upi' },
              { label: 'Officer', value: 'officer' }
            ].map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  typeFilter === f.value
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-rose-400 border border-rose-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Flag / Report Suspect</span>
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searched && (
        <div className="space-y-4 max-w-3xl mx-auto animate-fade-in">
          {results.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
              No suspect records found matching "<span className="text-white font-semibold">{query}</span>".
              <p className="mt-2 text-[11px] text-slate-500">
                If you were asked to pay a bribe using this identifier, use the "Flag / Report Suspect" button above.
              </p>
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-rose-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    {getTypeIcon(item.type)}
                    <span className="font-mono text-base font-bold text-white">{item.value}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.riskLevel === 'Critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : item.riskLevel === 'High'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {item.riskLevel} Risk
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center">
                      <Building className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {item.department}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {item.city}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="mt-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
                  <span className="text-2xl font-extrabold text-rose-400 font-mono block">
                    {item.reportsCount}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Reports Filed</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* REPORT SUSPECT MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel-elevated max-w-lg w-full rounded-2xl p-6 sm:p-8 border border-slate-700 relative animate-fade-in">
            <button
              onClick={() => setReportModalOpen(false)}
              className="absolute right-6 top-6 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center">
              <ShieldAlert className="w-5 h-5 text-rose-400 mr-2" />
              Flag Extortion Identifier
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Record a phone number, UPI handle, or officer demanding illicit gratification in the shared vigilance index.
            </p>

            {reportSuccess ? (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-300 text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                Identifier recorded and flagged in the repository!
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Identifier Type</label>
                  <select
                    value={reportForm.type}
                    onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="phone">Phone Number (+91...)</option>
                    <option value="upi">UPI ID / QR Handle (e.g. name@upi)</option>
                    <option value="officer">Corrupt Officer Name / Rank</option>
                    <option value="url">Bank Account or Web Link</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Suspect Identifier / Handle *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98450 11223 or clerk.payment@paytm"
                    value={reportForm.value}
                    onChange={(e) => setReportForm({ ...reportForm, value: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Police Traffic, RTO"
                      value={reportForm.department}
                      onChange={(e) => setReportForm({ ...reportForm, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru, Delhi"
                      value={reportForm.city}
                      onChange={(e) => setReportForm({ ...reportForm, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Modus Operandi / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Describe how payment was demanded..."
                    value={reportForm.notes}
                    onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reporting}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/25"
                  >
                    {reporting ? 'Submitting...' : 'Flag Suspect'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

