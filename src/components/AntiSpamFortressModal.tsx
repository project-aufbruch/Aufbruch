import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Trash2,
  Lock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RefreshCw,
  X,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';
import { UserIdentity, SpamMetrics, SpamQuarantineItem } from '../types';
import { antiSpamFortress } from '../services/antiSpamFortress';

interface AntiSpamFortressModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: UserIdentity | null;
}

export const AntiSpamFortressModal: React.FC<AntiSpamFortressModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [metrics, setMetrics] = useState<SpamMetrics>({
    totalScanned: 0,
    totalQuarantined: 0,
    powRejections: 0,
    bayesianRejections: 0,
    sybilClustersBusted: 0,
    spamFreePercentage: 100,
  });
  const [quarantine, setQuarantine] = useState<SpamQuarantineItem[]>([]);
  const [strictMode, setStrictMode] = useState<boolean>(true);
  const [powDifficulty, setPowDifficulty] = useState<number>(8);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStrictMode(antiSpamFortress.isStrictEnabled());
      setPowDifficulty(antiSpamFortress.getMinPowDifficulty());
      const unsub = antiSpamFortress.subscribe((m, q) => {
        setMetrics(m);
        setQuarantine(q);
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplySettings = () => {
    antiSpamFortress.setStrictSpamFreeMode(strictMode);
    antiSpamFortress.setMinPowDifficulty(powDifficulty);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  const handleClearQuarantine = () => {
    antiSpamFortress.clearQuarantine();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl h-[88vh] max-h-[800px] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Fortress 100% Spam-Free Pipeline
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  {metrics.spamFreePercentage}% Pure
                </span>
              </div>
              <p className="text-xs text-slate-400">
                NIP-13 PoW Hashcash Mining · Bayesian Heuristic Classifier · Sybil Cluster Elimination
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Live Metrics Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-400">Scanned Events</span>
              <p className="text-xl font-extrabold text-white font-mono">{metrics.totalScanned}</p>
              <p className="text-[10px] text-slate-500">Across active relays</p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-red-500/20 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-mono text-red-400">Quarantined Spam</span>
              <p className="text-xl font-extrabold text-red-400 font-mono">{metrics.totalQuarantined}</p>
              <p className="text-[10px] text-slate-500">Interceptions blocked</p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-amber-500/20 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-mono text-amber-400">PoW Rejections</span>
              <p className="text-xl font-extrabold text-amber-400 font-mono">{metrics.powRejections}</p>
              <p className="text-[10px] text-slate-500">Below target difficulty</p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-purple-500/20 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-mono text-purple-400">Sybil Clusters</span>
              <p className="text-xl font-extrabold text-purple-400 font-mono">{metrics.sybilClustersBusted}</p>
              <p className="text-[10px] text-slate-500">Duplicate bot rings</p>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Fortress Anti-Spam Gate Configuration
                </h3>
                <p className="text-xs text-slate-400">
                  Enforce mathematical cost-of-forgery barriers against automated spammers
                </p>
              </div>
              {savedSuccess && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Settings Applied!
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Strict Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="space-y-0.5">
                  <p className="font-bold text-xs text-white">100% Spam-Free Strict Gate</p>
                  <p className="text-[11px] text-slate-400">
                    Automatically drops any incoming broadcast failing NIP-13 PoW or exhibiting bot entropy anomalies.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStrictMode(!strictMode)}
                  className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                    strictMode ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>

              {/* PoW Difficulty Level */}
              <div className="space-y-2 p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">
                    Minimum PoW Nonce Difficulty: <span className="text-emerald-400 font-mono">{powDifficulty} bits</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {powDifficulty === 8
                      ? 'Light (~50ms)'
                      : powDifficulty === 12
                      ? 'Standard (~250ms)'
                      : powDifficulty === 16
                      ? 'Strict (~1.5s)'
                      : 'Fortress (~5s)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="4"
                  value={powDifficulty}
                  onChange={(e) => setPowDifficulty(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0 bits (Off)</span>
                  <span>8 bits (Light)</span>
                  <span>12 bits (Standard)</span>
                  <span>16 bits (Strict)</span>
                  <span>20 bits (High-PoW)</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleApplySettings}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Fortress Defense Policy
                </button>
              </div>
            </div>
          </div>

          {/* Live Quarantine Drawer */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Live Spam Quarantine Log ({quarantine.length})
                </h3>
              </div>
              {quarantine.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearQuarantine}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Log
                </button>
              )}
            </div>

            {quarantine.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                ✨ Quarantine queue is empty. All incoming relays are 100% clean.
              </p>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {quarantine.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                            item.rejectionReason === 'failed_pow'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : item.rejectionReason === 'sybil_duplicate'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {item.rejectionReason.replace(/_/g, ' ')}
                        </span>
                        <span className="font-bold text-slate-200">{item.authorPetname}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          PoW: {item.powDifficultyFound}/{item.powDifficultyRequired}b
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] font-mono line-clamp-1">
                        "{item.contentSnippet}"
                      </p>
                    </div>

                    <div className="text-right text-[10px] text-slate-500 font-mono shrink-0">
                      <p>{new Date(item.interceptedAt).toLocaleTimeString()}</p>
                      <p>{item.relayOrigin}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
