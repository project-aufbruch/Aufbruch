import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Radio, Database, Cpu, ChevronDown, ChevronUp, Server, Shield } from 'lucide-react';
import { DEFAULT_RELAYS } from '../services/nostr';
import { DEFAULT_IPFS_PEERS } from '../services/ipfs';
import { localProximityService, ProximityPeer } from '../services/localProximityService';

interface NetworkStatusBarProps {
  onOpenRelaysModal?: () => void;
  onOpenSwarmModal?: () => void;
}

export const NetworkStatusBar: React.FC<NetworkStatusBarProps> = ({
  onOpenRelaysModal,
  onOpenSwarmModal,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [localPeers, setLocalPeers] = useState<ProximityPeer[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubLocal = localProximityService.subscribe((peers) => {
      setLocalPeers(peers);
    });

    localProximityService.startScanning();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubLocal();
    };
  }, []);

  const connectedRelaysCount = isOnline ? DEFAULT_RELAYS.filter(r => r.status === 'connected').length : 0;
  const totalRelaysCount = DEFAULT_RELAYS.length;
  const ipfsSwarmCount = DEFAULT_IPFS_PEERS.length;
  const connectedLocalMeshCount = localPeers.length;

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-all font-sans">
      <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3">
        {/* Left Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Decentralized Network Active</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-slate-600 dark:text-slate-400 text-xs font-medium">
            <button
              onClick={onOpenRelaysModal}
              className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Relays: <strong className="text-slate-900 dark:text-white">{connectedRelaysCount}/{totalRelaysCount}</strong></span>
            </button>

            <button
              onClick={onOpenSwarmModal}
              className="flex items-center gap-1 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Media Nodes: <strong className="text-slate-900 dark:text-white">{ipfsSwarmCount}</strong></span>
            </button>

            {connectedLocalMeshCount > 0 && (
              <div className="flex items-center gap-1 text-teal-700 dark:text-teal-400">
                <Radio className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
                <span>Nearby Peers: <strong>{connectedLocalMeshCount}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Right Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span>Network Details</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Network Panel */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 animate-fade-in text-xs space-y-4 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Relays */}
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Nostr Relays ({connectedRelaysCount}/{totalRelaysCount})</span>
                </div>
                {onOpenRelaysModal && (
                  <button onClick={onOpenRelaysModal} className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer">
                    Configure
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {DEFAULT_RELAYS.map((relay, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="truncate max-w-[160px] text-slate-800 dark:text-slate-200 font-mono">{relay.url}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Media Swarm */}
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Media Storage Nodes ({ipfsSwarmCount})</span>
                </div>
                {onOpenSwarmModal && (
                  <button onClick={onOpenSwarmModal} className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-medium cursor-pointer">
                    Manage
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {DEFAULT_IPFS_PEERS.map((peer, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="truncate max-w-[150px] text-slate-800 dark:text-slate-200 font-mono">{peer.address}</span>
                    <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-full font-semibold">
                      Online
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct P2P Mesh */}
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Local P2P Peers ({connectedLocalMeshCount})</span>
                </div>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                  WebRTC / mDNS
                </span>
              </div>
              {localPeers.length === 0 ? (
                <p className="p-3 text-center text-slate-500 dark:text-slate-400 text-[11px]">
                  Scanning for nearby local area network peers...
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {localPeers.map((peer) => (
                    <div key={peer.id} className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{peer.name}</span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">Connected</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
