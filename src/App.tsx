import React, { useState, useEffect } from 'react';
import { Radio, Key, Wifi, Network, Shield, ShieldAlert, Cpu, Lock, Plus, RefreshCw, Zap, Search, ShieldCheck, Link2, Trash2, CheckSquare, Square, AlertTriangle, X, Check, EyeOff } from 'lucide-react';
import { UserIdentity, NostrEvent, RelayNode } from './types';
import { HeaderNav } from './components/HeaderNav';
import { BroadcastCard } from './components/BroadcastCard';
import { CreateBroadcastModal } from './components/CreateBroadcastModal';
import { IdentityModal } from './components/IdentityModal';
import { RelaysModal } from './components/RelaysModal';
import { IpfsSwarmModal } from './components/IpfsSwarmModal';
import { DuressModal } from './components/DuressModal';
import { UrlShortenerModal } from './components/UrlShortenerModal';
import { ContentModerationModal } from './components/ContentModerationModal';
import { CallInterfaceModal } from './components/CallInterfaceModal';
import { LegalDocument } from './components/LegalDocument';
import { NetworkStatusBar } from './components/NetworkStatusBar';
import { ShareQrSection } from './components/ShareQrSection';
import { AboutLandingCard } from './components/AboutLandingCard';
import { DecoyFeed } from './components/DecoyFeed';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { ChatModal } from './components/ChatModal';
import { TorRoutingModal } from './components/TorRoutingModal';
import { UltrasonicTransferModal } from './components/UltrasonicTransferModal';
import { ColdStorageModal } from './components/ColdStorageModal';
import { EmergencyMapModal } from './components/EmergencyMapModal';
import { ModerationShieldModal } from './components/ModerationShieldModal';
import { SealedBlastModal } from './components/SealedBlastModal';
import { WhistleblowerVaultModal } from './components/WhistleblowerVaultModal';
import { AntiSpamFortressModal } from './components/AntiSpamFortressModal';
import { ClearCacheModal } from './components/ClearCacheModal';
import PrivacyStudioModal from './components/PrivacyStudioModal';

import { communitySafetyManager, checkFastIllegalContent } from './services/safetyFilter';
import { createRandomIdentity, loadIdentityFromVault, saveIdentityToVault } from './services/crypto';
import { nostrService } from './services/nostr';
import { DEFAULT_IPFS_PEERS } from './services/ipfs';
import { getDuressConfig } from './services/duress';
import { urlShortenerService } from './services/urlShortener';
import { webRtcService, CallStatus } from './services/webrtc';
import { recommendationEngine } from './services/recommendation';
import { torService } from './services/torService';
import { antiSpamFortress } from './services/antiSpamFortress';

