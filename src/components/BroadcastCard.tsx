import React, { useState, useEffect } from 'react';
import { NostrEvent } from '../types';
import {
  Heart,
  Repeat,
  MessageCircle,
  MessageSquare,
  Zap,
  Share2,
  MoreHorizontal,
  Check,
  CheckCircle2,
  Copy,
  Volume2,
  Play,
  Pause,
  Link2,
  QrCode,
  Flag,
  ShieldCheck,
  UserX,
  AlertOctagon,
  X,
  Sparkles,
  BarChart2,
  Clock,
  Hash,
  Phone,
  Trash2
} from 'lucide-react';
import { createZapInvoice, executeZapPayment } from '../services/lightningZaps';
import { trackLocalEvent } from '../services/analytics';
import { nostrService } from '../services/nostr';
import { urlShortenerService } from '../services/urlShortener';
import { webOfTrustService, ReputationScore } from '../services/reputation';
import { communitySafetyManager } from '../services/safetyFilter';
import { recommendationEngine } from '../services/recommendation';
import { QrModal } from './QrModal';

interface BroadcastCardProps {
  event: NostrEvent;
  currentUserPubkey?: string;
  onOpenShortener?: (evt: NostrEvent) => void;
  onCallAuthor?: (pubkeyHex: string) => void;
  onMessageAuthor?: (pubkeyHex: string) => void;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (eventId: string) => void;
  onDeleteSingle?: (eventId: string) => void;
}

