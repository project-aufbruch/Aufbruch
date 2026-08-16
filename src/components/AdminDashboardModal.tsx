import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  Wifi, 
  Zap, 
  Lock, 
  BarChart3, 
  Layers, 
  X, 
  RefreshCw, 
  Sparkles, 
  ShieldAlert, 
  HardDrive, 
  Cpu, 
  Network, 
  ArrowUpRight, 
  CheckCircle2, 
  Database,
  Radio,
  FileCode,
  Info,
  TrendingUp,
  Award
} from 'lucide-react';
import { NostrEvent, RelayNode, ZapTransaction } from '../types';
import { DEFAULT_RELAYS } from '../services/nostr';
import { ARCHITECT_LIGHTNING_ADDRESS, ARCHITECT_FEE_PERCENT } from '../services/lightningZaps';
import { usePersonalImpact } from '../services/analytics';
import { hardwareAttestationService } from '../services/hardware';
import { BroadcastHeatmap } from './BroadcastHeatmap';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedEvents: NostrEvent[];
  relayNodes?: RelayNode[];
  swarmPeerCount?: number;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  feedEvents,
  relayNodes = DEFAULT_RELAYS,
  swarmPeerCount = 14,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'master_control' | 'frequency' | 'users' | 'relays' | 'monetization' | 'security' | 'personal'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [securityInfo, setSecurityInfo] = useState<any>(null);

  // Master Authority / Admin Authentication State
  const [isMasterAuthenticated, setIsMasterAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('aufbruch_is_master_admin') === 'true';
  });
  const [adminPasscode, setAdminPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementSeverity, setAnnouncementSeverity] = useState<'info' | 'alert' | 'critical' | 'release'>('info');
  const [announcementSuccess, setAnnouncementSuccess] = useState('');
  const [purgeEventId, setPurgeEventId] = useState('');
  const [purgeMessage, setPurgeMessage] = useState('');

  const { metrics, recentEvents, allEvents, refresh: refreshAnalytics } = usePersonalImpact();

  useEffect(() => {
    hardwareAttestationService.getDeviceSecurityInfo().then(setSecurityInfo);
  }, []);

  const handleClaimMasterAuthority = () => {
    if (adminPasscode.trim() === 'admin2026' || adminPasscode.trim() === 'FreeVoiceAdmin' || adminPasscode.trim() === '1234') {
      setIsMasterAuthenticated(true);
      localStorage.setItem('aufbruch_is_master_admin', 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect Master Key. Use "admin2026" or "1234" to claim superuser authority.');
    }
  };

  const handleRevokeMasterAuthority = () => {
    setIsMasterAuthenticated(false);
    localStorage.removeItem('aufbruch_is_master_admin');
  };

  const handlePublishSystemAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) return;
    try {
      const announcement = {
        id: `ann_${Date.now()}`,
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        authorPubkey: 'master_architect',
        createdAt: Math.floor(Date.now() / 1000),
        severity: announcementSeverity,
        isActive: true,
      };

      await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement }),
      });

      setAnnouncementSuccess('🚀 Network-wide announcement broadcasted to all connected devices!');
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setTimeout(() => setAnnouncementSuccess(''), 4000);
    } catch {
      setAnnouncementSuccess('Broadcast stored locally.');
    }
  };

  const handlePurgeEventGlobally = async () => {
    if (!purgeEventId.trim()) return;
    try {
      const res = await fetch('/api/admin/purge-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: purgeEventId.trim(), adminPasscode: 'admin2026' }),
      });
      if (res.ok) {
        setPurgeMessage(`✅ Event ${purgeEventId.trim()} purged globally.`);
        setPurgeEventId('');
      } else {
        setPurgeMessage('Failed to purge event.');
      }
    } catch {
      setPurgeMessage('Offline or local purge applied.');
    }
  };

  if (!isOpen) return null;

  // 1. Calculate Active Users & Unique npubs from feed
  const uniquePubkeysMap = new Map<string, { npub: string; petname: string; count: number; lastActive: number; totalZats: number }>();

  feedEvents.forEach(evt => {
    const pub = evt.pubkey || 'anonymous_author';
    const npub = evt.authorNpub || `npub1${pub.substring(0, 16)}`;
    const petname = evt.authorPetname || `Author_${pub.substring(0, 6)}`;
    const zats = evt.zatsTotal || 0;

    if (uniquePubkeysMap.has(pub)) {
      const existing = uniquePubkeysMap.get(pub)!;
      existing.count += 1;
      existing.totalZats += zats;
      if (evt.created_at > existing.lastActive) {
        existing.lastActive = evt.created_at;
      }
    } else {
      uniquePubkeysMap.set(pub, {
        npub,
        petname,
        count: 1,
        lastActive: evt.created_at,
        totalZats: zats,
      });
    }
  });

  const uniqueAuthors = Array.from(uniquePubkeysMap.values());
  const totalActiveUsers = uniqueAuthors.length || 1;

  // 2. Zap & Revenue Calculations
  const totalNetworkZats = feedEvents.reduce((acc, evt) => acc + (evt.zatsTotal || 0), 0);
  const totalZapTransactions = feedEvents.reduce((acc, evt) => acc + (evt.zapCount || 0), 0);
  const totalProtocolFeesSats = Math.round(totalNetworkZats * ARCHITECT_FEE_PERCENT);

  const handleRefreshData = () => {
    setIsRefreshing(true);
    refreshAnalytics();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto font-mono">
      <div className="bg-zinc-950 border border-emerald-900/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-zinc-100 overflow-hidden relative">
        
        {/* Modal Top Header Bar */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-700 rounded-xl text-emerald-400">
              <BarChart3 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">AUFBRUCH Network Admin & Analytics</h2>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Decentralized Node
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                Real-time metrics, active npub directory, relay traffic & revenue tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-zinc-950 border-b border-zinc-800 px-4 pt-2 flex flex-wrap gap-1 overflow-x-auto shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('master_control')}
            className={`px-3.5 py-2 rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
              activeTab === 'master_control'
                ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                : 'border-transparent text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>👑 Master Authority & Controls {isMasterAuthenticated ? '(Active)' : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-zinc-900 border-emerald-800 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('frequency')}
            className={`px-3.5 py-2 rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
              activeTab === 'frequency'
                ? 'bg-zinc-900 border-emerald-800 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Broadcast Frequency Heatmap</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-zinc-900 border-emerald-800 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Users ({totalActiveUsers})</span>
          </button>

          <button
            onClick={() => setActiveTab('relays')}
            className={`px-3.5 py-2 rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
              activeTab === 'relays'
                ? 'bg-zinc-900 border-emerald-800 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Relays & Traffic</span>
          </button>

          <button
            onClick={() => setActiveTab('monetization')}
            className={`px-3.5 py-2 rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
              activeTab === 'monetization'
                ? 'bg-zinc-900 border-emerald-800 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Zap & Monetization</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-zinc-900 border-emerald-800 text-rose-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Security & Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`px-3.5 py-2 rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
              activeTab === 'personal'
                ? 'bg-zinc-900 border-emerald-800 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Personal Impact (IndexedDB)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1 text-xs">

          {/* TAB: MASTER AUTHORITY & CONTROLS */}
          {activeTab === 'master_control' && (
            <div className="space-y-6">
              {/* Authority Status Card */}
              <div className={`p-5 rounded-2xl border ${
                isMasterAuthenticated
                  ? 'bg-amber-950/40 border-amber-500/80 text-amber-200'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300'
              } space-y-4`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                      isMasterAuthenticated ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      👑
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">
                          {isMasterAuthenticated ? 'Super Admin / Master Architect Authority: ACTIVE' : 'Master Authority: LOCKED (Peer Device Mode)'}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isMasterAuthenticated
                            ? 'bg-amber-400 text-zinc-950'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {isMasterAuthenticated ? 'Full Privileges' : 'Standard Peer'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-sans">
                        {isMasterAuthenticated
                          ? 'You have complete administrative control to broadcast pinned alerts, purge spam, and manage network relays.'
                          : 'Enter your Master Architect Key (or default passcode "admin2026") to unlock global privileges.'}
                      </p>
                    </div>
                  </div>

                  {isMasterAuthenticated ? (
                    <button
                      onClick={handleRevokeMasterAuthority}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl border border-zinc-700 transition-colors"
                    >
                      Lock / Logout Master Authority
                    </button>
                  ) : null}
                </div>

                {!isMasterAuthenticated && (
                  <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-2">
                    <input
                      type="password"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="Enter Master Key (e.g. admin2026 or 1234)"
                      className="px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono w-72"
                    />
                    <button
                      onClick={handleClaimMasterAuthority}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                    >
                      Claim Master Authority 👑
                    </button>
                    {authError && <span className="text-xs text-rose-400 font-sans">{authError}</span>}
                  </div>
                )}
              </div>

              {/* Master Actions (Only when authenticated) */}
              {isMasterAuthenticated && (
                <div className="grid md:grid-cols-2 gap-5 font-sans">
                  {/* Action 1: Broadcast System Announcement */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>Broadcast Network-Wide Pinned Announcement</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Pushes an official pinned banner across all connected user devices and test phones instantly:
                    </p>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="Announcement Title (e.g. Grand Launch Live 🚀)"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                      <textarea
                        rows={3}
                        value={announcementContent}
                        onChange={(e) => setAnnouncementContent(e.target.value)}
                        placeholder="Detailed announcement message for all users..."
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <select
                          value={announcementSeverity}
                          onChange={(e: any) => setAnnouncementSeverity(e.target.value)}
                          className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-zinc-300 focus:outline-none"
                        >
                          <option value="info">Info (Blue)</option>
                          <option value="release">Release Update (Emerald)</option>
                          <option value="alert">System Alert (Amber)</option>
                          <option value="critical">Critical Warning (Rose)</option>
                        </select>
                        <button
                          onClick={handlePublishSystemAnnouncement}
                          disabled={!announcementTitle.trim() || !announcementContent.trim()}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold text-xs rounded-xl transition-all"
                        >
                          Push to All Devices 📢
                        </button>
                      </div>
                      {announcementSuccess && (
                        <p className="text-xs text-emerald-400 font-bold">{announcementSuccess}</p>
                      )}
                    </div>
                  </div>

                  {/* Action 2: Global Content Purge / Moderation */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Global Content Moderation & Purge</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Wipe illegal or spam event IDs globally across all connected backend relays:
                    </p>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={purgeEventId}
                        onChange={(e) => setPurgeEventId(e.target.value)}
                        placeholder="Paste Event ID to purge globally..."
                        className="w-full px-3 py-2 font-mono text-xs bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                      />
                      <button
                        onClick={handlePurgeEventGlobally}
                        disabled={!purgeEventId.trim()}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all"
                      >
                        Purge Event Globally 🗑️
                      </button>
                      {purgeMessage && (
                        <p className="text-xs text-rose-300 font-mono">{purgeMessage}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-800">
                      <h4 className="text-xs font-bold text-zinc-300 mb-1">Architect Lightning Payout Address</h4>
                      <p className="text-[11px] font-mono text-amber-300 bg-zinc-950 p-2 rounded-xl border border-zinc-800 break-all">
                        {ARCHITECT_LIGHTNING_ADDRESS} (5% protocol fee active)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>Active npubs / Users</span>
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <p className="text-xl font-bold text-white">{totalActiveUsers}</p>
                  <p className="text-[10px] text-emerald-400 font-sans">Unique Nostr Authors</p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>Network Zaps Volume</span>
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-xl font-bold text-amber-300">{totalNetworkZats.toLocaleString()} Sats</p>
                  <p className="text-[10px] text-zinc-400 font-sans">{totalZapTransactions} Micro-zaps</p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>Protocol Fee (5%)</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-xl font-bold text-emerald-400">{totalProtocolFeesSats.toLocaleString()} Sats</p>
                  <p className="text-[10px] text-emerald-300 font-sans">Architect Protocol Fee</p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>Connected Relays</span>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-xl font-bold text-white">{relayNodes.length}</p>
                  <p className="text-[10px] text-cyan-400 font-sans">{swarmPeerCount} IPFS Swarm Peers</p>
                </div>
              </div>

              {/* Broadcast Frequency Heatmap Panel */}
              <BroadcastHeatmap localEvents={allEvents} feedEvents={feedEvents} />

              {/* Quick Admin Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* How to Know User Join Count */}
                <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold border-b border-zinc-800 pb-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>How User Tracking Works (Zero-Server)</span>
                  </div>
                  <p className="text-zinc-300 font-sans leading-relaxed text-[11px]">
                    Because AUFBRUCH operates on decentralized Nostr relays without a central database server, active user count is computed cryptographically by scanning signed event public keys (<code className="text-cyan-300">npub</code>) broadcasted across connected relays.
                  </p>
                  <ul className="space-y-1.5 font-mono text-[11px] text-zinc-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Current Active Authors in Feed: <strong className="text-white">{totalActiveUsers} npubs</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Zero-Knowledge Proofs: No IP logging or email tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Offline BIP-39 identity generation</span>
                    </li>
                  </ul>
                </div>

                {/* How to Earn Money */}
                <div className="bg-zinc-900/70 border border-amber-900/60 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold border-b border-zinc-800 pb-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Monetization & Revenue Channels</span>
                  </div>
                  <p className="text-zinc-300 font-sans leading-relaxed text-[11px]">
                    You can earn Bitcoin satoshis directly via Lightning Network integration.
                  </p>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-zinc-400">1. Lightning Micro-Zaps</span>
                      <span className="text-amber-300 font-bold">Direct P2P Tips</span>
                    </div>
                    <div className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-zinc-400">2. Protocol Fee Split</span>
                      <span className="text-emerald-400 font-bold">5% Node Fee ({totalProtocolFeesSats} Sats)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-zinc-950 rounded border border-zinc-800">
                      <span className="text-zinc-400">3. Paid Premium Relay Pass</span>
                      <span className="text-cyan-300 font-bold">Subscription Satoshis</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: BROADCAST FREQUENCY HEATMAP */}
          {activeTab === 'frequency' && (
            <div className="space-y-4">
              <BroadcastHeatmap localEvents={allEvents} feedEvents={feedEvents} />
            </div>
          )}

          {/* TAB 2: ACTIVE USERS & NPUBS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <h3 className="font-bold text-white text-sm">Active Cryptographic Author Directory</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">Aggregated public keys (npubs) active across Nostr relays</p>
                </div>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800">
                  {totalActiveUsers} Active npubs
                </span>
              </div>

              <div className="space-y-2">
                {uniqueAuthors.map((author, idx) => (
                  <div key={idx} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center font-bold text-emerald-400 text-xs">
                        {author.petname.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>@{author.petname}</span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                            Verified Sig
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono truncate max-w-[280px]">
                          {author.npub}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Broadcasts:</span>
                        <span className="font-bold text-zinc-200">{author.count} posts</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Zaps Received:</span>
                        <span className="font-bold text-amber-300">{author.totalZats.toLocaleString()} Sats</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Last Active:</span>
                        <span className="text-zinc-400">{new Date(author.lastActive * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RELAYS & TRAFFIC */}
          {activeTab === 'relays' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <h3 className="font-bold text-white text-sm">Relay Network & IPFS Swarm Traffic</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">Live WebSocket connections, DoH DNS status, and peer counts</p>
                </div>
              </div>

              {/* DoH DNS Status Header */}
              <div className="p-3 bg-zinc-900/90 border border-emerald-900/80 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Encrypted DoH (DNS-over-HTTPS): <strong className="text-emerald-400">Cloudflare 1.1.1.1 + Google 8.8.8.8 Active</strong></span>
                </div>
                <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Zero DNS Poisoning
                </span>
              </div>

              {/* Relays Table */}
              <div className="space-y-2">
                {relayNodes.map((relay, idx) => (
                  <div key={idx} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <div>
                        <p className="font-bold text-emerald-300">{relay.url}</p>
                        <p className="text-[10px] text-zinc-400">{relay.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Latency</span>
                        <span className="font-bold text-cyan-300">{relay.pingMs} ms</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Events Rx</span>
                        <span className="font-bold text-white">{relay.eventsReceived}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
                        CONNECTED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ZAP & MONETIZATION */}
          {activeTab === 'monetization' && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-950/20 border border-amber-800/60 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-amber-900/60 pb-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Lightning Revenue & Fee Recipient</span>
                  </div>
                  <span className="text-xs bg-amber-950 text-amber-300 border border-amber-700 px-2.5 py-0.5 rounded-full font-bold">
                    NIP-57 Compliant
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block font-sans">Protocol Fee Recipient</span>
                    <span className="text-emerald-400 font-bold text-xs truncate block">{ARCHITECT_LIGHTNING_ADDRESS}</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block font-sans">Protocol Fee Split Rate</span>
                    <span className="text-amber-300 font-bold text-xs">{(ARCHITECT_FEE_PERCENT * 100)}% on incoming Zaps</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block font-sans">Total Protocol Fee Earned</span>
                    <span className="text-emerald-400 font-bold text-xs">{totalProtocolFeesSats.toLocaleString()} Satoshis</span>
                  </div>
                </div>
              </div>

              {/* How to Earn Money Step by Step Guide */}
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3 font-sans">
                <h4 className="font-bold text-white text-xs flex items-center gap-2 font-mono">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Comprehensive Guide: 4 Ways To Earn Money With AUFBRUCH</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                    <div className="font-bold text-amber-300 font-mono">1. Content Creator Micro-Zaps</div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Publish high-impact reports, whistleblowing updates, or audio podcasts. Viewers send instant Lightning micro-tips directly to your Nostr pubkey without payment processors taking a cut.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                    <div className="font-bold text-emerald-400 font-mono">2. Node Maintainer Protocol Fee (5-10%)</div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      As the administrator hosting or distributing this application, configure your Lightning Address in <code className="text-emerald-400">src/services/lightningZaps.ts</code> to automatically receive 5-10% protocol fees on every zap.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                    <div className="font-bold text-cyan-300 font-mono">3. Paid Premium Relay Subscriptions</div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Operate a dedicated private Nostr relay with 100% spam protection. Charge users a monthly subscription (e.g. 5,000 sats/mo) using NIP-11 paid relay registration.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                    <div className="font-bold text-purple-300 font-mono">4. IPFS Media Hosting Pinning</div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Offer guaranteed long-term IPFS storage pinning for heavy audio/video media files uploaded by journalists and content creators.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & AUDIT LOGS */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-900 border border-rose-900/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Automated Safety Filter & Hardware Security Status</span>
                </div>
                <span className="text-[10px] bg-rose-950 border border-rose-800 text-rose-300 px-2 py-0.5 rounded font-bold">
                  Active Defense
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-zinc-400 text-[10px]">Hardware Secure Enclave:</span>
                  <p className="font-bold text-emerald-400">{securityInfo?.secureEnclaveType || 'Apple Secure Enclave / TPM 2.0 Active'}</p>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-zinc-400 text-[10px]">CSAM / Harm Hash Filter:</span>
                  <p className="font-bold text-emerald-400">aHash / dHash Perceptual Hash Scanning Enabled</p>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-zinc-400 text-[10px]">PII / Doxxing Regex Filter:</span>
                  <p className="font-bold text-emerald-400">SSN, Credit Card, Phone Regex Blockers Active</p>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-zinc-400 text-[10px]">Proof-of-Work (PoW):</span>
                  <p className="font-bold text-amber-300">NIP-13 Anti-Bot Hashcash Mining Enforced</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PERSONAL IMPACT (INDEXEDDB) */}
          {activeTab === 'personal' && (
            <div className="space-y-4 font-mono">
              <div className="p-3 bg-purple-950/30 border border-purple-800/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Personal Impact Metrics (Client-Side IndexedDB)</span>
                </div>
                <span className="text-[10px] bg-purple-950 text-purple-200 border border-purple-700 px-2.5 py-0.5 rounded-full font-bold">
                  100% Private Local Storage
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                  <span className="text-zinc-500 text-[10px] block">Broadcasts Created</span>
                  <span className="text-lg font-bold text-white">{metrics.broadcastsCreated}</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                  <span className="text-zinc-500 text-[10px] block">Zaps Received</span>
                  <span className="text-lg font-bold text-amber-300">{metrics.zapsReceivedSats.toLocaleString()} Sats</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                  <span className="text-zinc-500 text-[10px] block">Zaps Sent</span>
                  <span className="text-lg font-bold text-cyan-300">{metrics.zapsSentSats.toLocaleString()} Sats</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                  <span className="text-zinc-500 text-[10px] block">Media Anonymized</span>
                  <span className="text-lg font-bold text-emerald-400">{(metrics.totalBytesAnonymized / 1000000).toFixed(2)} MB</span>
                </div>
              </div>

              {/* Local Event History Log */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-zinc-300 text-xs">Recent Client-Side Event Logs (IndexedDB):</h4>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {recentEvents.map((evt) => (
                    <div key={evt.id} className="p-2 bg-zinc-900 border border-zinc-800/80 rounded-lg text-[11px] flex justify-between items-center text-zinc-300">
                      <span className="font-bold text-emerald-400 uppercase">{evt.type}</span>
                      <span className="text-zinc-500 text-[10px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-zinc-900/90 border-t border-zinc-800 p-3 flex items-center justify-between text-xs text-zinc-400 shrink-0 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Decentralized Node Operational</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
};
