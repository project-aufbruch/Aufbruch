import React, { useState } from 'react';
import { Shield, FileText, CheckCircle2, Lock, X, Search, HelpCircle, Heart, Mail, ExternalLink, Printer } from 'lucide-react';

interface LegalDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms' | 'pet_compliance';
}

export const LegalDocument: React.FC<LegalDocumentProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'pet_compliance'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white text-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl border border-zinc-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header - Styled to mimic a clean, friendly Pet Care App Legal Portal */}
        <div className="p-5 border-b border-zinc-200 bg-amber-50/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg font-bold shadow-sm">
              🐾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-zinc-900 tracking-tight">
                  PetCare Companion legal & Privacy Center
                </h2>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                  v2.4 Verified
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Official terms, pet data safety standards, and user privacy guarantees
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
            title="Close Legal Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium shrink-0">
          <div className="flex gap-2 py-2">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                activeTab === 'privacy'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                activeTab === 'terms'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </button>

            <button
              onClick={() => setActiveTab('pet_compliance')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                activeTab === 'pet_compliance'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-200/60'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Pet Care Standards</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-500">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>GDPR & CCPA Pet Data Protection Compliant</span>
          </div>
        </div>

        {/* Legal Text Scroll Container */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-zinc-700 font-sans">
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-amber-900 block">PETCARE COMPANION PRIVACY NOTICE</span>
                <p className="text-amber-800">
                  Effective Date: January 1, 2026 • Last Reviewed: August 2026. This Privacy Policy explains how PetCare Companion ("we", "our", or "us") collects, uses, and safeguards pet owner profiles, animal health logs, and local weather preferences.
                </p>
              </div>

              {/* Section 1 */}
              <section className="space-y-2">
                <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  1. Information We Collect (Pet Profiles & Local Logs)
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  We are dedicated to maintaining strict privacy boundaries for all pet owners and animal caregivers. When you utilize the PetCare Companion application, we collect only minimal data strictly required to render pet care reminders and local weather notifications:
                </p>
                <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1">
                  <li><strong>Pet Identity Metadata:</strong> Pet names, breeds, vaccination schedules, and optional photo avatars stored locally on your device.</li>
                  <li><strong>Local Weather Preferences:</strong> Coarse geolocation parameters utilized to deliver dog-walking temperature alerts and outdoor humidity warnings.</li>
                  <li><strong>Device Telemetry:</strong> Anonymized application diagnostic logs to ensure uninterrupted notification delivery for pet feeding alarms.</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section className="space-y-2">
                <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  2. Local Storage & Zero Third-Party Monetization
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Your pet's health logs, dietary logs, and photo memories reside primarily in encrypted local browser storage (IndexedDB/LocalStorage). PetCare Companion does NOT sell, rent, or trade your pet profile information to commercial advertisers, pet food manufacturers, or data brokers.
                </p>
              </section>

              {/* Section 3 */}
              <section className="space-y-2">
                <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  3. Cookie & Local Cache Policy
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  We use essential session storage cookies strictly to maintain user preferences (such as dark mode preferences and metric vs. imperial weight units for pet weight tracking). No tracking pixels or invasive behavioral cookies are placed on your device.
                </p>
              </section>

              {/* Section 4 */}
              <section className="space-y-2">
                <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  4. Your Privacy Rights & Data Deletion
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Under GDPR and CCPA regulations, you maintain full authority over your data. You may instantly wipe all stored pet profile data, vaccination logs, and cache settings at any time using the "Reset Cache" function in your settings tab.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-indigo-900 block">PETCARE COMPANION TERMS OF SERVICE</span>
                <p className="text-indigo-800">
                  Please read these Terms of Service carefully before using PetCare Companion. By accessing or using our pet daily news and care logging software, you agree to be bound by these Terms.
                </p>
              </div>

              {/* Section 1 */}
              <section className="space-y-2">
                <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  1. Zero Tolerance Policy for Illegal Activities & Prohibited Content
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  AUFBRUCH is engineered to uphold fundamental free speech and borderless international communication for human rights advocates, journalists, and global citizens. However, to maintain legal compliance and public safety, <strong>illegal activities are strictly forbidden on this platform</strong>. The following categories are subject to zero tolerance and automated local pre-publication rejection:
                </p>
                <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1">
                  <li><strong>Child Exploitation & CSAM:</strong> Any media or text involving child sexual abuse materials or minor exploitation. Automatically matched and blocked via perceptual hash signatures.</li>
                  <li><strong>Violent Threats & Terrorism:</strong> Actionable violent threats, mass casualty plots, terrorism recruitment, or instructions for manufacturing explosives/weapons.</li>
                  <li><strong>Illegal Trade & Contraband:</strong> Solicitations or distribution of illicit drugs (fentanyl, heroin), illegal firearms markets, human trafficking, stolen identity sales, or hitman hires.</li>
                  <li><strong>Cybercrime & Malware:</strong> Distribution of ransomware payloads, botnet C2 links, credential harvesting, or cybercrime exploit tools.</li>
                  <li><strong>Doxxing & Financial Leaks:</strong> Unredacted publication of stolen credit card numbers, Social Security numbers, or private identity data.</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section className="space-y-2">
                <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  2. Disclaimer of Veterinary Advice
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Content provided within PetCare Companion, including pet care articles, dietary calculators, and community pet tips, is intended for general informational purposes only. It does NOT constitute professional veterinary medical advice. Always consult a licensed veterinarian for emergency animal medical care.
                </p>
              </section>

              {/* Section 3 */}
              <section className="space-y-2">
                <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  3. Limitation of Liability
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  PetCare Companion and its developers shall not be liable for indirect, incidental, or consequential damages resulting from missed pet medication reminders or local device storage clearing.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'pet_compliance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-emerald-900 block">ANIMAL WELFARE & COMPLIANCE CHARTER</span>
                <p className="text-emerald-800">
                  Our commitment to responsible pet ownership, humane animal treatment, and community safety.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                  Ethical Pet Care Standards
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  All pet photo submissions and community posts are checked to ensure animal welfare compliance. We encourage adoption, responsible breeding, and positive reinforcement training techniques across our user community.
                </p>
              </section>
            </div>
          )}

          {/* Contact Support Block */}
          <div className="p-4 bg-zinc-100 rounded-xl border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-700">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-zinc-900 block">Need Legal or Support Assistance?</strong>
                <span className="text-zinc-500">Contact our PetCare compliance desk: <a href="mailto:support@petcare-companion-app.org" className="text-amber-600 hover:underline">support@petcare-companion-app.org</a></span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white hover:bg-zinc-200 border border-zinc-300 text-zinc-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Policy</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>PetCare Companion Org • All Rights Reserved © 2026</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
          >
            I Accept Terms
          </button>
        </div>
      </div>
    </div>
  );
};
