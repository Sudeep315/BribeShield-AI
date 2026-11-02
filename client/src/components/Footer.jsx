import React from 'react';
import { Shield, Lock, FileCheck2, Cpu, CheckCircle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 mt-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-5 h-5 text-sky-400" />
              <span className="font-bold text-base text-slate-100">BribeShield AI Enterprise</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              A high-security, anonymous whistleblower reporting infrastructure equipped with AES-256 field encryption, natural language risk classification, and tamper-evident cryptographic hash chains compliant with statutory whistleblowing guidelines.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Security Architecture</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>AES-256-GCM Cryptography</span>
              </li>
              <li className="flex items-center space-x-2">
                <FileCheck2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Tamper-Evident SHA-256 Hash Chain</span>
              </li>
              <li className="flex items-center space-x-2">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>NLP Risk Prioritization Engine</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Integrations</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>CPGRAMS Central Grievance Sync</li>
              <li>State Lokayukta Secure API</li>
              <li>Central Vigilance Commission (CVC)</li>
              <li>Encrypted Evidence Cloud Storage</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>© 2026 BribeShield AI. Protected by Whistleblower Protection Act & Zero-Knowledge Architecture.</p>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0">
            <span className="inline-flex items-center text-emerald-400 font-medium">
              <CheckCircle className="w-3 h-3 mr-1" /> System Operational
            </span>
            <span className="text-slate-400">v2.0.0 Production Release</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

