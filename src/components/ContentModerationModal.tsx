import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, EyeOff, UserX, AlertTriangle, Cpu, Check, Lock, Info, X, Zap, FileText } from 'lucide-react';
import { communitySafetyManager } from '../services/safetyFilter';

interface ContentModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegal?: () => void;
}

export const ContentModerationModal: React.FC<ContentModerationModalProps> = ({ isOpen, onClose, onOpenLegal }) => {
  const [csamHashFilterActive, setCsamHashFilterActive] = useState(true);
  const [threatFilterActive, setThreatFilterActive] = useState(true);
  const [doxxingFilterActive, setDoxxingFilterActive] = useState(true);
  const [illegalTradeFilterActive, setIllegalTradeFilterActive] = useState(true);
  const [cybercrimeFilterActive, setCybercrimeFilterActive] = useState(true);
  const [mutedCount, setMutedCount] = useState(communitySafetyManager.getMutedCount());
  const [reportedCount, setReportedCount] = useState(communitySafetyManager.getReportedCount());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden text-zinc-100">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-zinc-100">Content Safety & Compliance Shield</h2>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                  Client-Side Verification
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Decentralized protection against extreme illegal harm without central censorship
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 font-mono"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 font-mono text-xs">
          {/* Architecture Concept Explanation */}
          <div className="p-3.5 bg-zinc-950 border border-emerald-900/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>How Freedom of Speech & Harm Prevention Coexist:</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Unlike legacy platforms (Twitter/Facebook) that use central censors to suppress opinions, 
              <strong> AUFBRUCH</strong> implements <strong>on-device cryptographic perceptual hashing (aHash/dHash)</strong> 
              and <strong>Web-of-Trust (WoT) decentralized filtering</strong>. Extreme illegal content (CSAM, violent threats, doxxing) 
              is caught locally before relay transmission, while legitimate free expression remains 100% uncensorable.
            </p>
          </div>

          {/* Safety Toggles List */}
          <div className="space-y-2.5">
            {/* CSAM Perceptual Hash Filter */}
            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block">CSAM & Illegal Harm Hash Matcher</strong>
                  <span className="text-[11px] text-zinc-500">
                    Matches image canvas pixels against prohibited perceptual signatures (PhotoDNA/aHash) prior to IPFS upload.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCsamHashFilterActive(!csamHashFilterActive)}
                className={`px-2.5 py-1 rounded border font-bold shrink-0 transition-colors ${
                  csamHashFilterActive
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                {csamHashFilterActive ? 'Active' : 'Disabled'}
              </button>
            </div>

            {/* Imminent Threat & Violence Shield */}
            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block">Imminent Violent Threat Detector</strong>
                  <span className="text-[11px] text-zinc-500">
                    Screens broadcasts for actionable terror attacks and explosive manufacturing instructions.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setThreatFilterActive(!threatFilterActive)}
                className={`px-2.5 py-1 rounded border font-bold shrink-0 transition-colors ${
                  threatFilterActive
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                {threatFilterActive ? 'Active' : 'Disabled'}
              </button>
            </div>

            {/* Anti-Doxxing & Financial PII Guard */}
            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block">Anti-Doxxing & Financial PII Guard</strong>
                  <span className="text-[11px] text-zinc-500">
                    Detects and blocks unredacted credit cards, SSNs, and private home address leaks.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDoxxingFilterActive(!doxxingFilterActive)}
                className={`px-2.5 py-1 rounded border font-bold shrink-0 transition-colors ${
                  doxxingFilterActive
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                {doxxingFilterActive ? 'Active' : 'Disabled'}
              </button>
            </div>

            {/* Illegal Contraband & Human Trafficking Shield */}
            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block">Illegal Contraband & Trafficking Shield</strong>
                  <span className="text-[11px] text-zinc-500">
                    Blocks illegal firearms markets, illicit drug trade, human trafficking recruitment, and hitman solicitations.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIllegalTradeFilterActive(!illegalTradeFilterActive)}
                className={`px-2.5 py-1 rounded border font-bold shrink-0 transition-colors ${
                  illegalTradeFilterActive
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                {illegalTradeFilterActive ? 'Active' : 'Disabled'}
              </button>
            </div>

            {/* Cybercrime & Malware Guard */}
            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block">Cybercrime & Ransomware Guard</strong>
                  <span className="text-[11px] text-zinc-500">
                    Screens for malicious payload downloads, botnet command servers, and credential dumping links.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCybercrimeFilterActive(!cybercrimeFilterActive)}
                className={`px-2.5 py-1 rounded border font-bold shrink-0 transition-colors ${
                  cybercrimeFilterActive
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                {cybercrimeFilterActive ? 'Active' : 'Disabled'}
              </button>
            </div>

            {/* Web-of-Trust Mute & User Reports Summary */}
            <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <UserX className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block">User Reports & WoT Mute Set</strong>
                  <span className="text-[11px] text-zinc-500">
                    {mutedCount} authors muted • {reportedCount} broadcasts blocked by illegal activity reports.
                  </span>
                </div>
              </div>
              <span className="text-[11px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded font-mono">
                {reportedCount} Reported
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between font-mono text-[11px] text-zinc-500">
          {onOpenLegal ? (
            <button
              onClick={() => {
                onClose();
                onOpenLegal();
              }}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 underline font-sans text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Decoy Privacy & Terms</span>
            </button>
          ) : (
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Client-Side Verified</span>
            </span>
          )}
          <button
            onClick={onClose}
            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 rounded-xl transition-transform active:scale-95"
          >
            Apply Protection Rules
          </button>
        </div>
      </div>
    </div>
  );
};
