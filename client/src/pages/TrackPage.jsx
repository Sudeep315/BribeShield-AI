import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ComplaintAPI } from '../services/api';
import {
  Search,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Building,
  Calendar,
  MapPin,
  Lock,
  ArrowRight,
  Sparkles,
  FileBadge2
} from 'lucide-react';

export const TrackPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const idFromQuery = searchParams.get('id');
    if (idFromQuery) {
      setTrackingId(idFromQuery);
      performLookup(idFromQuery);
    }
  }, [searchParams]);

  const performLookup = async (idToSearch) => {
    if (!idToSearch || !idToSearch.trim()) {
      setError('Please enter a valid Tracking ID.');
      return;
    }
    setLoading(true);
    setError(null);
    setComplaint(null);

    try {
      const res = await ComplaintAPI.track(idToSearch.trim());
      if (res.data.success) {
        setComplaint(res.data.complaint);
      } else {
        setError(res.data.message || 'Complaint not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No record matches this Tracking ID. Please double check.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performLookup(trackingId);
  };

  const getStatusBadge = (status) => {
    const map = {
      SUBMITTED: { label: 'Submitted', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
      UNDER_REVIEW: { label: 'Under Review', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      INVESTIGATING: { label: 'Investigation Active', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      ESCALATED: { label: 'Escalated to Vigilance', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
      RESOLVED: { label: 'Resolved & Redressed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      REJECTED: { label: 'Closed / Rejected', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
    };
    const s = map[status] || { label: status, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>Anonymous Public Status Ledger</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">{t('track.title')}</h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          {t('track.subtitle')}
        </p>
      </div>

      {/* Lookup Bar */}
      <form onSubmit={handleSearch} className="mb-10 max-w-xl mx-auto">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={t('track.placeholder')}
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
            className="w-full pl-4 pr-32 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-sky-500 shadow-xl"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            {loading ? (
              <Clock className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>{loading ? t('track.searching') : t('track.searchBtn')}</span>
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="max-w-xl mx-auto mb-10 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>{error}</div>
        </div>
      )}

      {/* Complaint Details Result */}
      {complaint && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Summary Card */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tracking Identification</span>
                <h2 className="text-2xl font-extrabold text-white font-mono tracking-wider text-sky-400 mt-1">
                  {complaint.trackingId}
                </h2>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(complaint.status)}
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  complaint.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                  complaint.riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-sky-500/20 text-sky-400 border-sky-500/30'
                }`}>
                  Risk: {complaint.riskLevel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-xs">
              <div className="flex items-start space-x-3">
                <Building className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-medium">Department</span>
                  <span className="text-slate-200 font-semibold">{complaint.department}</span>
                  <span className="text-slate-400 block text-[11px] mt-0.5">{complaint.category}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-medium">Date of Occurrence</span>
                  <span className="text-slate-200 font-semibold">
                    {new Date(complaint.incidentDate).toLocaleDateString()}
                  </span>
                  <span className="text-slate-400 block text-[11px] mt-0.5">
                    Filed on {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-medium">Jurisdiction / Location</span>
                  <span className="text-slate-200 font-semibold">{complaint.city}</span>
                  <span className="text-slate-400 block text-[11px] mt-0.5">{complaint.state || 'General Region'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Milestones */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6 flex items-center">
              <Clock className="w-4 h-4 text-sky-400 mr-2" />
              {t('track.timelineHeading')}
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {complaint.timelines && complaint.timelines.length > 0 ? (
                complaint.timelines.map((item, idx) => (
                  <div key={item.id || idx} className="relative group">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-sky-500 border-2 border-slate-950 ring-4 ring-sky-500/20" />
                    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-sky-400">{item.newStatus}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.remarks}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No public milestones recorded yet.</p>
              )}
            </div>
          </div>

          {/* Attached Evidence Records (Decrypted on demand via temporary token) */}
          {complaint.evidences && complaint.evidences.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center">
                <FileBadge2 className="w-4 h-4 text-emerald-400 mr-2" />
                {t('track.evidenceHeading')} ({complaint.evidences.length})
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Evidence files are AES-256 encrypted at rest. Click below to stream the decrypted file with your authorized session token.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complaint.evidences.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5 truncate mr-2">
                      <FileText className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      <div className="truncate text-xs">
                        <span className="text-slate-200 font-medium truncate block">{ev.originalFilename}</span>
                        <span className="text-[10px] text-slate-400">
                          {(ev.fileSizeBytes / 1024).toFixed(1)} KB • {ev.mimeType}
                        </span>
                      </div>
                    </div>

                    <a
                      href={`/api/v1/evidence/${ev.id}/download?token=${ev.downloadToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold border border-sky-500/20 transition-all flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>View</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

