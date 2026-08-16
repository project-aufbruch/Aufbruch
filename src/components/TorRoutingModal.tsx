import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  X,
  Lock,
  Radio,
  CheckCircle2,
  ShieldCheck,
  Server,
  Layers,
  Fingerprint
} from 'lucide-react';
import { torService } from '../services/torService';
import { TorConfig } from '../types';

interface TorRoutingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TorRoutingModal: React.FC<TorRoutingModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<TorConfig>(torService.getConfig());
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    const unsub = torService.subscribe((newConf) => {
      setConfig(newConf);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleToggle = () => {
    torService.toggleTor();
  };

  const handleNewCircuit = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      torService.buildNewCircuit();
      setIsRegenerating(false);
    }, 600);
  };

  const handleBridgeChange = (mode: 'obfs4' | 'meek-azure' | 'snowflake' | 'direct') => {
    torService.setBridgeMode(mode);
  };

  const totalLatency = torService.getTotalLatency();
  const exitIp = torService.getExitIp();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden my-6 relative">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Tor Onion Routing SOCKS5 Proxy</h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  config.enabled
                    ? 'bg-purple-500/30 border-purple-300 text-purple-200'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400'
                }`}>
                  {config.enabled ? 'Circuit Active' : 'Direct Routing'}
                </span>
              </div>
              <p className="text-xs text-purple-200/80 font-medium">
                Simulated multi-hop cryptographic onion circuits for high-threat surveillance zones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Activation Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
            config.enabled
              ? 'bg-purple-50/70 border-purple-200 text-purple-950'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                config.enabled ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">
                  {config.enabled ? 'SOCKS5 Onion Routing Enabled (Port 9050)' : 'Tor Onion Routing Disabled'}
                </p>
                <p className="text-xs text-slate-500">
                  {config.enabled
                    ? 'All WebRTC signals, Nostr relays, and IPFS packets are routed through 3 encrypted hops.'
                    : 'Packets route directly to public relays with standard TLS.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                config.enabled
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {config.enabled ? 'Disable' : 'Enable Tor'}
            </button>
          </div>

          {/* 3-Hop Circuit Visualizer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-600" />
                Active 3-Hop Onion Circuit
              </h3>
              {config.enabled && (
                <button
                  onClick={handleNewCircuit}
                  disabled={isRegenerating}
                  className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>New Circuit (New Identity)</span>
                </button>
              )}
            </div>

            {config.enabled ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {config.circuit.map((hop, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-purple-100 bg-purple-50/40 relative space-y-2 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-900 flex items-center gap-1">
                        <span>{hop.flag}</span>
                        <span>{hop.role} Hop</span>
                      </span>
                      <span className="text-[10px] font-mono bg-purple-200/70 text-purple-900 px-1.5 py-0.5 rounded font-bold">
                        +{hop.latencyMs}ms
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-800 truncate">{hop.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{hop.ip}</p>
                      <p className="text-[10px] text-slate-400">{hop.country}</p>
                    </div>

                    <div className="pt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                      <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Layer {idx + 1} AES-256-CTR</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Tor circuit disabled. Toggle above to establish encrypted guard and exit relays.
              </div>
            )}
          </div>

          {/* Network Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Masked Exit IP</span>
              <p className="font-mono font-bold text-slate-900 truncate">{exitIp}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Circuit Latency</span>
              <p className="font-mono font-bold text-slate-900">~{totalLatency} ms</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">DNS Leak Guard</span>
              <p className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Protected</span>
              </p>
            </div>
          </div>

          {/* Pluggable Transport Bridges */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-700" />
              Censorship Circumvention Bridge (Pluggable Transports)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'obfs4', name: 'obfs4', desc: 'Traffic Scrambler' },
                { id: 'snowflake', name: 'Snowflake', desc: 'WebRTC Mesh' },
                { id: 'meek-azure', name: 'meek-azure', desc: 'Domain Front' },
                { id: 'direct', name: 'Direct SOCKS5', desc: 'Standard Onion' },
              ].map((bridge) => (
                <button
                  key={bridge.id}
                  type="button"
                  onClick={() => handleBridgeChange(bridge.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    config.bridgeMode === bridge.id
                      ? 'border-purple-600 bg-purple-50/80 text-purple-950 font-semibold ring-1 ring-purple-500/30'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <p className="text-xs font-bold">{bridge.name}</p>
                  <p className="text-[10px] text-slate-500">{bridge.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Threat Model Callout */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-purple-600" />
              How Tor Onion Routing Protects You
            </div>
            <p>
              Each relay only knows the previous and next node in the chain. No single relay—including the exit node—can link your local ISP identity to your Nostr public broadcasts or P2P voice call recipients.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer"
          >
            Close & Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
