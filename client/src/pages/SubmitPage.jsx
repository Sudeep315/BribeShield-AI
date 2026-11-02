import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ComplaintAPI } from '../services/api';
import {
  Shield,
  Lock,
  Upload,
  FileCheck,
  X,
  AlertCircle,
  CheckCircle2,
  Copy,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';

const DEPARTMENTS = [
  'Police & Law Enforcement',
  'Revenue & Land Records',
  'Municipal Corporation & Building Permits',
  'Public Works Department (PWD)',
  'Transport & Regional Transport Office (RTO)',
  'Health & Family Welfare / Hospital Services',
  'Judicial Administration & Court Clerks',
  'Education & Examination Boards',
  'Civil Supplies & Rationing',
  'Electricity & Water Supply Utilities',
  'Taxation & Excise Directorate',
  'Environmental & Forest Clearances'
];

const CATEGORIES = [
  'Extortion / Demand of Cash or Valuables',
  'Withholding Official Certificate / NOC / License',
  'Deliberate Administrative Stalling / File Pending',
  'Threat of False Case / FIR / Confiscation',
  'Tender Collusion & Contract Kickback',
  'Misappropriation of Public Funds',
  'Embezzlement or Fraudulent Billing'
];

export const SubmitPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    department: '',
    category: '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentLocation: '',
    city: '',
    state: '',
    description: '',
    bribeAmount: '',
    accusedOfficial: '',
    contactEmail: '',
    contactPhone: '',
    notificationChannel: 'NONE',
    isAnonymous: true,
    consentAgreed: false
  });

  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (files.length + selected.length > 5) {
        setError('Maximum 5 evidence files permitted per grievance.');
        return;
      }
      setFiles((prev) => [...prev, ...selected]);
      setError(null);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.department || !formData.category || !formData.incidentLocation || !formData.city || !formData.description) {
      setError('Please fill in all mandatory fields indicated with an asterisk (*).');
      return;
    }

    if (!formData.consentAgreed) {
      setError('You must review and agree to the statutory whistleblower consent declaration.');
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      data.append('languageCode', i18n.language || 'en');

      files.forEach((file) => {
        data.append('evidence', file);
      });

      const res = await ComplaintAPI.submit(data);
      if (res.data.success) {
        setSuccessResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit complaint. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyTrackingId = () => {
    if (successResult?.trackingId) {
      navigator.clipboard.writeText(successResult.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Success Modal */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel-elevated max-w-lg w-full rounded-2xl p-8 border border-sky-500/30 text-center relative">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-2">Complaint Encrypted & Filed</h3>
            <p className="text-slate-300 text-xs mb-6">
              Your grievance has been stored in the immutable anti-corruption repository. Keep your unique Tracking ID safe:
            </p>

            <div className="bg-slate-900/90 border border-sky-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Your Tracking ID</span>
                <p className="text-xl font-mono font-bold text-sky-400 tracking-wider">
                  {successResult.trackingId}
                </p>
              </div>
              <button
                onClick={copyTrackingId}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold border border-sky-500/20 transition-all"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* AI Risk Classification Banner */}
            {successResult.riskAssessment && (
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 text-left mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                    AI Risk Prioritization
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      successResult.riskAssessment.level === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : successResult.riskAssessment.level === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {successResult.riskAssessment.level} ({successResult.riskAssessment.score}/100)
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {successResult.riskAssessment.summary}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => navigate(`/track?id=${successResult.trackingId}`)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all"
              >
                <span>Track Complaint Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Statutory Whistleblower Protection</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">
          {t('form.step1Title')}
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          All narrative descriptions, attached audio/video, and named officials are encrypted using client-side certified AES-256-GCM.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>{error}</div>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 sm:p-10 border border-slate-800 space-y-8">
        {/* Section 1: Department & Details */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 mb-4 pb-2 border-b border-slate-800 flex items-center">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 inline-flex items-center justify-center text-xs mr-2 font-mono">1</span>
            {t('form.step1Title')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t('form.department')} <span className="text-rose-400">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="">{t('form.selectDepartment')}</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t('form.category')} <span className="text-rose-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="">{t('form.selectCategory')}</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t('form.incidentDate')} <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                name="incidentDate"
                value={formData.incidentDate}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t('form.location')} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="incidentLocation"
                placeholder="e.g. Sub-Registrar Desk 3, Room 104"
                value={formData.incidentLocation}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t('form.city')} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="city"
                placeholder="e.g. Bengaluru, Mumbai, Delhi"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t('form.state')}
              </label>
              <input
                type="text"
                name="state"
                placeholder="e.g. Karnataka, Maharashtra"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Allegation & Evidence */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 mb-4 pb-2 border-b border-slate-800 flex items-center">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 inline-flex items-center justify-center text-xs mr-2 font-mono">2</span>
            {t('form.step2Title')}
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t('form.description')} <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                placeholder={t('form.descriptionPlaceholder')}
                value={formData.description}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-sky-500 leading-relaxed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {formData.description.length} characters • AES-256 encrypted before transmission
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {t('form.bribeAmount')}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    name="bribeAmount"
                    placeholder="e.g. 50000"
                    value={formData.bribeAmount}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {t('form.accused')}
                </label>
                <input
                  type="text"
                  name="accusedOfficial"
                  placeholder={t('form.accusedPlaceholder')}
                  value={formData.accusedOfficial}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Evidence File Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t('form.evidenceUpload')}
              </label>
              <div className="border-2 border-dashed border-slate-700/80 hover:border-sky-500/60 rounded-2xl p-6 text-center transition-colors bg-slate-900/50">
                <input
                  type="file"
                  id="evidenceInput"
                  multiple
                  onChange={handleFileChange}
                  accept="image/*,video/mp4,application/pdf,audio/*"
                  className="hidden"
                />
                <label htmlFor="evidenceInput" className="cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-200 mb-1">{t('form.dragFiles')}</p>
                  <p className="text-[11px] text-slate-400">{t('form.supportedFiles')}</p>
                </label>
              </div>

              {/* Selected files preview */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-4 h-4 text-sky-400 flex-shrink-0" />
                        <span className="text-slate-200 font-medium truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Privacy & Alerts */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 mb-4 pb-2 border-b border-slate-800 flex items-center">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 inline-flex items-center justify-center text-xs mr-2 font-mono">3</span>
            {t('form.step3Title')}
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t('form.notificationChannel')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                  formData.notificationChannel === 'NONE'
                    ? 'bg-sky-500/10 border-sky-500/40 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="notificationChannel"
                    value="NONE"
                    checked={formData.notificationChannel === 'NONE'}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-xs font-bold block mb-1">Zero Contact / Anonymous</span>
                    <span className="text-[11px] text-slate-400 leading-tight block">
                      {t('form.noneOption')}
                    </span>
                  </div>
                </label>

                <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                  formData.notificationChannel === 'EMAIL'
                    ? 'bg-sky-500/10 border-sky-500/40 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="notificationChannel"
                    value="EMAIL"
                    checked={formData.notificationChannel === 'EMAIL'}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-xs font-bold block mb-1">Email Status Notifications</span>
                    <span className="text-[11px] text-slate-400 leading-tight block">
                      Receive notifications when status changes (email is encrypted).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {formData.notificationChannel === 'EMAIL' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Encrypted Email Address
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  placeholder={t('form.emailPlaceholder')}
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  required={formData.notificationChannel === 'EMAIL'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            {/* Consent Checkbox */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="consentAgreed"
                  checked={formData.consentAgreed}
                  onChange={handleInputChange}
                  required
                  className="mt-1 rounded text-sky-500 focus:ring-sky-500"
                />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-slate-100 block mb-1">{t('form.consentHeading')}</strong>
                  {t('form.consentText')}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            <span>{submitting ? t('form.submitting') : t('form.submitBtn')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

