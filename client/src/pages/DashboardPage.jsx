import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ComplaintAPI, AnalyticsAPI, AuditAPI, GrievanceAPI } from '../services/api';
import {
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  Share2,
  Trash2,
  Lock,
  Sparkles,
  RefreshCw,
  Eye,
  X,
  FileCheck2,
  TrendingUp,
  BarChart3,
  Building,
  Key,
  ShieldCheck,
  ChevronRight,
  Send
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, isSuperAdmin, isInvestigator, isAuditor, isAnalyst } = useAuth();

  // Active Tab: 'complaints' | 'departments' | 'anomalies' | 'audit' | 'privacy'
  const [activeTab, setActiveTab] = useState('complaints');

  // Overview KPIs
  const [kpis, setKpis] = useState(null);

  // Complaints Table State
  const [complaints, setComplaints] = useState([]);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Modal Status Update State
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Department Analytics State
  const [departments, setDepartments] = useState([]);

  // Anomaly Alerts State
  const [anomalies, setAnomalies] = useState([]);

  // Audit Logs State & Verification
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditVerification, setAuditVerification] = useState(null);
  const [verifyingAudit, setVerifyingAudit] = useState(false);

  // Escalation State
  const [escalating, setEscalating] = useState(false);
  const [escalationSuccess, setEscalationSuccess] = useState(null);

  // Retention Purge State
  const [purgeResult, setPurgeResult] = useState(null);

  useEffect(() => {
    fetchKPIs();
    fetchComplaints();
  }, [statusFilter, riskFilter]);

  const fetchKPIs = async () => {
    try {
      const res = await AnalyticsAPI.getOverview();
      if (res.data.success) {
        setKpis(res.data.kpis);
      }
    } catch (e) {
      console.warn('Could not load KPIs', e);
    }
  };

  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await ComplaintAPI.list({
        search,
        status: statusFilter,
        riskLevel: riskFilter,
        limit: 50
      });
      if (res.data.success) {
        setComplaints(res.data.complaints);
        setTotalComplaints(res.data.total);
      }
    } catch (e) {
      console.warn('Could not load complaints', e);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await AnalyticsAPI.getDepartments();
      if (res.data.success) setDepartments(res.data.departments);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadAnomalies = async () => {
    try {
      const res = await AnalyticsAPI.getAnomalies();
      if (res.data.success) setAnomalies(res.data.anomalies);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await AuditAPI.getLogs({ limit: 50 });
      if (res.data.success) setAuditLogs(res.data.logs);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'departments') loadDepartments();
    if (tab === 'anomalies') loadAnomalies();
    if (tab === 'audit') loadAuditLogs();
  };

  const openComplaintModal = async (complaintId) => {
    try {
      const res = await ComplaintAPI.getById(complaintId);
      if (res.data.success) {
        setSelectedComplaint(res.data.complaint);
        setUpdateStatus(res.data.complaint.status);
        setUpdateRemarks('');
        setEscalationSuccess(null);
      }
    } catch (e) {
      alert('Error fetching complaint details: ' + e.message);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setStatusUpdating(true);
    try {
      await ComplaintAPI.updateStatus(selectedComplaint.id, {
        status: updateStatus,
        remarks: updateRemarks,
        isPublic: true
      });
      alert(`Status successfully updated to ${updateStatus}`);
      fetchComplaints();
      fetchKPIs();
      openComplaintModal(selectedComplaint.id);
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleEscalateToInstitution = async (targetSystem) => {
    if (!selectedComplaint) return;
    setEscalating(true);
    setEscalationSuccess(null);
    try {
      const res = await GrievanceAPI.escalate(selectedComplaint.id, targetSystem);
      if (res.data.success) {
        setEscalationSuccess(res.data);
        fetchComplaints();
        openComplaintModal(selectedComplaint.id);
      }
    } catch (err) {
      alert('Escalation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setEscalating(false);
    }
  };

  const handleVerifyAuditChain = async () => {
    setVerifyingAudit(true);
    try {
      const res = await AuditAPI.verifyChain();
      if (res.data.success) {
        setAuditVerification(res.data.verification);
      }
    } catch (err) {
      alert('Verification failed: ' + err.message);
    } finally {
      setVerifyingAudit(false);
    }
  };

  const handleTriggerRetentionPurge = async () => {
    if (!window.confirm('Execute statutory retention purge? Complaints past statutory retention limits will have identifying records permanently erased.')) {
      return;
    }
    try {
      const res = await AnalyticsAPI.triggerRetentionPurge();
      setPurgeResult(res.data);
      fetchComplaints();
      fetchKPIs();
    } catch (err) {
      alert('Retention purge failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">Vigilance Operations Center</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as {user?.fullName} ({user?.department || 'Central Directorate'})
          </p>
        </div>

        {/* Quick Export Button */}
        <div className="flex items-center space-x-3">
          <a
            href="/api/v1/analytics/export?format=csv"
            download
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Filed</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{kpis.totalComplaints}</span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">In Review</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{kpis.pendingComplaints}</span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">Escalated</span>
            <span className="text-2xl font-extrabold text-purple-400 mt-1 block">{kpis.escalatedComplaints}</span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Resolved</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{kpis.resolvedComplaints}</span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">Critical Risk</span>
            <span className="text-2xl font-extrabold text-rose-400 mt-1 block">{kpis.criticalRiskCount}</span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block">Total Graft</span>
            <span className="text-2xl font-extrabold text-sky-400 mt-1 block">
              ₹{(kpis.totalExtortedBribeVolume / 100000).toFixed(1)}L
            </span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => handleTabChange('complaints')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold transition-colors border-b-2 ${
            activeTab === 'complaints'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Complaints Ledger ({totalComplaints})</span>
        </button>

        <button
          onClick={() => handleTabChange('departments')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold transition-colors border-b-2 ${
            activeTab === 'departments'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Department Heatmap</span>
        </button>

        <button
          onClick={() => handleTabChange('anomalies')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold transition-colors border-b-2 ${
            activeTab === 'anomalies'
              ? 'border-rose-500 text-rose-400 bg-rose-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Surge & Anomaly Alerts</span>
        </button>

        {(isAuditor || isSuperAdmin) && (
          <button
            onClick={() => handleTabChange('audit')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'audit'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Cryptographic Audit Chain</span>
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => handleTabChange('privacy')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'privacy'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacy Retention & Purge</span>
          </button>
        )}
      </div>

      {/* TAB 1: COMPLAINTS LEDGER */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Tracking ID, Category, City..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchComplaints()}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="">All Risk Tiers</option>
                <option value="CRITICAL">Critical Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              <button
                onClick={fetchComplaints}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Tracking ID</th>
                    <th className="p-4">Department / Category</th>
                    <th className="p-4">AI Risk Priority</th>
                    <th className="p-4">Bribe Demand</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Filed Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {loadingComplaints ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">Loading complaints repository...</td>
                    </tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">No grievances match the current filter criteria.</td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-sky-400">{c.trackingId}</td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-200 block">{c.department}</span>
                          <span className="text-[11px] text-slate-400">{c.category} • {c.city}</span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.riskLevel === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : c.riskLevel === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            }`}
                          >
                            {c.riskLevel} ({c.riskScore}/100)
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-200">
                          {c.bribeAmount ? `₹${c.bribeAmount.toLocaleString()}` : 'Unspecified'}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => openComplaintModal(c.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/20 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENT INTELLIGENCE */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Department-Wise Corruption Metrics & Resolution Velocity</h3>
              <p className="text-xs text-slate-400 mt-1">Aggregated indices across civic and law enforcement authorities.</p>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Department</th>
                  <th className="p-4">Total Complaints</th>
                  <th className="p-4">Critical / High</th>
                  <th className="p-4">Average Risk Index</th>
                  <th className="p-4">Total Bribes Documented</th>
                  <th className="p-4">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {departments.map((d) => (
                  <tr key={d.department} className="hover:bg-slate-800/40">
                    <td className="p-4 font-semibold text-slate-200">{d.department}</td>
                    <td className="p-4 font-mono font-bold text-white">{d.total}</td>
                    <td className="p-4 text-rose-400 font-semibold">{d.criticalHighCount}</td>
                    <td className="p-4 font-bold">{d.avgRiskScore}/100</td>
                    <td className="p-4 text-sky-400 font-bold">₹{d.totalBribeDemanded.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${d.resolutionRate}%` }} />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300">{d.resolutionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANOMALY DETECTION ALERTS */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center">
                <Sparkles className="w-4 h-4 text-purple-400 mr-2" />
                Statistical Outlier & Surge Detection Engine
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Monitors weekly complaint acceleration (z-score analysis) and flags suspicious bribery syndicates.
              </p>
            </div>
            <button
              onClick={loadAnomalies}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
            >
              Re-scan Ledger
            </button>
          </div>

          <div className="space-y-4">
            {anomalies.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
                No active anomaly triggers detected. Complaint distributions are within normal statistical variance.
              </div>
            ) : (
              anomalies.map((a, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-2xl border ${
                    a.severity === 'CRITICAL'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        a.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {a.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Model Confidence: {a.confidence}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{a.entity}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{a.message}</p>
                  <div className="text-[11px] text-slate-400">
                    Observation Metric: <strong className="text-slate-200">{a.metric}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CRYPTOGRAPHIC AUDIT CHAIN */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mr-2" />
                Tamper-Evident SHA-256 Audit Blockchain
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Every administrative event is mathematically linked to the previous block via cryptographic hashing. Any retroactive modification breaks the chain immediately.
              </p>
            </div>
            <button
              onClick={handleVerifyAuditChain}
              disabled={verifyingAudit}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{verifyingAudit ? 'Verifying Math...' : 'Run Mathematical Verification'}</span>
            </button>
          </div>

          {/* Verification Result Banner */}
          {auditVerification && (
            <div
              className={`p-5 rounded-2xl border ${
                auditVerification.isValid
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {auditVerification.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                )}
                <h4 className="text-sm font-bold text-white">
                  {auditVerification.isValid
                    ? 'All Cryptographic Links Verified — Zero Tampering Detected'
                    : 'CHAIN INTEGRITY ALERT: Tampering Detected'}
                </h4>
              </div>
              <p className="text-xs text-slate-300">
                Verified {auditVerification.totalRecords} sequential blocks up to latest hash:{' '}
                <code className="text-[11px] font-mono text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded">
                  {auditVerification.latestHash}
                </code>
              </p>
            </div>
          )}

          {/* Audit Logs Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Block #</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Entity</th>
                    <th className="p-4">Performed By</th>
                    <th className="p-4">SHA-256 Hash</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="p-4 font-bold text-sky-400">#{log.sequenceNumber}</td>
                      <td className="p-4 font-sans font-semibold text-slate-200">{log.action}</td>
                      <td className="p-4 text-slate-400">{log.entityType}</td>
                      <td className="p-4 font-sans text-slate-300">{log.performedByName || 'Anonymous/System'}</td>
                      <td className="p-4 text-emerald-400 truncate max-w-xs" title={log.hash}>
                        {log.hash.slice(0, 16)}...{log.hash.slice(-8)}
                      </td>
                      <td className="p-4 text-slate-400 font-sans">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRIVACY RETENTION & PURGE */}
      {activeTab === 'privacy' && isSuperAdmin && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white mb-2 flex items-center">
              <Lock className="w-5 h-5 text-purple-400 mr-2" />
              Statutory Data Retention & Whistleblower Privacy Policy
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mb-6">
              Compliant with Whistleblower Protection Acts and GDPR Article 17 ("Right to be Forgotten"). Cases past their statutory retention schedule are automatically purged of identifying narratives, phone/email metadata, and evidence files while preserving high-level de-identified statistics.
            </p>

            <button
              onClick={handleTriggerRetentionPurge}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Trigger Manual Privacy Retention Purge</span>
            </button>

            {purgeResult && (
              <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                {purgeResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPLAINT DETAIL MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel-elevated max-w-3xl w-full rounded-2xl p-6 sm:p-8 border border-slate-700 my-8 relative">
            <button
              onClick={() => setSelectedComplaint(null)}
              className="absolute right-6 top-6 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-slate-800 mb-6">
              <span className="text-[11px] font-bold text-sky-400 font-mono">
                {selectedComplaint.trackingId}
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1">
                {selectedComplaint.department}
              </h2>
              <p className="text-xs text-slate-400">
                Category: {selectedComplaint.category} • Location: {selectedComplaint.city}, {selectedComplaint.state || ''}
              </p>
            </div>

            {/* Allegation Description (Decrypted) */}
            <div className="space-y-4 mb-6 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Decrypted Allegation Statement:</label>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedComplaint.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Accused Official:</label>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                    {selectedComplaint.accusedOfficial || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Demanded Bribe Amount:</label>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 font-bold">
                    {selectedComplaint.bribeAmount ? `₹${selectedComplaint.bribeAmount.toLocaleString()}` : 'Not specified'}
                  </div>
                </div>
              </div>

              {/* AI Risk Analysis Insights */}
              {selectedComplaint.nlpAnalysis && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-slate-200 flex items-center mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 mr-1.5" />
                    AI Risk Prioritization Insights ({selectedComplaint.riskScore}/100)
                  </span>
                  <div className="space-y-1.5">
                    {selectedComplaint.riskFactors?.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{f.name}:</span>
                        <span className="text-slate-300">{f.reason} (+{f.score} pts)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attached Evidence Files */}
              {selectedComplaint.evidences?.length > 0 && (
                <div>
                  <label className="font-bold text-slate-300 block mb-2">Decrypted Corroborating Evidence:</label>
                  <div className="space-y-2">
                    {selectedComplaint.evidences.map((ev) => (
                      <div key={ev.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-200 font-medium truncate mr-2">{ev.originalFilename}</span>
                        <a
                          href={`/api/v1/evidence/${ev.id}/download?token=${ev.downloadToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/20"
                        >
                          View / Decrypt
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Institutional Escalation Buttons */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-2">Escalate to Institutional Grievance System:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEscalateToInstitution('CPGRAMS')}
                    disabled={escalating}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>CPGRAMS Central Portal</span>
                  </button>
                  <button
                    onClick={() => handleEscalateToInstitution('LOKAYUKTA')}
                    disabled={escalating}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>State Lokayukta Ombudsman</span>
                  </button>
                </div>
                {escalationSuccess && (
                  <div className="mt-2 text-emerald-400 text-[11px] font-semibold">
                    ✓ Case transmitted to {escalationSuccess.targetSystem} with Reference #{escalationSuccess.externalReferenceId}.
                  </div>
                )}
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleStatusSubmit} className="pt-4 border-t border-slate-800 space-y-3">
                <span className="font-bold text-slate-200 block">Update Investigation Status:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="ESCALATED">ESCALATED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Officer remarks / findings for public timeline..."
                    value={updateRemarks}
                    onChange={(e) => setUpdateRemarks(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={statusUpdating}
                    className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25"
                  >
                    {statusUpdating ? 'Updating...' : 'Save Status & Notify Complainant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

