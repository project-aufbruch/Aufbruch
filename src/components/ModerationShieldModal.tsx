import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  Cpu,
  UserX,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Flame,
  Users,
  Search,
  Filter
} from 'lucide-react';
import { antiAbuseShield } from '../services/antiAbuseShield';
import { ModerationConfig, BlockedEntity, AbuseReport, UserIdentity } from '../types';

interface ModerationShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: UserIdentity | null;
}

export const ModerationShieldModal: React.FC<ModerationShieldModalProps> = ({
  isOpen,
  onClose,
  identity,
}) => {
  const [state, setState] = useState<{ config: ModerationConfig; blocked: BlockedEntity[]; reports: AbuseReport[] }>({
    config: antiAbuseShield.getConfig(),
    blocked: antiAbuseShield.getBlockedEntities(),
    reports: [],
  });

  const [activeTab, setActiveTab] = useState<'pow' | 'blocked' | 'keywords' | 'reports'>('pow');
  const [newBannedPubkey, setNewBannedPubkey] = useState('');
  const [newBannedReason, setNewBannedReason] = useState<BlockedEntity['reason']>('spam');
  const [newKeyword, setNewKeyword] = useState('');
  const [powTestRunning, setPowTestRunning] = useState(false);
  const [powTestResult, setPowTestResult] = useState<string | null>(null);

  useEffect(() => {
    const unsub = antiAbuseShield.subscribe((newState) => {
      setState(newState);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleUpdatePoW = (diff: number) => {
    antiAbuseShield.updateConfig({ powDifficulty: diff });
  };

  const handleTestPoW = async () => {
    setPowTestRunning(true);
    setPowTestResult(null);
    try {
      const result = await antiAbuseShield.computePoWNonce('test_event_sample_id', state.config.powDifficulty);
      setPowTestResult(`Mined nonce #${result.nonce} with ${result.difficulty}-bit leading zeros in ${result.timeMs}ms.`);
    } catch {
      setPowTestResult('Mining error.');
    } finally {
      setPowTestRunning(false);
    }
  };

  const handleAddBlockedPubkey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannedPubkey.trim()) return;
    antiAbuseShield.blockPubkey(newBannedPubkey.trim(), newBannedReason);
    setNewBannedPubkey('');
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    antiAbuseShield.addBannedKeyword(newKeyword.trim());
    setNewKeyword('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden my-6 relative">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-400/30 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Anti-Spam & Decentralized Moderation Shield</h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-300">
                  NIP-13 & NIP-51
                </span>
              </div>
              <p className="text-xs text-red-200/80 font-medium">
                Proof-of-Work mining cost, Web-of-Trust filtering, community quorum banning, and scam regex filters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pow')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'pow' ? 'bg-white text-red-950 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>1. Proof-of-Work</span>
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'blocked' ? 'bg-white text-red-950 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>2. Blocked ({state.blocked.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('keywords')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'keywords' ? 'bg-white text-red-950 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>3. Keyword Filters</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'reports' ? 'bg-white text-red-950 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>4. Community Quorum</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'pow' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  NIP-13 Hashcash Proof-of-Work Target
                </h3>
                <p className="text-xs text-slate-600">
                  Forces senders to compute leading zero SHA-256 bits before broadcasting. Legitimate humans spend ~50ms; automated spam bots sending millions of messages run out of CPU and are rejected.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { diff: 0, label: 'Off (0 bits)', desc: 'Instant / no mining' },
                  { diff: 8, label: 'Standard (8 bits)', desc: '~15ms compute' },
                  { diff: 16, label: 'Strict (16 bits)', desc: '~250ms compute' },
                  { diff: 20, label: 'Fortress (20 bits)', desc: '~3-5s compute' },
                ].map((item) => (
                  <button
                    key={item.diff}
                    onClick={() => handleUpdatePoW(item.diff)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      state.config.powDifficulty === item.diff
                        ? 'border-red-600 bg-red-50 text-red-950 ring-1 ring-red-400 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </button>
                ))}
              </div>

              {/* Web of Trust Strict Mode Switch */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Strict Web-of-Trust (WoT) Filtering</h4>
                  <p className="text-[11px] text-slate-500">
                    Require contacts to have at least 1 mutual connection before accepting Direct Messages.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={state.config.strictWebOfTrust}
                  onChange={(e) => antiAbuseShield.updateConfig({ strictWebOfTrust: e.target.checked })}
                  className="rounded text-red-600 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Live Test Benchmark */}
              <div className="p-4 bg-slate-950 text-white rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-red-400" />
                    Local PoW Benchmark
                  </span>
                  <button
                    onClick={handleTestPoW}
                    disabled={powTestRunning}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {powTestRunning ? 'Mining Nonce...' : 'Run PoW Benchmark'}
                  </button>
                </div>
                {powTestResult && (
                  <p className="text-[11px] font-mono text-emerald-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    {powTestResult}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'blocked' && (
            <div className="space-y-4">
              <form onSubmit={handleAddBlockedPubkey} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-slate-900">Ban / Mute Pubkey</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter pubkey or hex prefix..."
                    value={newBannedPubkey}
                    onChange={(e) => setNewBannedPubkey(e.target.value)}
                    className="flex-1 text-xs p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                  <select
                    value={newBannedReason}
                    onChange={(e) => setNewBannedReason(e.target.value as any)}
                    className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="spam">Spam Bot</option>
                    <option value="scam">Scam / Phishing</option>
                    <option value="harassment">Harassment</option>
                    <option value="impersonation">Impersonation</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                  >
                    Ban
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Active Banned Entities</span>
                {state.blocked.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No blocked entities yet.</p>
                ) : (
                  <div className="space-y-2">
                    {state.blocked.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{item.petname || 'Unknown Actor'}</span>
                            <span className="text-[10px] font-mono bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold uppercase">
                              {item.reason}
                            </span>
                            <span className="text-[10px] text-slate-400">({item.blockedBy})</span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-500 truncate max-w-sm mt-0.5">{item.pubkey}</p>
                        </div>
                        <button
                          onClick={() => antiAbuseShield.unblockPubkey(item.pubkey)}
                          className="text-xs text-slate-500 hover:text-red-600 font-bold px-2 py-1"
                        >
                          Unban
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className="space-y-4">
              <form onSubmit={handleAddKeyword} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add spam trigger phrase (e.g. 'crypto giveaway')..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Add Filter
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                {state.config.bannedKeywords.map((kw) => (
                  <div
                    key={kw}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <span>{kw}</span>
                    <button
                      onClick={() => antiAbuseShield.removeBannedKeyword(kw)}
                      className="text-slate-400 hover:text-red-600 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-600">
                <h4 className="font-bold text-slate-900">How Decentralized Quorum Banning Works</h4>
                <p>
                  When a malicious actor is flagged by multiple independent peers, reports are signed with sender keys. If a pubkey reaches the Quorum Threshold (currently <strong>{state.config.autoQuarantineThreshold} peer reports</strong>), their messages and broadcasts are quarantined automatically without requiring central server admins.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Recent Quorum Reports</span>
                {state.reports.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                    No community abuse reports filed in current session.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {state.reports.map((rep) => (
                      <div key={rep.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-900">Report: {rep.reason}</span>
                          <span className="text-[10px] text-slate-400">{new Date(rep.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-600 truncate">Target: {rep.targetPubkey}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer"
          >
            Save & Close Shield
          </button>
        </div>
      </div>
    </div>
  );
};
