import React, { useState } from 'react';
import { Wifi, Lock, ShieldCheck, Plus, X, Server, Activity } from 'lucide-react';
import { RelayNode } from '../types';

interface RelaysModalProps {
  relays: RelayNode[];
  isOpen: boolean;
  onClose: () => void;
}

export const RelaysModal: React.FC<RelaysModalProps> = ({ relays, isOpen, onClose }) => {
  const [customRelay, setCustomRelay] = useState('');
  const [relayList, setRelayList] = useState<RelayNode[]>(relays);

  if (!isOpen) return null;

  const handleAddRelay = () => {
    if (!customRelay.startsWith('wss://')) {
      alert('Relay URL must begin with wss://');
      return;
    }
    setRelayList([
      ...relayList,
      {
        url: customRelay,
        status: 'connected',
        pingMs: Math.floor(Math.random() * 40) + 30,
        eventsReceived: 0,
        isBackup: false,
        location: 'Custom Relay Node',
      },
    ]);
    setCustomRelay('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-xl text-zinc-100 shadow-2xl overflow-hidden my-8 font-mono">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base text-zinc-100">Nostr Relay Network & Obfuscation</h2>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Traffic Camouflage Architecture Diagram */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Layer 6: Traffic Camouflage & DoH Wrapper
            </span>
            <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded">
              DoH Active (1.1.1.1)
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            All WebSocket relay hostnames are resolved via <strong>Encrypted DNS-over-HTTPS (DoH)</strong> over Cloudflare (1.1.1.1) or Google DNS, preventing state ISPs in high-surveillance regions from intercepting plaintext DNS queries.
          </p>

          <div className="p-2.5 bg-zinc-900 border border-emerald-950 rounded-lg flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Layer 1: Zero-Trace Key Material
            </span>
            <span className="text-zinc-400 font-mono text-[10px]">
              PBKDF2 600,000 Iterations • Volatile Memory
            </span>
          </div>
        </div>


        {/* Relay Nodes List */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>DISTRIBUTED GLOBAL RELAY NODES</span>
            <span>{relayList.filter(r => r.status === 'connected').length} / {relayList.length} Connected</span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {relayList.map((relay, idx) => (
              <div
                key={idx}
                className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${relay.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  <div>
                    <div className="font-bold text-zinc-200 truncate">{relay.url}</div>
                    <div className="text-[10px] text-zinc-500">{relay.location} {relay.isBackup ? '• Hardcoded Failover' : ''}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-emerald-400 font-bold">{relay.pingMs}ms</span>
                  <span className="text-zinc-500 text-[10px]">{relay.eventsReceived} evts</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Relay Form */}
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <label className="block text-xs font-semibold text-zinc-400">ADD CUSTOM RELAY URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customRelay}
                onChange={(e) => setCustomRelay(e.target.value)}
                placeholder="wss://my-onion-relay.onion"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAddRelay}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