export const BroadcastCard: React.FC<BroadcastCardProps> = ({
  event,
  currentUserPubkey,
  onOpenShortener,
  onCallAuthor,
  onMessageAuthor,
  selectable,
  isSelected,
  onToggleSelect,
  onDeleteSingle,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(() => Math.floor(Math.random() * 8) + 1);
  const [isReposted, setIsReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(() => Math.floor(Math.random() * 3));
  const [showMenu, setShowMenu] = useState(false);
  
  const [copiedCid, setCopiedCid] = useState(false);
  const [copiedNpub, setCopiedNpub] = useState(false);
  const [copiedShortUrl, setCopiedShortUrl] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string>('illegal_activity');
  const [isReported, setIsReported] = useState(() => communitySafetyManager.isEventFlagged(event.id));
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);
  const [isZapping, setIsZapping] = useState(false);
  const [zapSuccessMsg, setZapSuccessMsg] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Poll voting state
  const [votedOption, setVotedOption] = useState<number | null>(null);
  const [pollVotes, setPollVotes] = useState<number[]>(() => event.pollVotes || (event.pollOptions ? event.pollOptions.map(() => 0) : []));
  const [rep, setRep] = useState<ReputationScore>(() => 
    webOfTrustService.getReputation(event.pubkey, event.powDifficulty || 0)
  );

  useEffect(() => {
    const unsub = webOfTrustService.subscribe(() => {
      setRep(webOfTrustService.getReputation(event.pubkey, event.powDifficulty || 0));
    });
    return unsub;
  }, [event.pubkey, event.powDifficulty]);

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
    if (!isLiked) {
      recommendationEngine.trackInteraction(event.channel || 'general', 3);
      if (event.content) {
        event.content.split(' ').forEach(w => {
          if (w.startsWith('#')) recommendationEngine.trackInteraction(w, 2);
        });
      }
    }
  };

  const handleVotePoll = (index: number) => {
    if (votedOption === null) {
      setVotedOption(index);
      const updated = [...pollVotes];
      updated[index] = (updated[index] || 0) + 1;
      setPollVotes(updated);
      nostrService.voteOnPoll(event.id, index);
      recommendationEngine.trackInteraction(event.channel || 'general', 4);
    }
  };

  const handleToggleRepost = () => {
    setIsReposted(!isReposted);
    setRepostCount(prev => (isReposted ? prev - 1 : prev + 1));
  };

  const handleToggleTrust = () => {
    if (rep.trustLevel === 'trusted_direct') {
      webOfTrustService.removeDirectTrust(event.pubkey);
    } else {
      webOfTrustService.addDirectTrust(event.pubkey, event.authorPetname || 'VoiceAuthor');
    }
  };

  const handleMuteAuthor = () => {
    if (rep.isMuted) {
      webOfTrustService.unmuteAuthor(event.pubkey);
    } else {
      webOfTrustService.muteAuthor(event.pubkey);
    }
  };

  const handleSubmitReport = () => {
    communitySafetyManager.reportEvent(event.id, reportReason, event.pubkey);
    webOfTrustService.muteAuthor(event.pubkey);
    setIsReported(true);
    setShowReportModal(false);
    setReportSuccessMsg('Report submitted. Content hidden.');
    setTimeout(() => setReportSuccessMsg(null), 4000);
  };

  const formatTime = (ts: number) => {
    const diffSec = Math.floor(Date.now() / 1000) - ts;
    if (diffSec < 60) return `${Math.max(1, diffSec)}s`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
    return `${Math.floor(diffSec / 86400)}d`;
  };

  const copyToClipboard = (text: string, type: 'cid' | 'npub') => {
    navigator.clipboard.writeText(text);
    if (type === 'cid') {
      setCopiedCid(true);
      setTimeout(() => setCopiedCid(false), 2000);
    } else {
      setCopiedNpub(true);
      setTimeout(() => setCopiedNpub(false), 2000);
    }
  };

  const handleExecuteZap = async (sats: number) => {
    setIsZapping(true);
    setZapSuccessMsg(null);
    try {
      const invoice = createZapInvoice(event.id, event.pubkey, currentUserPubkey || 'anonymous', sats);
      await executeZapPayment(invoice);
      nostrService.addZapToEvent(event.id, sats);
      recommendationEngine.trackInteraction(event.channel || 'general', 5);
      await trackLocalEvent('zap_sent', { amountSats: sats, recipient: event.pubkey });
      setZapSuccessMsg(`⚡ Sent ${sats.toLocaleString()} Sats!`);
      setTimeout(() => {
        setIsZapping(false);
        setZapSuccessMsg(null);
      }, 3000);
    } catch {
      setIsZapping(false);
    }
  };

  if (isReported) {
    return (
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>Post hidden due to community report</span>
        </div>
        <button
          onClick={() => setIsReported(false)}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
        >
          View Anyway
        </button>
      </div>
    );
  }

  const authorName = event.authorPetname || `User-${event.pubkey.substring(0, 6)}`;
  const totalPollVotes = pollVotes.reduce((acc, v) => acc + v, 0);

  const isAuthor = currentUserPubkey && currentUserPubkey === event.pubkey;

  return (
    <article
      className={`social-card rounded-2xl p-4 md:p-5 text-slate-900 dark:text-slate-100 relative transition-all bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/25 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-md'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Top Author Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Multi-Select Checkbox if selectable */}
          {selectable && (
            <button
              type="button"
              onClick={() => onToggleSelect && onToggleSelect(event.id)}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800 text-transparent'
              }`}
              title={isSelected ? 'Deselect post' : 'Select post for deletion'}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          )}

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-sm shrink-0">
            {authorName[0].toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-white text-sm hover:underline cursor-pointer">
                {authorName}
              </span>
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-950" title="Verified Decentralized Identity" />
              <span className="text-slate-500 dark:text-slate-400 text-xs">
                @{event.pubkey.substring(0, 8)}
              </span>
              <span className="text-slate-400 dark:text-slate-600 text-xs">•</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs">
                {formatTime(event.created_at)}
              </span>
            </div>

            {/* Badges: Channel & Verification */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              {event.channel && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold rounded-md">
                  <Hash className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>{event.channel}</span>
                </span>
              )}

              {event.privacyMode === 'self_destruct' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-medium rounded-md">
                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>24h Auto-Expire</span>
                </span>
              )}

              {event.privacyMode === 'anonymous' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-medium rounded-md">
                  <span>👻 Anonymous Ghost</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3 h-3" /> Signed & Verified
              </span>
            </div>
          </div>
        </div>

        {/* Options Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-30 text-xs font-sans space-y-1 text-slate-800 dark:text-slate-200">
              {onMessageAuthor && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onMessageAuthor(event.pubkey);
                  }}
                  className="w-full flex items-center gap-2 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl text-indigo-800 dark:text-indigo-300 font-semibold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Private Chat Author</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowMenu(false);
                  if (onCallAuthor) {
                    onCallAuthor(event.pubkey);
                  }
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl text-emerald-800 dark:text-emerald-300 font-semibold transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Call Author (E2EE P2P)</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  copyToClipboard(event.authorNpub || event.pubkey, 'npub');
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Copy Public Key</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  handleToggleTrust();
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{rep.trustLevel === 'trusted_direct' ? 'Remove Trust' : 'Mark Trusted'}</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  handleMuteAuthor();
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
              >
                <UserX className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{rep.isMuted ? 'Unmute Author' : 'Mute Author'}</span>
              </button>

              {/* Delete Single Post Option if author or onDeleteSingle provided */}
              {(isAuthor || onDeleteSingle) && (
                <>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (onDeleteSingle) {
                        onDeleteSingle(event.id);
                      }
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Delete Post (NIP-09)</span>
                  </button>
                </>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowReportModal(true);
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors"
              >
                <Flag className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Report Post</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Post Content */}
      <div className="my-2.5 text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
        {event.content}
      </div>

      {/* Poll Component if Present */}
      {event.pollOptions && event.pollOptions.length > 0 && (
        <div className="my-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2.5 font-sans">
          <div className="flex items-center justify-between text-xs mb-1 flex-wrap gap-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>
                {event.pollCategory === 'government_policy'
                  ? '🏛️ Government Policy Referendum'
                  : event.pollCategory === 'system_motion'
                  ? '🛑 System Reform Motion'
                  : event.pollCategory === 'community_proposal'
                  ? '💡 Community Freedom Initiative'
                  : '📊 Civic Referendum / Poll'}
              </span>
            </div>
            <span className="text-slate-500 dark:text-slate-400 font-medium">{totalPollVotes} votes cast</span>
          </div>

          <div className="space-y-2">
            {event.pollOptions.map((opt, idx) => {
              const count = pollVotes[idx] || 0;
              const pct = totalPollVotes > 0 ? Math.round((count / totalPollVotes) * 100) : 0;
              const isSelected = votedOption === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleVotePoll(idx)}
                  className={`w-full text-left p-2.5 rounded-xl border relative overflow-hidden transition-all text-xs font-medium ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 font-bold shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Progress bar background fill */}
                  {votedOption !== null && (
                    <div
                      className={`absolute left-0 top-0 bottom-0 opacity-20 transition-all ${
                        isSelected ? 'bg-indigo-600' : 'bg-slate-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  )}

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      {isSelected && <span className="text-indigo-600 dark:text-indigo-400 font-black">✓</span>}
                      <span>{opt}</span>
                    </span>
                    {votedOption !== null && (
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{pct}% ({count})</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {votedOption !== null && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cryptographically Signed Vote Recorded (1 Vote per Identity Enforced)</span>
            </div>
          )}
        </div>
      )}

      {/* Media Note Audio Player if present */}
      {event.mediaType === 'audio' && (
        <div className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow transition-transform active:scale-95 cursor-pointer"
            >
              {isPlayingAudio ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>
            <div>
              <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 block">Voice Audio Note</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">0:24 • Audio Filter Applied</span>
            </div>
          </div>
          <Volume2 className={`w-5 h-5 text-indigo-600 dark:text-indigo-400 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
        </div>
      )}

      {/* Social Action Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        {/* Like */}
        <button
          onClick={handleToggleLike}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            isLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
          <span>{likeCount}</span>
        </button>

        {/* Repost */}
        <button
          onClick={handleToggleRepost}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            isReposted ? 'text-emerald-600 font-bold' : 'hover:text-emerald-600'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>{repostCount}</span>
        </button>

        {/* Zap / Tip */}
        <button
          onClick={() => handleExecuteZap(1000)}
          className="flex items-center gap-1.5 hover:text-amber-600 transition-colors text-amber-600 dark:text-amber-400 font-medium cursor-pointer"
          title="Tip author 1,000 Sats"
        >
          <Zap className="w-4 h-4 fill-amber-100 dark:fill-amber-950 text-amber-600 dark:text-amber-400" />
          <span>{(event.zatsTotal || 0) > 0 ? `${event.zatsTotal} Sats` : 'Tip'}</span>
        </button>

        {/* Message / Chat */}
        {onMessageAuthor && (
          <button
            onClick={() => onMessageAuthor(event.pubkey)}
            className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            title="Start private encrypted chat with author"
          >
            <MessageSquare className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>Chat</span>
          </button>
        )}

        {/* Share QR / Link */}
        <button
          onClick={() => {
            if (onOpenShortener) {
              onOpenShortener(event);
            } else {
              const fullUrl = `${window.location.origin}${window.location.pathname}?event=${event.id}`;
              navigator.clipboard.writeText(fullUrl);
              setCopiedShortUrl(true);
              setTimeout(() => setCopiedShortUrl(false), 2000);
            }
          }}
          className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          {copiedShortUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          <span>{copiedShortUrl ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Toast Messages */}
      {zapSuccessMsg && (
        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs text-center animate-fade-in font-sans font-medium">
          {zapSuccessMsg}
        </div>
      )}

      {/* QR Modal */}
      <QrModal
        isOpen={showQr}
        onClose={() => setShowQr(false)}
        title="Share Post QR"
        subtitle={`Scan to open post by ${authorName}`}
        value={`${window.location.origin}${window.location.pathname}?event=${event.id}`}
        shortCode={event.id.substring(0, 8)}
      />

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <Flag className="w-4 h-4" />
                <span>Report Post</span>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Help us keep the community safe. Reporting this post will hide it from your feed.
            </p>

            <div className="space-y-2 mb-4 text-xs">
              {[
                { id: 'csam', label: 'Harassment or Illegal Content' },
                { id: 'violent_threat', label: 'Violence or Dangerous Activity' },
                { id: 'doxxing', label: 'Spam or Misleading Info' },
              ].map(reason => (
                <label key={reason.id} className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason.id}
                    checked={reportReason === reason.id}
                    onChange={() => setReportReason(reason.id)}
                    className="accent-indigo-600"
                  />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{reason.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button onClick={() => setShowReportModal(false)} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSubmitReport} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer">
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

