import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  ShieldAlert,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Trash2,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { acousticModemService } from '../services/acousticModem';
import { UltrasonicPacket, UltrasonicEmergencyType, UserIdentity } from '../types';

interface UltrasonicTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: UserIdentity | null;
}

export const UltrasonicTransferModal: React.FC<UltrasonicTransferModalProps> = ({
  isOpen,
  onClose,
  identity,
}) => {
  const [packets, setPackets] = useState<UltrasonicPacket[]>(acousticModemService.getPackets());
  const [status, setStatus] = useState<{ isTransmitting: boolean; isListening: boolean; lastActivity?: string }>({
    isTransmitting: false,
    isListening: false,
  });
  const [activeTab, setActiveTab] = useState<'transmit' | 'receive' | 'log'>('transmit');
  const [emergencyType, setEmergencyType] = useState<UltrasonicEmergencyType>('SOS');
  const [customMessage, setCustomMessage] = useState('Immediate medical supplies needed at coordinates.');
  const [attachGps, setAttachGps] = useState(true);
  const [isAudible, setIsAudible] = useState(acousticModemService.getAudibleMode());
  const [radarPulse, setRadarPulse] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsubPackets = acousticModemService.subscribe((newPackets) => {
      setPackets(newPackets);
    });

    const unsubStatus = acousticModemService.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubPackets();
      unsubStatus();
    };
  }, []);

  // Visualizer Animation for Radar / Acoustic Wave
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (status.isListening || status.isTransmitting) {
        // Draw acoustic frequency spectrum / ripples
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) - 8;

        ctx.strokeStyle = status.isTransmitting ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 2;

        const time = Date.now() / 300;
        for (let r = 10; r < maxRadius; r += 20) {
          const wave = (r + (time * 15) % 20) % maxRadius;
          ctx.beginPath();
          ctx.arc(centerX, centerY, wave, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw frequency bars
        const numBars = 32;
        const barWidth = canvas.width / numBars;
        for (let i = 0; i < numBars; i++) {
          const h = Math.abs(Math.sin(time + i * 0.4)) * 30 + 5;
          ctx.fillStyle = status.isTransmitting ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)';
          ctx.fillRect(i * barWidth, canvas.height - h, barWidth - 2, h);
        }
      } else {
        // Idle standby line
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [status.isListening, status.isTransmitting]);

  if (!isOpen) return null;

  const handleTransmit = async () => {
    if (!identity) return;
    let coords: { latitude: number; longitude: number } | undefined = undefined;

    if (attachGps && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        coords = await new Promise((res) => {
          navigator.geolocation.getCurrentPosition(
            (p) => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
            () => res({ latitude: 37.7749, longitude: -122.4194 }),
            { timeout: 3000 }
          );
        });
      } catch {}
    }

    await acousticModemService.transmitAlert(
      emergencyType,
      identity.petname || 'Anonymous Rebel',
      identity.publicKeyHex,
      customMessage,
      coords
    );
  };

  const handleToggleListening = async () => {
    if (status.isListening) {
      acousticModemService.stopListening();
    } else {
      await acousticModemService.startListening();
    }
  };

  const handleAudibleToggle = () => {
    const next = !isAudible;
    setIsAudible(next);
    acousticModemService.setAudibleMode(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden my-6 relative">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-bold">
              <Radio className="w-6 h-6 text-blue-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Off-Grid Ultrasonic Acoustic Mesh</h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  status.isTransmitting
                    ? 'bg-red-500/30 border-red-400 text-red-200 animate-pulse'
                    : status.isListening
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400'
                }`}>
                  {status.isTransmitting ? 'Chirping' : status.isListening ? 'Listening' : 'Standby'}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 font-medium">
                Air-gapped device-to-device transfers via speaker & microphone chirps (18-19 kHz near-ultrasound)
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

        {/* Real-Time Acoustic Canvas Visualizer */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 relative">
          <canvas ref={canvasRef} width={560} height={70} className="w-full h-16 rounded-xl bg-slate-900/80" />
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              {status.lastActivity || (status.isListening ? 'Acoustic carrier locked at 18.2 kHz' : 'Engine ready.')}
            </span>
            <button
              onClick={handleAudibleToggle}
              className="text-[10px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-700 transition-colors"
            >
              {isAudible ? <Volume2 className="w-3 h-3 text-amber-400" /> : <VolumeX className="w-3 h-3 text-slate-400" />}
              <span>{isAudible ? 'Audible Demo Tone (1.2-2.2kHz)' : 'Near-Ultrasound (18-19kHz)'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('transmit')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'transmit' ? 'bg-white text-blue-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmit Chirp</span>
          </button>
          <button
            onClick={() => setActiveTab('receive')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'receive' ? 'bg-white text-blue-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Listen Radar {status.isListening && '●'}</span>
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'log' ? 'bg-white text-blue-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Intercept Log ({packets.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {activeTab === 'transmit' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Emergency Alert Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'SOS', label: '🚨 SOS Critical', color: 'border-red-300 text-red-700 bg-red-50' },
                    { type: 'MEDICAL', label: '🏥 Medical Aid', color: 'border-blue-300 text-blue-700 bg-blue-50' },
                    { type: 'EVAC_CORRIDOR', label: '🏃 Evacuation', color: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
                    { type: 'WATER_POINT', label: '💧 Water Point', color: 'border-cyan-300 text-cyan-700 bg-cyan-50' },
                    { type: 'HAZARD', label: '⚠️ Hazard Area', color: 'border-amber-300 text-amber-700 bg-amber-50' },
                    { type: 'TEXT_MSG', label: '💬 Text Chirp', color: 'border-purple-300 text-purple-700 bg-purple-50' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setEmergencyType(item.type as UltrasonicEmergencyType)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                        emergencyType === item.type
                          ? `${item.color} ring-2 ring-blue-500/30`
                          : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Acoustic Message Payload (Max 120 chars)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value.slice(0, 120))}
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter short tactical message..."
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachGps}
                      onChange={(e) => setAttachGps(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Attach Device GPS Coordinates</span>
                  </label>
                  <span>{customMessage.length}/120</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTransmit}
                disabled={status.isTransmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>{status.isTransmitting ? 'Transmitting Audio Chirp...' : 'Transmit Ultrasonic Chirp (Play Audio)'}</span>
              </button>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] text-slate-500 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Requires no Wi-Fi, Bluetooth, or SIM card. Devices within 5-15 meters listening via microphone will decode your broadcast immediately.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'receive' && (
            <div className="space-y-4 text-center py-3">
              <div className={`w-20 h-20 mx-auto rounded-full border-2 flex items-center justify-center transition-all ${
                status.isListening ? 'border-emerald-500 bg-emerald-50 text-emerald-600 animate-pulse' : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}>
                {status.isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  {status.isListening ? 'Acoustic Radar Active & Listening' : 'Acoustic Receiver Suspended'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {status.isListening
                    ? 'Place this device near another transmitting phone to receive encrypted SOS signals.'
                    : 'Turn on listening mode to capture nearby ultrasonic emergency transmissions.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleListening}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  status.isListening ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {status.isListening ? 'Stop Listening' : 'Start Listening Radar'}
              </button>
            </div>
          )}

          {activeTab === 'log' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Received Acoustic Frames</span>
                {packets.length > 0 && (
                  <button
                    onClick={() => acousticModemService.clearPackets()}
                    className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Log</span>
                  </button>
                )}
              </div>

              {packets.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                  No acoustic packets recorded yet. Transmit a chirp or start listening.
                </div>
              ) : (
                <div className="space-y-2">
                  {packets.map((pkt) => (
                    <div
                      key={pkt.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 flex items-center gap-1.5">
                          <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {pkt.type}
                          </span>
                          <span>{pkt.senderPetname}</span>
                          <span className="font-mono text-[10px] text-slate-400">({pkt.senderPubkeyPrefix})</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(pkt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">{pkt.message}</p>
                      {pkt.latitude && pkt.longitude && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span>Lat: {pkt.latitude.toFixed(4)}, Lon: {pkt.longitude.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
