import React, { useState, useEffect } from 'react';
import { Network, Database, X, Cpu, HardDrive, Wifi, Radio, Bluetooth, RefreshCw, Zap, ShieldCheck, Check, Signal, Sparkles, Layers, ArrowRight, Activity, Users } from 'lucide-react';
import { DEFAULT_IPFS_PEERS } from '../services/ipfs';
import { proximityService, ProximityPeerNode } from '../services/proximity';

interface IpfsSwarmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IpfsSwarmModal: React.FC<IpfsSwarmModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'internet_swarm' | 'proximity_mesh'>('proximity_mesh');
  const [proximityPeers, setProximityPeers] = useState<ProximityPeerNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const unsubscribe = proximityService.subscribe((peers) => {
        setProximityPeers(peers);
      });

      handleStartScan();

      return () => {
        unsubscribe();
      };
    }
  }, [isOpen]);

  const handleStartScan = async () => {
    setIsScanning(true);
    await proximityService.scanForNearbyPeers();
    setTimeout(() => setIsScanning(false), 2000);
  };

  const handleWebBluetoothScan = async () => {
    setStatusMsg(null);
    try {
      const peer = await proximityService.requestBluetoothDevice();
      if (peer) {
        setStatusMsg(`WebBluetooth Paired: ${peer.name}`);
      }
    } catch (err: any) {
      setStatusMsg(`BLE Pairing: ${err.message || 'Device prompt cancelled'}`);
    }
  };

  const handleDirectOfflineSync = async (peerId: string) => {
    await proximityService.syncWithPeer(peerId);
  };

  if (!isOpen) return null;

  const connectedProximityCount = proximityPeers.filter(p => p.status === 'connected').length;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl text-zinc-100 shadow-2xl overflow-hidden my-6 font-mono relative">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-zinc-100">P2P Swarm & Physical Proximity Mesh</h2>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                  mDNS & BLE Off-Grid
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Connect via Internet IPFS gateways or internet-free local mDNS/Bluetooth
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-3 bg-zinc-950 border-b border-zinc-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('proximity_mesh')}
            className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
              activeTab === 'proximity_mesh'
                ? 'bg-cyan-950/90 border-cyan-700 text-cyan-300 font-bold shadow-lg'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bluetooth className="w-4 h-4 text-cyan-400" />
            <span>Off-Grid Physical Mesh (mDNS + BLE)</span>
            {proximityPeers.length > 0 && (
              <span className="bg-cyan-900 text-cyan-200 border border-cyan-700 px-1.5 py-0.2 text-[10px] rounded-full">
                {proximityPeers.length} Nearby
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('internet_swarm')}
            className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
              activeTab === 'internet_swarm'
                ? 'bg-cyan-950/90 border-cyan-700 text-cyan-300 font-bold shadow-lg'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Internet IPFS Swarm ({DEFAULT_IPFS_PEERS.length})</span>
          </button>
        </div>

        {activeTab === 'proximity_mesh' ? (
          <div className="p-5 space-y-5">
            {/* Top Mesh Status & Radar Scanner Header */}
            <div className="p-4 bg-zinc-950 border border-cyan-900/60 rounded-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span className="text-xs font-bold text-cyan-300">
                    {isScanning ? 'Scanning Local mDNS Subnet & BLE Frequency...' : 'Local Proximity Mesh Active'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs rounded-lg flex items-center gap-1.5 font-bold transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>{isScanning ? 'Scanning...' : 'Rescan mDNS/BLE'}</span>
                  </button>

                  {proximityService.isBluetoothSupported() && (
                    <button
                      onClick={handleWebBluetoothScan}
                      className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs rounded-lg flex items-center gap-1.5 font-bold transition-all"
                      title="Pair via Web Bluetooth API"
                    >
                      <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
                      <span>BLE Pair</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Message / Error Banner */}
              {statusMsg && (
                <div className="text-[11px] bg-zinc-900 border border-zinc-800 text-zinc-300 p-2 rounded flex items-center justify-between">
                  <span>{statusMsg}</span>
                  <button onClick={() => setStatusMsg(null)} className="text-zinc-500 hover:text-zinc-300">✕</button>
                </div>
              )}

              {/* Found Peer Indicator Badge / Card */}
              {proximityPeers.length > 0 && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl flex items-center justify-between gap-3 animate-fade-in shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-900 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-emerald-300 text-xs font-bold">Found {proximityPeers.length} Nearby Peer{proximityPeers.length > 1 ? 's' : ''}!</strong>
                        <span className="text-[9px] bg-emerald-900/90 text-emerald-200 border border-emerald-700 px-1.5 py-0.2 rounded font-mono font-bold">
                          mDNS / BLE Online
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-400/90 font-mono">
                        Direct offline P2P sync available without internet relays.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => proximityPeers.forEach(p => handleDirectOfflineSync(p.id))}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
                  >
                    <span>Sync All Offline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Proximity Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2.5 bg-zinc-900 border border-zinc-800/80 rounded-lg">
                  <span className="text-zinc-500 text-[10px] block">DISCOVERED PEERS</span>
                  <strong className="text-cyan-400 text-sm">{proximityPeers.length} Devices</strong>
                </div>

                <div className="p-2.5 bg-zinc-900 border border-zinc-800/80 rounded-lg">
                  <span className="text-zinc-500 text-[10px] block">P2P LINK STATUS</span>
                  <strong className="text-emerald-400 text-sm">{connectedProximityCount} Synced</strong>
                </div>

                <div className="p-2.5 bg-zinc-900 border border-zinc-800/80 rounded-lg">
                  <span className="text-zinc-500 text-[10px] block">INTERNET DEPENDENCY</span>
                  <strong className="text-amber-400 text-sm">0% (Off-Grid)</strong>
                </div>
              </div>
            </div>

            {/* Discovered Proximity Peers List */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                <span>NEARBY PHYSICAL PEERS (mDNS / BLE)</span>
                <span className="text-[11px] text-zinc-500">Zero Central Relay Handshake</span>
              </div>

              {proximityPeers.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
                  No local physical peers detected yet. Click "Rescan mDNS/BLE" to scan nearby devices.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {proximityPeers.map((peer) => (
                    <div
                      key={peer.id}
                      className="p-3 bg-zinc-950 border border-zinc-800 hover:border-cyan-800/80 rounded-xl space-y-2 text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {peer.protocol === 'Bluetooth LE' ? (
                            <Bluetooth className="w-4 h-4 text-blue-400 shrink-0" />
                          ) : (
                            <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
                          )}
                          <span className="text-zinc-200 font-bold">{peer.name}</span>
                          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-mono">
                            {peer.protocol}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono">
                          {peer.signalStrengthDbm && (
                            <span className="text-[11px] text-cyan-400 flex items-center gap-1">
                              <Signal className="w-3 h-3 text-cyan-400" />
                              {peer.signalStrengthDbm} dBm ({peer.distanceMeters}m)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                        <span className="truncate max-w-[280px]">{peer.address}</span>

                        <div className="flex items-center gap-2">
                          {peer.status === 'synced' || peer.status === 'connected' ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                              <Check className="w-3.5 h-3.5" /> Direct Offline Synced
                            </span>
                          ) : peer.status === 'syncing' ? (
                            <span className="text-amber-400 font-bold animate-pulse flex items-center gap-1">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing Chunks...
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDirectOfflineSync(peer.id)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded flex items-center gap-1 transition-transform active:scale-95"
                            >
                              <span>Sync P2P</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Internet IPFS Relay Swarm Tab */
          <div className="p-5 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-zinc-500 text-[10px] block">GLOBAL REPLICATORS</span>
                <span className="text-cyan-400 font-bold text-base">{DEFAULT_IPFS_PEERS.length} Gateway Nodes</span>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-zinc-500 text-[10px] block">TOTAL SWARM CACHE</span>
                <span className="text-emerald-400 font-bold text-base">5.24 GB</span>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="text-zinc-500 text-[10px] block">INFRASTRUCTURE COST</span>
                <span className="text-amber-400 font-bold text-base">$0.00</span>
              </div>
            </div>

            {/* Active Nodes List */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 font-mono">
              {DEFAULT_IPFS_PEERS.map((peer, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300 font-bold truncate max-w-[280px]">{peer.address}</span>
                    <span className="text-emerald-400 font-bold">{peer.pingMs}ms</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="truncate max-w-[240px]">ID: {peer.id}</span>
                    <span>{(peer.downloadSpeedKbps / 1024).toFixed(1)} MB/s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Off-Grid Physical Mesh: mDNS + BLE Signal Discovery</span>
          </span>
          <button onClick={onClose} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
