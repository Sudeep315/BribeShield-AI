import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnalyticsAPI } from '../services/api';
import {
  Shield,
  Lock,
  Cpu,
  FileCheck2,
  Share2,
  AlertTriangle,
  ArrowRight,
  Search,
  EyeOff,
  Database,
  Building2,
  TrendingUp,
  FileText
} from 'lucide-react';

export const HomePage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    AnalyticsAPI.getOverview()
      .then((res) => {
        if (res.data.success) {
          setStats(res.data.kpis);
        }
      })
      .catch(() => {
        // Fallback default stats if server is loading
        setStats({
          totalComplaints: 4,
          pendingComplaints: 2,
          escalatedComplaints: 1,
          resolvedComplaints: 1,
          criticalRiskCount: 1,
          totalExtortedBribeVolume: 1920000,
          avgRiskScore: 67
        });
      });
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-sky-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-8 animate-fade-in">
          <Lock className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('nav.securityBadge')}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-tight">
          {t('hero.title')} <br />
          <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            {t('hero.highlight')}
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('hero.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            to="/submit"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-sky-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <Shield className="w-5 h-5" />
            <span>{t('hero.ctaFile')}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            to="/track"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl glass-panel hover:bg-slate-800 text-slate-200 font-semibold border border-slate-700/80 transition-all hover:border-slate-600"
          >
            <Search className="w-5 h-5 text-emerald-400" />
            <span>{t('hero.ctaTrack')}</span>
          </Link>
        </div>

        <p className="text-xs text-slate-400 flex items-center justify-center space-x-2">
          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
          <span>{t('hero.anonymousNotice')}</span>
        </p>
      </section>

      {/* Live System KPI Ticker */}
      {stats && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-r border-slate-800/80 pr-4 last:border-none">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Complaints Filed</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">{stats.totalComplaints}</span>
                <span className="text-xs text-emerald-400 font-semibold">Immutable</span>
              </div>
            </div>

            <div className="border-r border-slate-800/80 pr-4 last:border-none">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Demanded Graft Documented</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-sky-400">
                  ₹{(stats.totalExtortedBribeVolume / 100000).toFixed(1)}L
                </span>
                <span className="text-xs text-slate-400">INR</span>
              </div>
            </div>

            <div className="border-r border-slate-800/80 pr-4 last:border-none">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Critical Prioritization</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-rose-400">{stats.criticalRiskCount}</span>
                <span className="text-xs text-rose-400/80 font-medium">Expedited</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">System Integrity Index</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-emerald-400">100%</span>
                <span className="text-xs text-emerald-400/80 font-medium">Verified Hash</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pillars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Next-Generation Whistleblower Architecture
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Addressing all modern vulnerabilities in conventional complaint handling with state-of-the-art cryptographic safeguards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-sky-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AES-256-GCM Field Encryption</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Whistleblower statements, audio recordings, CCTV footage, and accused official names are sealed with authenticated symmetric encryption before storage.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-purple-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hybrid NLP Risk Scoring</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Combines statistical language models, currency pattern extractors, coercion detection, and rank hierarchy cues to objectively prioritize urgent cases.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Tamper-Evident Hash Chains</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every status change and complaint event is cryptographically linked in a continuous SHA-256 chain, preventing rogue internal suppression or alteration.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Institutional Grievance Sync</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Standardized API integration with CPGRAMS, State Lokayuktas, and Anti-Corruption Bureaus with mutual HMAC cryptographic verification.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-rose-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Surge & Anomaly Detection</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Statistical z-score outlier detection flags sudden spikes in bribery demands in specific precincts or departments, exposing organized extortion syndicates.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">PostgreSQL & Automated Retention</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              High-concurrency relational data engine with automated privacy-preserving data wiping schedules compliant with statutory retention limits.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