export default function App() {
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [feedEvents, setFeedEvents] = useState<NostrEvent[]>([]);
  const [relays, setRelays] = useState<RelayNode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDuressActive, setIsDuressActive] = useState(false);
  const [shortUrlBanner, setShortUrlBanner] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isTorActive, setIsTorActive] = useState(torService.isEnabled());

  // Modals state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isIdentityOpen, setIsIdentityOpen] = useState(false);
  const [isRelaysOpen, setIsRelaysOpen] = useState(false);
  const [isSwarmOpen, setIsSwarmOpen] = useState(false);
  const [isDuressOpen, setIsDuressOpen] = useState(false);
  const [isShortenerOpen, setIsShortenerOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [selectedCallTargetPubkey, setSelectedCallTargetPubkey] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatPubkey, setSelectedChatPubkey] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPwaInstallOpen, setIsPwaInstallOpen] = useState(false);
  const [isTorOpen, setIsTorOpen] = useState(false);
  const [isUltrasonicOpen, setIsUltrasonicOpen] = useState(false);
  const [isColdStorageOpen, setIsColdStorageOpen] = useState(false);
  const [isEmergencyMapOpen, setIsEmergencyMapOpen] = useState(false);
  const [isModerationOpen, setIsModerationOpen] = useState(false);
  const [isSealedBlastOpen, setIsSealedBlastOpen] = useState(false);
  const [isPrivacyStudioOpen, setIsPrivacyStudioOpen] = useState(false);
  const [isWhistleblowerOpen, setIsWhistleblowerOpen] = useState(false);
  const [isAntiSpamFortressOpen, setIsAntiSpamFortressOpen] = useState(false);
  const [isClearCacheOpen, setIsClearCacheOpen] = useState(false);
  const [shortenerEvent, setShortenerEvent] = useState<NostrEvent | null>(null);
  const [shortenerCid, setShortenerCid] = useState<string | null>(null);

  // Multi-select and batch deletion state for My Posts tab
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isDeletingPosts, setIsDeletingPosts] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [singleDeleteTargetId, setSingleDeleteTargetId] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check if Duress Mode is active
    const duressConf = getDuressConfig();
    if (duressConf.isDuressActive) {
      setIsDuressActive(true);
      return;
    }

    // 2. Initialize or load cryptographic identity
    const initApp = async () => {
      let loaded = await loadIdentityFromVault('Voice-Vault-2026');
      if (!loaded) {
        loaded = createRandomIdentity('Aufbruch-Activist');
        await saveIdentityToVault(loaded, 'Voice-Vault-2026');
      }
      setIdentity(loaded);
      webRtcService.setIdentity(loaded);
      setRelays(nostrService.getRelays());
      setFeedEvents(nostrService.getFeed());
    };

    initApp();

    // Listen to WebRTC call status to auto-open call modal when incoming call arrives
    const unsubCall = webRtcService.subscribeStatus((status) => {
      setCallStatus(status);
      if (status === 'incoming' || status === 'calling' || status === 'connected') {
        setIsCallOpen(true);
      }
    });

    // Listen to Tor routing state
    const unsubTor = torService.subscribe((conf) => {
      setIsTorActive(conf.enabled);
    });

    // 3. Client-Side Hash Route Resolution for Short URLs
    const handleHashRoute = () => {
      const hash = window.location.hash;
      const search = window.location.search;

      if (hash && (hash.startsWith('#s/') || hash.startsWith('#v/'))) {
        const resolved = urlShortenerService.resolveShortCode(hash);
        if (resolved) {
          if ('targetId' in resolved && resolved.targetId) {
            setSearchQuery(resolved.targetId);
            setShortUrlBanner(`⚡ Expanded Client-Side Short Link (${resolved.targetType}: ${resolved.targetId})`);
          } else if ('originalUrl' in resolved) {
            setShortUrlBanner(`⚡ Resolved Short Link &rarr; ${resolved.originalUrl}`);
          }
        }
      } else if (search) {
        const params = new URLSearchParams(search);
        const evtParam = params.get('event');
        const cidParam = params.get('cid');
        if (evtParam) {
          setSearchQuery(evtParam);
          setShortUrlBanner(`⚡ Navigated via Short Link to Broadcast Event ${evtParam.substring(0, 8)}...`);
        } else if (cidParam) {
          setSearchQuery(cidParam);
          setShortUrlBanner(`⚡ Navigated via Short Link to IPFS CID ${cidParam.substring(0, 10)}...`);
        }
      }
    };

    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);

    // Poll feed updates periodically
    const interval = setInterval(() => {
      setFeedEvents(nostrService.getFeed());
    }, 1500);

    return () => {
      unsubCall();
      unsubTor();
      window.removeEventListener('hashchange', handleHashRoute);
      clearInterval(interval);
    };
  }, []);

  const handleDeactivateDuress = () => {
    setIsDuressActive(false);
    const loaded = createRandomIdentity('Voice-RestoredUser');
    setIdentity(loaded);
    setFeedEvents(nostrService.getFeed());
  };

  const handleResetFeed = () => {
    nostrService.clearFeedAndReset();
    setFeedEvents(nostrService.getFeed());
  };

  const [feedTab, setFeedTab] = useState<'for_you' | 'all' | 'tech' | 'crypto' | 'news' | 'audio' | 'my_posts'>('for_you');

  // Multi-select actions for My Posts
  const handleToggleSelect = (eventId: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleSelectAllMyPosts = () => {
    if (selectedPostIds.length === filteredEvents.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(filteredEvents.map((e) => e.id));
    }
  };

  const confirmBatchDelete = () => {
    if (selectedPostIds.length === 0) return;
    setSingleDeleteTargetId(null);
    setDeleteConfirmOpen(true);
  };

  const handleSingleDelete = (eventId: string) => {
    setSingleDeleteTargetId(eventId);
    setDeleteConfirmOpen(true);
  };

  const executeDeletion = async () => {
    const idsToDelete = singleDeleteTargetId ? [singleDeleteTargetId] : selectedPostIds;
    if (idsToDelete.length === 0) return;

    setIsDeletingPosts(true);
    try {
      await nostrService.deleteEvents(
        idsToDelete,
        identity?.privateKeyHex,
        identity?.publicKeyHex
      );

      setFeedEvents(nostrService.getFeed());
      setSelectedPostIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
      setDeleteConfirmOpen(false);
      setSingleDeleteTargetId(null);
      setDeleteNotice(
        `Successfully deleted ${idsToDelete.length} post(s) and broadcasted signed NIP-09 deletion request across relays.`
      );
      setTimeout(() => setDeleteNotice(null), 5000);
    } catch (err) {
      console.error('Failed to delete posts:', err);
    } finally {
      setIsDeletingPosts(false);
    }
  };

  // 1. Initial safety and tab filtering
  const rawFiltered = feedEvents.filter(e => {
    // Safety check
    if (communitySafetyManager.isEventFlagged(e.id) || communitySafetyManager.isMuted(e.pubkey)) {
      return false;
    }

    // Unnecessary post / spam check
    if (!recommendationEngine.isCleanPost(e)) {
      return false;
    }

    // Fortress 100% Zero-Spam Verification (PoW hashcash, Shannon entropy, Sybil ring detection)
    const fortressEval = antiSpamFortress.evaluateEvent(e);
    if (!fortressEval.isAllowed) {
      return false;
    }

    const illegalCheck = checkFastIllegalContent(e.content);
    if (illegalCheck.isIllegal) {
      return false;
    }

    // Specific category filters
    if (feedTab === 'my_posts' && identity?.publicKeyHex) {
      if (e.pubkey !== identity.publicKeyHex) return false;
    } else if (feedTab === 'audio') {
      if (e.mediaType !== 'audio') return false;
    } else if (feedTab === 'govleaks') {
      if (e.channel !== 'govleaks' && !e.content.toLowerCase().includes('leak') && !e.content.toLowerCase().includes('classified') && !e.content.toLowerCase().includes('whistleblower')) return false;
    } else if (feedTab === 'tech' || feedTab === 'crypto' || feedTab === 'news') {
      if (e.channel !== feedTab && !e.content.toLowerCase().includes(feedTab)) return false;
    }

    // Search query filter
    const matchesSearch =
      !searchQuery ||
      e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.authorPetname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.channel || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.ipfsCid || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // 2. Recommendation Algorithm Feed Ranking ("For You")
  const filteredEvents = feedTab === 'for_you'
    ? recommendationEngine.getRankedFeed(rawFiltered, searchQuery)
    : rawFiltered;

  // If Duress mode is triggered, render innocent decoy cat feed
  if (isDuressActive) {
    return <DecoyFeed onDeactivateDuress={handleDeactivateDuress} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20 transition-colors">
      {/* Top Tactical Bar */}
      <HeaderNav
        identity={identity}
        relayCount={relays.filter(r => r.status === 'connected').length}
        swarmCount={DEFAULT_IPFS_PEERS.length}
        isDuressActive={isDuressActive}
        onOpenIdentity={() => setIsIdentityOpen(true)}
        onOpenRelays={() => setIsRelaysOpen(true)}
        onOpenSwarm={() => setIsSwarmOpen(true)}
        onOpenDuress={() => setIsDuressOpen(true)}
        onOpenComposer={() => setIsComposerOpen(true)}
        onOpenShortener={() => {
          setShortenerEvent(null);
          setShortenerCid(null);
          setIsShortenerOpen(true);
        }}
        onOpenSafety={() => setIsSafetyOpen(true)}
        onOpenLegal={() => setIsLegalOpen(true)}
        onOpenCall={() => {
          setSelectedCallTargetPubkey('');
          setIsCallOpen(true);
        }}
        onOpenChat={() => {
          setSelectedChatPubkey('');
          setIsChatOpen(true);
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenPwaInstall={() => setIsPwaInstallOpen(true)}
        onOpenTor={() => setIsTorOpen(true)}
        onOpenUltrasonic={() => setIsUltrasonicOpen(true)}
        onOpenColdStorage={() => setIsColdStorageOpen(true)}
        onOpenEmergencyMap={() => setIsEmergencyMapOpen(true)}
        onOpenSealedBlast={() => setIsSealedBlastOpen(true)}
        onOpenModeration={() => setIsModerationOpen(true)}
        onOpenPrivacyStudio={() => setIsPrivacyStudioOpen(true)}
        onOpenWhistleblowerVault={() => setIsWhistleblowerOpen(true)}
        onOpenAntiSpamFortress={() => setIsAntiSpamFortressOpen(true)}
        onOpenClearCache={() => setIsClearCacheOpen(true)}
        torEnabled={isTorActive}
        callStatus={callStatus}
      />

      {/* Real-Time Off-Grid & Network Monitor Strip */}
      <NetworkStatusBar
        onOpenRelaysModal={() => setIsRelaysOpen(true)}
        onOpenSwarmModal={() => setIsSwarmOpen(true)}
        onOpenTorModal={() => setIsTorOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Short Link Notification Banner */}
        {shortUrlBanner && (
          <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-3 px-4 flex items-center justify-between text-xs font-sans text-indigo-800 dark:text-indigo-200 animate-fade-in shadow-xs">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{shortUrlBanner}</span>
            </div>
            <button
              onClick={() => {
                setShortUrlBanner(null);
                setSearchQuery('');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 text-xs px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 cursor-pointer"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Social Feed Welcome / Quick Compose Prompt */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 md:p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
              {identity?.petname ? identity.petname.substring(0, 2).toUpperCase() : 'FV'}
            </div>

            <button
              onClick={() => setIsComposerOpen(true)}
              className="flex-1 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-left text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shadow-inner flex items-center justify-between cursor-pointer"
            >
              <span>What's on your mind?</span>
              <div className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline pr-1">Post</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tactical Air-Gap, Safe Zones & Anti-Abuse Action Deck */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 rounded-3xl p-4 md:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Off-Grid Survival, Air-Gap & Moderation Shield
              </h3>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
              High-Threat Ready
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            <button
              type="button"
              onClick={() => setIsPrivacyStudioOpen(true)}
              className="p-3 bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/50 rounded-2xl text-left transition-all hover:scale-[1.02] flex flex-col justify-between group cursor-pointer shadow-sm"
            >
              <EyeOff className="w-4 h-4 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-bold text-xs text-orange-200">Privacy Studio</p>
                <p className="text-[10px] text-orange-400/80">Face & Voice DSP</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsWhistleblowerOpen(true)}
              className="p-3 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 rounded-2xl text-left transition-all hover:scale-[1.02] flex flex-col justify-between group cursor-pointer shadow-sm"
            >
              <Shield className="w-4 h-4 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-bold text-xs text-amber-200">Whistleblower</p>
                <p className="text-[10px] text-amber-400/80">Classified drops</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsAntiSpamFortressOpen(true)}
              className="p-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 rounded-2xl text-left transition-all hover:scale-[1.02] flex flex-col justify-between group cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-bold text-xs text-emerald-200">100% Spam Shield</p>
                <p className="text-[10px] text-emerald-400/80">PoW Hashcash</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsUltrasonicOpen(true)}
              className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-2xl text-left transition-all hover:scale-[1.02] flex flex-col justify-between group cursor-pointer"
            >
              <Radio className="w-4 h-4 text-blue-400 mb-2 group-hover:animate-pulse" />
              <div>
                <p className="font-bold text-xs text-white">Ultrasonic Mesh</p>
                <p className="text-[10px] text-slate-400">Audio air-gap SOS</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsEmergencyMapOpen(true)}
              className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-2xl text-left transition-all hover:scale-[1.02] flex flex-col justify-between group cursor-pointer"
            >
              <Radio className="w-4 h-4 text-emerald-400 mb-2" />
              <div>
                <p className="font-bold text-xs text-white">Safe Zone Map</p>
                <p className="text-[10px] text-slate-400">Offline vector radar</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsColdStorageOpen(true)}
              className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-2xl text-left transition-all hover:scale-[1.02] flex flex-col justify-between group cursor-pointer"
            >
              <Shield className="w-4 h-4 text-amber-400 mb-2" />
              <div>
                <p className="font-bold text-xs text-white">Cold Vault</p>
                <p className="text-[10px] text-slate-400">BIP-39 & MicroSD</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsSealedBlastOpen(true)}
              className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-2xl text-left transition-all hover:scale-[1.02] flex flex-col justify-between group cursor-pointer"
            >
              <Lock className="w-4 h-4 text-purple-400 mb-2" />
              <div>
                <p className="font-bold text-xs text-white">Sealed Blast</p>
                <p className="text-[10px] text-slate-400">NIP-17 Group DMs</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsDuressOpen(true)}
              className="p-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 rounded-2xl text-left transition-all hover:scale-[1.02] flex flex-col justify-between group cursor-pointer shadow-sm"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 mb-2" />
              <div>
                <p className="font-bold text-xs text-red-200">Duress Mode</p>
                <p className="text-[10px] text-red-400/80">Decoy Wipe</p>
              </div>
            </button>
          </div>
        </div>

        {/* Landing Hero & Security Overview Banner for New Users */}
        <AboutLandingCard
          onOpenIdentity={() => setIsIdentityOpen(true)}
          onOpenComposer={() => setIsComposerOpen(true)}
        />

        {/* Live Interactive App Share & Download QR Code Card */}
        <ShareQrSection onOpenPwaInstall={() => setIsPwaInstallOpen(true)} />

        {/* Search & Filter Bar */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts or creators..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-colors shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                <strong className="text-indigo-600 dark:text-indigo-400">{filteredEvents.length}</strong> posts
              </div>
              <button
                onClick={handleResetFeed}
                title="Clear cached test posts & reset to clean verified feed"
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs flex items-center gap-1 font-semibold transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Clear Test Posts</span>
              </button>
            </div>
          </div>

          {/* Quick Filter & Channel Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setFeedTab('for_you')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  feedTab === 'for_you'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>For You</span>
                <span className="text-[10px] bg-white/20 px-1 rounded">✨ Algorithmic</span>
              </button>

              <button
                onClick={() => setFeedTab('all')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  feedTab === 'all'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All 🌐
              </button>

              <button
                onClick={() => setFeedTab('govleaks')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  feedTab === 'govleaks'
                    ? 'bg-amber-600 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                #GovLeaks 📁
              </button>

              <button
                onClick={() => setFeedTab('tech')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  feedTab === 'tech'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                #Tech 💻
              </button>

              <button
                onClick={() => setFeedTab('crypto')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  feedTab === 'crypto'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                #Crypto ⚡
              </button>

              <button
                onClick={() => setFeedTab('news')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  feedTab === 'news'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                #News 📰
              </button>

              <button
                onClick={() => setFeedTab('audio')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  feedTab === 'audio'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Voice Notes 🎙️
              </button>

              <button
                onClick={() => setFeedTab('my_posts')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  feedTab === 'my_posts'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                My Posts 👤
              </button>
            </div>

            {(searchQuery || feedTab !== 'for_you') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFeedTab('for_you');
                }}
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline shrink-0 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Notification / Feedback Banner */}
        {deleteNotice && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs font-medium shadow-xs animate-fade-in">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{deleteNotice}</span>
            </div>
            <button
              onClick={() => setDeleteNotice(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white p-1 rounded-lg hover:bg-emerald-100/50 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* My Posts Multi-Select Management Bar */}
        {feedTab === 'my_posts' && filteredEvents.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 px-4 shadow-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAllMyPosts}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800 transition-colors cursor-pointer"
              >
                {selectedPostIds.length === filteredEvents.length ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                )}
                <span>
                  {selectedPostIds.length === filteredEvents.length ? 'Deselect All' : 'Select All'}
                </span>
              </button>

              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                <strong className="text-slate-900 dark:text-white font-bold">{selectedPostIds.length}</strong> of{' '}
                {filteredEvents.length} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedPostIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPostIds([])}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              )}

              <button
                type="button"
                onClick={confirmBatchDelete}
                disabled={selectedPostIds.length === 0 || isDeletingPosts}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                title="Delete selected events from all connected Nostr relays using cryptographic NIP-09 deletion"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedPostIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Nostr Public Feed Stream */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 space-y-3 shadow-xs">
              <Radio className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-medium">
                {feedTab === 'my_posts'
                  ? "You haven't created any posts yet with your current key. Click 'Post' above to broadcast!"
                  : "No posts match your search query or selected filter."}
              </p>
              {(feedTab !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setFeedTab('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                >
                  View All Broadcasts
                </button>
              )}
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <BroadcastCard
                key={evt.id}
                event={evt}
                currentUserPubkey={identity?.publicKeyHex}
                selectable={feedTab === 'my_posts'}
                isSelected={selectedPostIds.includes(evt.id)}
                onToggleSelect={handleToggleSelect}
                onDeleteSingle={handleSingleDelete}
                onOpenShortener={(e) => {
                  setShortenerEvent(e);
                  setShortenerCid(e.ipfsCid || null);
                  setIsShortenerOpen(true);
                }}
                onCallAuthor={(pubkeyHex) => {
                  setSelectedCallTargetPubkey(pubkeyHex);
                  setIsCallOpen(true);
                }}
                onMessageAuthor={(pubkeyHex) => {
                  setSelectedChatPubkey(pubkeyHex);
                  setIsChatOpen(true);
                }}
              />
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setIsComposerOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-lg font-bold flex items-center justify-center transition-transform active:scale-90"
        title="Broadcast Public Note"
      >
        <Radio className="w-6 h-6 animate-pulse" />
      </button>

      {/* System Modals */}
      <CreateBroadcastModal
        identity={identity}
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onBroadcastSuccess={() => setFeedEvents(nostrService.getFeed())}
      />

      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        identity={identity}
        initialTargetPubkey={selectedChatPubkey}
        onOpenCall={(targetPubkey) => {
          setSelectedCallTargetPubkey(targetPubkey);
          setIsCallOpen(true);
        }}
      />

      <IdentityModal
        identity={identity}
        isOpen={isIdentityOpen}
        onClose={() => setIsIdentityOpen(false)}
        onSaveIdentity={(newId) => setIdentity(newId)}
      />

      <RelaysModal
        relays={relays}
        isOpen={isRelaysOpen}
        onClose={() => setIsRelaysOpen(false)}
      />

      <IpfsSwarmModal
        isOpen={isSwarmOpen}
        onClose={() => setIsSwarmOpen(false)}
      />

      <DuressModal
        isOpen={isDuressOpen}
        onClose={() => setIsDuressOpen(false)}
        onTriggerDuressNow={() => setIsDuressActive(true)}
      />

      <UrlShortenerModal
        isOpen={isShortenerOpen}
        onClose={() => {
          setIsShortenerOpen(false);
          setShortenerEvent(null);
          setShortenerCid(null);
        }}
        initialEvent={shortenerEvent}
        initialCid={shortenerCid}
      />

      <ContentModerationModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
        onOpenLegal={() => setIsLegalOpen(true)}
      />

      <CallInterfaceModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        identity={identity}
        initialTargetPubkey={selectedCallTargetPubkey}
      />

      <LegalDocument
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
      />

      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        feedEvents={feedEvents}
        relayNodes={relays}
        swarmPeerCount={DEFAULT_IPFS_PEERS.length}
      />

      <PwaInstallModal
        isOpen={isPwaInstallOpen}
        onClose={() => setIsPwaInstallOpen(false)}
      />

      <TorRoutingModal
        isOpen={isTorOpen}
        onClose={() => setIsTorOpen(false)}
      />

      <UltrasonicTransferModal
        isOpen={isUltrasonicOpen}
        onClose={() => setIsUltrasonicOpen(false)}
        identity={identity}
      />

      <ColdStorageModal
        isOpen={isColdStorageOpen}
        onClose={() => setIsColdStorageOpen(false)}
        identity={identity}
      />

      <EmergencyMapModal
        isOpen={isEmergencyMapOpen}
        onClose={() => setIsEmergencyMapOpen(false)}
        identity={identity}
      />

      <SealedBlastModal
        isOpen={isSealedBlastOpen}
        onClose={() => setIsSealedBlastOpen(false)}
        identity={identity}
      />

      <ModerationShieldModal
        isOpen={isModerationOpen}
        onClose={() => setIsModerationOpen(false)}
        identity={identity}
      />

      <PrivacyStudioModal
        isOpen={isPrivacyStudioOpen}
        onClose={() => setIsPrivacyStudioOpen(false)}
      />

      <WhistleblowerVaultModal
        isOpen={isWhistleblowerOpen}
        onClose={() => setIsWhistleblowerOpen(false)}
        identity={identity}
      />

      <AntiSpamFortressModal
        isOpen={isAntiSpamFortressOpen}
        onClose={() => setIsAntiSpamFortressOpen(false)}
        identity={identity}
      />

      <ClearCacheModal
        isOpen={isClearCacheOpen}
        onClose={() => setIsClearCacheOpen(false)}
      />

      {/* NIP-09 Batch & Single Deletion Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {singleDeleteTargetId
                    ? 'Delete Authored Post?'
                    : `Delete ${selectedPostIds.length} Selected Post(s)?`}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Cryptographic NIP-09 Relay Deletion
                </p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-950 space-y-2 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Permanent Decentralized Broadcast Action
              </p>
              <p className="text-slate-600">
                This operation will generate and sign a Nostr <strong>Kind: 5 (NIP-09)</strong> deletion request with your private key and broadcast it across all connected WebSocket relays (Damus, nos.lol, Primal) to purge the note(s) permanently.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setSingleDeleteTargetId(null);
                }}
                disabled={isDeletingPosts}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeletion}
                disabled={isDeletingPosts}
                className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                {isDeletingPosts ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Broadcasting Deletion...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
