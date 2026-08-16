import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  Smartphone,
  Globe,
  Radio,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  UserX,
  ServerOff,
  CheckCircle2,
  Zap,
  Share2
} from 'lucide-react';

interface AboutLandingCardProps {
  onOpenIdentity: () => void;
  onOpenComposer: () => void;
}

export const AboutLandingCard: React.FC<AboutLandingCardProps> = ({
  onOpenIdentity,
  onOpenComposer,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 md:p-6 shadow-xl border border-indigo-500/20 relative overflow-hidden font-sans my-4">
      {/* Background Decorative Lighting */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 tracking-wide uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Censorship-Resistant Social Network
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> 100% Zero-Tracking
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Welcome to AUFBRUCH
          </h1>

          <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
            An open, decentralized platform where freedom of expression is protected by mathematics. No central databases, no corporate censors, and no email or phone tracking required.
          </p>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{isExpanded ? 'Hide Security Overview' : 'How It Works & Safety Guide'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quick Summary Badges (Always Visible) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800 text-xs font-medium">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 flex items-center gap-2">
          <UserX className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-slate-200">No Email or Phone Needed</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-200">Sovereign Crypto Keys</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 flex items-center gap-2">
          <ServerOff className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-slate-200">Decentralized Nostr Relays</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-200">EXIF Scrub & Auto-Expire</span>
        </div>
      </div>

      {/* Expanded Detailed Explainer */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-slate-800 space-y-6 text-xs text-slate-300 animate-fade-in">
          {/* Section 1: Why No Phone/Email Login */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <UserX className="w-4 h-4 text-rose-400" />
              <span>Why We Don't Use Phone Numbers or Email Addresses</span>
            </h3>
            <p className="leading-relaxed">
              Traditional platforms demand your phone number or email address to track your identity across the web, tie your account to government ID systems, and expose you to SIM-swap attacks, spam, or password data leaks.
            </p>
            <p className="leading-relaxed font-medium text-slate-200">
              AUFBRUCH rejects mandatory identity harvesting. We believe communication is a fundamental human right that should not require surrendering personal credentials to a central database.
            </p>
          </div>

          {/* Section 2: How Cryptographic Login Logic Works */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>How Login Logic Works (Public-Key Cryptography)</span>
            </h3>
            <p className="leading-relaxed">
              Instead of a username and password stored on a corporate server, AUFBRUCH uses mathematical key pairs generated locally inside your web browser:
            </p>
            <ul className="space-y-1.5 pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Public Key (<code className="text-indigo-300">npub...</code>):</strong> Acts as your public handle/address. Anyone can follow you or view broadcasts you sign with this key.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Secret Private Key (<code className="text-amber-300">nsec...</code>) / 12-Word Seed Phrase:</strong> Stored strictly on your local device. It mathematically signs every broadcast to prove it came from you without revealing who you are in real life.
                </span>
              </li>
            </ul>
            <p className="text-slate-400 text-[11px] pt-1">
              * Note: To switch devices or back up your account, simply view or export your 12-word seed phrase in your profile settings. Never share your secret private key with anyone!
            </p>
          </div>

          {/* Section 3: Safety, Anonymity & Privacy Protection Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3.5 space-y-1.5">
              <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-emerald-400" />
                <span>Media Anonymization & EXIF Stripping</span>
              </h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                When you upload photos or record voice notes, AUFBRUCH automatically strips GPS coordinates, camera specs, and EXIF metadata. Voice notes can also be pitch-shifted to protect speaker identity.
              </p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3.5 space-y-1.5">
              <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Auto-Expiring Posts & Encrypted Channels</span>
              </h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Post publicly across sub-channels (#Tech, #Crypto, #News) or choose 24h Auto-Expire (Self-Destruct) or Anonymous Ghost Alias mode for sensitive broadcasts.
              </p>
            </div>
          </div>

          {/* Call-to-action buttons inside expanded guide */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenIdentity}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all border border-slate-600 text-xs flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>View My Security Keys</span>
              </button>

              <button
                onClick={onOpenComposer}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Create First Broadcast</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 italic">
              Powered by Nostr, IPFS Swarm & WebRTC Mesh
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
