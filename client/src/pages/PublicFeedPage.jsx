import React, { useState, useEffect } from 'react';
import { ComplaintAPI, AdvisoryAPI } from '../services/api';
import {
  Shield,
  Search,
  BookOpen,
  MessageSquare,
  Building,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Star,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const PublicFeedPage = () => {
  const [viewTab, setViewTab] = useState('feed'); // 'feed' | 'advisories' | 'feedback'
  const [complaints, setComplaints] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Feedback Form State
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('General Feedback');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchFeed();
    fetchAdvisories();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await ComplaintAPI.getPublicFeed({ q: search });
      if (res.data.success) {
        setComplaints(res.data.complaints);
        setTotalCount(res.data.total);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvisories = async () => {
    try {
      const res = await AdvisoryAPI.getAll();
      if (res.data.success) setAdvisories(res.data.advisories);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await AdvisoryAPI.submitFeedback({ rating, comments, category: feedbackCategory });
      setFeedbackSuccess(true);
      setComments('');
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err) {
      alert('Failed to submit feedback: ' + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Transparent Civic Governance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Public Transparency Feed & Advisories</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          De-identified public ledger of anti-bribery complaints, statutory citizen protection guidelines, and feedback.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center space-x-2 mb-10">
        <button
          onClick={() => setViewTab('feed')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            viewTab === 'feed'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Live Grievance Feed ({totalCount})</span>
        </button>

        <button
          onClick={() => setViewTab('advisories')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            viewTab === 'advisories'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Citizen Rights & Advisories</span>
        </button>

        <button
          onClick={() => setViewTab('feedback')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            viewTab === 'feedback'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Platform Feedback</span>
        </button>
      </div>

      {/* TAB 1: LIVE FEED */}
      {viewTab === 'feed' && (
        <div className="space-y-6">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search department, city, or tracking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchFeed()}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints.map((c) => (
              <div key={c.trackingId} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sky-400">{c.trackingId}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.riskLevel === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : c.riskLevel === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    }`}
                  >
                    {c.riskLevel} Risk ({c.riskScore}/100)
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{c.department}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {c.city}
                    </span>
                    <span>•</span>
                    <span>{c.category}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Status: <strong className="text-emerald-400 font-semibold">{c.status}</strong>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CITIZEN ADVISORIES */}
      {viewTab === 'advisories' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {advisories.map((a) => (
            <div key={a.id} className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                  {a.category}
                </span>
                <span className="text-xs text-slate-400">{a.date}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{a.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{a.summary}</p>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-sky-300">
                <strong>Recommended Action:</strong> {a.action}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PLATFORM FEEDBACK */}
      {viewTab === 'feedback' && (
        <div className="max-w-lg mx-auto glass-panel p-8 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-1">Citizen Experience Feedback</h3>
          <p className="text-xs text-slate-400 mb-6">
            Help improve BribeShield AI's transparency tools and anonymous reporting interface.
          </p>

          {feedbackSuccess ? (
            <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-300 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              Thank you! Your feedback has been securely registered.
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-2">Overall Experience Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1.5 rounded-lg transition-transform ${
                        star <= rating ? 'text-amber-400 scale-110' : 'text-slate-600'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Feedback Category</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="General Feedback">General Feedback</option>
                  <option value="Submission Experience">Complaint Submission Experience</option>
                  <option value="AI Risk Accuracy">AI Risk Scoring Accuracy</option>
                  <option value="Anonymity & Privacy">Privacy & Confidentiality</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Your Comments or Suggestions</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us what worked well or what needs improvement..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={submittingFeedback}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
              >
                {submittingFeedback ? 'Recording...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

