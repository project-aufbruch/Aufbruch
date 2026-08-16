import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Plus,
  Phone,
  Settings,
  User,
  Shield,
  Wifi,
  Network,
  Link2,
  Download,
  BarChart3,
  FileText,
  QrCode,
  ShieldAlert,
  X,
  ChevronDown,
  Sparkles,
  Lock,
  Radio,
  Layers,
  HardDrive,
  Sun,
  Moon,
  EyeOff
} from 'lucide-react';
import { UserIdentity } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeaderNavProps {
  identity: UserIdentity | null;
  relayCount: number;
  swarmCount: number;
  isDuressActive: boolean;
  onOpenIdentity: () => void;
  onOpenRelays: () => void;
  onOpenSwarm: () => void;
  onOpenDuress: () => void;
  onOpenComposer: () => void;
  onOpenShortener: () => void;
  onOpenSafety: () => void;
  onOpenLegal?: () => void;
  onOpenCall?: () => void;
  onOpenChat?: () => void;
  onOpenAdmin?: () => void;
  onOpenPwaInstall?: () => void;
  onOpenTor?: () => void;
  onOpenUltrasonic?: () => void;
  onOpenColdStorage?: () => void;
  onOpenEmergencyMap?: () => void;
  onOpenSealedBlast?: () => void;
  onOpenModeration?: () => void;
  onOpenPrivacyStudio?: () => void;
  onOpenWhistleblowerVault?: () => void;
  onOpenAntiSpamFortress?: () => void;
  onOpenClearCache?: () => void;
  torEnabled?: boolean;
  callStatus?: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  identity,
  relayCount,
  swarmCount,
  isDuressActive,
  onOpenIdentity,
  onOpenRelays,
  onOpenSwarm,
  onOpenDuress,
  onOpenComposer,
  onOpenShortener,
  onOpenSafety,
  onOpenLegal,
  onOpenCall,
  onOpenChat,
  onOpenAdmin,
  onOpenPwaInstall,
  onOpenTor,
  onOpenUltrasonic,
  onOpenColdStorage,
  onOpenEmergencyMap,
  onOpenSealedBlast,
  onOpenModeration,
  onOpenPrivacyStudio,
  onOpenWhistleblowerVault,
  onOpenAntiSpamFortress,
  onOpenClearCache,
  torEnabled = false,
  callStatus = 'idle',
}) => {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2.5 transition-colors shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
              <MessageSquare className="w-5 h-5 fill-white/20 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-lg text-slate-900 dark:text-white">AUFBRUCH</span>
                <span className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                  Decentralized
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Open Public Social Network</p>
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2">
          {/* Global Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-fade-in" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 animate-fade-in" />
            )}
          </button>

          {/* E2EE Call Button */}
          {onOpenCall && (
            <button
              onClick={onOpenCall}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                callStatus === 'incoming' || callStatus === 'calling'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 animate-pulse'
                  : callStatus === 'connected'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
              title="Start or Receive Audio/Video Call"
            >
              <Phone className={`w-3.5 h-3.5 ${callStatus !== 'idle' ? 'animate-bounce text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className="hidden sm:inline">
                {callStatus === 'incoming'
                  ? 'Call Waiting...'
                  : callStatus === 'connected'
                  ? 'Connected Call'
                  : 'Call'}
              </span>
            </button>
          )}

          {/* Secure Messages & Group Chat Button */}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Open Encrypted 1-on-1 & Group Chats"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Chat & Groups</span>
            </button>
          )}

          {/* Privacy Studio (Face Blur, Voice Pitch, EXIF Stripper) */}
          {onOpenPrivacyStudio && (
            <button
              onClick={onOpenPrivacyStudio}
              className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-700/80 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Privacy Studio: Face Blur, Voice Pitch Shift, EXIF Scrubber"
            >
              <EyeOff className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span className="hidden md:inline">Privacy Studio</span>
              <span className="text-[10px] bg-orange-200/80 dark:bg-orange-900/80 text-orange-900 dark:text-orange-200 px-1.5 py-0.2 rounded-full font-mono">
                DSP
              </span>
            </button>
          )}

          {/* Whistleblower Dead-Drop Quick Action Button */}
          {onOpenWhistleblowerVault && (
            <button
              onClick={onOpenWhistleblowerVault}
              className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Whistleblower & Secret Government Document Dead-Drop Vault"
            >
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Whistleblower Vault</span>
              <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 px-1.5 py-0.2 rounded-full font-mono">
                Gov Drops
              </span>
            </button>
          )}

          {/* Tor Onion Routing Button */}
          {onOpenTor && (
            <button
              onClick={onOpenTor}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                torEnabled
                  ? 'bg-purple-100/90 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="Tor Onion Routing SOCKS5 Proxy Circuit"
            >
              <Layers className={`w-3.5 h-3.5 ${torEnabled ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>Tor {torEnabled ? 'Active' : 'Proxy'}</span>
            </button>
          )}

          {/* Master Admin / Architect Portal Button */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="hidden sm:flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Network Admin & Master Architect Control"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Admin</span>
            </button>
          )}

          {/* New Post Button */}
          <button
            onClick={onOpenComposer}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post</span>
          </button>

          {/* Save App / PWA Install Button */}
          {onOpenPwaInstall && (
            <button
              onClick={onOpenPwaInstall}
              className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Save App to Home Screen"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Install App</span>
            </button>
          )}

          {/* User Profile / Identity Button */}
          <button
            onClick={onOpenIdentity}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            title="Account Profile & Security Keys"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              {(identity?.petname || 'U')[0].toUpperCase()}
            </div>
            <span className="hidden sm:inline max-w-[90px] truncate">
              {identity ? identity.petname : 'Profile'}
            </span>
          </button>

          {/* Settings & Network Menu Gear */}
          <div className="relative">
            <button
              onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Settings & Network Connections"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Dropdown Menu for Network & Settings */}
            {isSettingsMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 text-xs space-y-1 font-sans animate-fade-in text-slate-800 dark:text-slate-200">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Settings & Network</span>
                  <button onClick={() => setIsSettingsMenuOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Theme Toggle within Menu as well */}
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                    <span>Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                    Toggle
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsSettingsMenuOpen(false);
                    onOpenRelays();
                  }}
                  className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Network Relays</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                    {relayCount} Active
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsSettingsMenuOpen(false);
                    onOpenSwarm();
                  }}
                  className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-cyan-600" />
                    <span>Media Storage Nodes</span>
                  </div>
                  <span className="text-[10px] bg-cyan-50 border border-cyan-200 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">
                    {swarmCount} Nodes
                  </span>
                </button>

                {onOpenTor && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenTor();
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" />
                      <span>Tor Onion Routing</span>
                    </div>
                    <span className={`text-[10px] border px-2 py-0.5 rounded-full font-semibold ${
                      torEnabled
                        ? 'bg-purple-50 border-purple-200 text-purple-700'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      {torEnabled ? 'Enabled' : 'Off'}
                    </span>
                  </button>
                )}

                {onOpenUltrasonic && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenUltrasonic();
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-blue-600" />
                      <span>Ultrasonic Mesh (Air-Gap)</span>
                    </div>
                    <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      Audio FSK
                    </span>
                  </button>
                )}

                {onOpenEmergencyMap && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenEmergencyMap();
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-600" />
                      <span>Offline Safe Zone Map</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                      Vector GPS
                    </span>
                  </button>
                )}

                {onOpenColdStorage && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenColdStorage();
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Hardware & Paper Vault</span>
                    </div>
                    <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                      BIP-39
                    </span>
                  </button>
                )}

                {onOpenSealedBlast && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenSealedBlast();
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Encrypted Sealed Blast</span>
                    </div>
                    <span className="text-[10px] bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                      NIP-17
                    </span>
                  </button>
                )}

                {onOpenPrivacyStudio && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenPrivacyStudio();
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span>Privacy Studio (Face & Voice)</span>
                    </div>
                    <span className="text-[10px] bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-semibold">
                      DSP Studio
                    </span>
                  </button>
                )}

                {onOpenWhistleblowerVault && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenWhistleblowerVault();
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Whistleblower Vault & Leaks</span>
                    </div>
                    <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                      Air-Gap Drop
                    </span>
                  </button>
                )}

                {onOpenAntiSpamFortress && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenAntiSpamFortress();
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Fortress 100% Spam Shield</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                      Spam-Free
                    </span>
                  </button>
                )}

                {onOpenModeration && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenModeration();
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>Anti-Spam & Moderation</span>
                    </div>
                    <span className="text-[10px] bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold">
                      PoW Shield
                    </span>
                  </button>
                )}

                {onOpenClearCache && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenClearCache();
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Clear Cache & Prune Storage</span>
                    </div>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                      IPFS / IDB
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsSettingsMenuOpen(false);
                    onOpenShortener();
                  }}
                  className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Link2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Share App / Link Shortener</span>
                </button>

                <button
                  onClick={() => {
                    setIsSettingsMenuOpen(false);
                    onOpenSafety();
                  }}
                  className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Community Safety & Filters</span>
                </button>

                {onOpenAdmin && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Analytics & Network Status</span>
                  </button>
                )}

                {onOpenLegal && (
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenLegal();
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Terms & Privacy Policy</span>
                  </button>
                )}

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setIsSettingsMenuOpen(false);
                      onOpenDuress();
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors font-medium cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Clear Data & Quick Reset</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

