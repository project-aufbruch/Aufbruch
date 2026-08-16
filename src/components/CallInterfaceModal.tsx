import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff, ShieldCheck, Copy, Check, Lock, Radio, User, Volume2, Sparkles, X, RefreshCw } from 'lucide-react';
import { UserIdentity } from '../types';
import { webRtcService, CallStatus, CallSignalMessage } from '../services/webrtc';

interface CallInterfaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: UserIdentity | null;
  initialTargetPubkey?: string;
}

export const CallInterfaceModal: React.FC<CallInterfaceModalProps> = ({ isOpen, onClose, identity, initialTargetPubkey = '' }) => {
  const [targetPubkeyHex, setTargetPubkeyHex] = useState(initialTargetPubkey);
  const [callStatus, setCallStatus] = useState<CallStatus>(webRtcService.getCallStatus());

  useEffect(() => {
    if (initialTargetPubkey) {
      setTargetPubkeyHex(initialTargetPubkey);
    }
  }, [initialTargetPubkey]);
  const [activeCallSignal, setActiveCallSignal] = useState<CallSignalMessage | null>(webRtcService.getActiveCallSignal());
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [callDurationSec, setCallDurationSec] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    webRtcService.setIdentity(identity);
  }, [identity]);

  useEffect(() => {
    if (isOpen) {
      const unsubStatus = webRtcService.subscribeStatus((status, signal) => {
        setCallStatus(status);
        setActiveCallSignal(signal);
      });

      const unsubLocalStream = webRtcService.subscribeLocalStream((stream) => {
        if (localVideoRef.current && stream) {
          localVideoRef.current.srcObject = stream;
        }
      });

      const unsubRemoteStream = webRtcService.subscribeRemoteStream((stream) => {
        if (remoteVideoRef.current && stream) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      return () => {
        unsubStatus();
        unsubLocalStream();
        unsubRemoteStream();
      };
    }
  }, [isOpen]);

  // Call timer effect
  useEffect(() => {
    let timer: any = null;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDurationSec(prev => prev + 1);
      }, 1000);
    } else {
      setCallDurationSec(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  const handleCopyMyPubkey = () => {
    if (identity) {
      navigator.clipboard.writeText(identity.publicKeyHex);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleStartCall = async (isVideo: boolean) => {
    if (!targetPubkeyHex.trim() || !identity) return;
    await webRtcService.startCall(targetPubkeyHex.trim(), isVideo, identity);
  };

  const handleAcceptCall = async (isVideo: boolean) => {
    if (!identity) return;
    await webRtcService.acceptCall(isVideo, identity);
  };

  const handleRejectCall = () => {
    if (!identity) return;
    webRtcService.rejectCall(identity);
  };

  const handleEndCall = () => {
    webRtcService.endCall();
  };

  const handleToggleMute = () => {
    const muted = webRtcService.toggleMuteAudio();
    setIsAudioMuted(muted);
  };

  const handleToggleVideo = () => {
    const disabled = webRtcService.toggleDisableVideo();
    setIsVideoDisabled(disabled);
  };

  if (!isOpen) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl text-zinc-100 shadow-2xl overflow-hidden my-6 font-mono relative">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold">
              <Phone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-zinc-100">Decentralized P2P E2EE Call</h2>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                  DTLS-SRTP E2EE
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Direct WebRTC audio & video stream over Nostr relay signals
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content based on Call State */}
        <div className="p-5 space-y-5">
          {/* STATE 1: IDLE / DIALER */}
          {callStatus === 'idle' && (
            <div className="space-y-5">
              {/* Step-by-Step Connection Guide */}
              <div className="bg-emerald-950/40 border border-emerald-800/60 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>How 2 Users Connect (User X & User Y):</span>
                </div>
                <ol className="text-[11px] text-zinc-300 space-y-1.5 font-mono list-decimal pl-4">
                  <li>
                    <strong className="text-emerald-300">Share App:</strong> User X shares the app link or QR code with User Y.
                  </li>
                  <li>
                    <strong className="text-emerald-300">Method 1 (One-Click Call):</strong> Click <span className="bg-zinc-800 text-zinc-200 px-1 py-0.5 rounded">•••</span> on any post written by User Y and select <strong className="text-emerald-400">Call Author</strong>.
                  </li>
                  <li>
                    <strong className="text-emerald-300">Method 2 (Key Swap):</strong> User Y copies their <strong className="text-emerald-400">Public Call Identity (Hex)</strong> above and sends it to User X. User X pastes it into <strong className="text-emerald-400">Recipient Identity</strong> below and clicks Start Call.
                  </li>
                </ol>
              </div>

              {/* My Public Key Hex Card */}
              <div className="p-4 bg-zinc-950 border border-zinc-800/90 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    YOUR PUBLIC CALL IDENTITY (HEX)
                  </span>
                  <button
                    onClick={handleCopyMyPubkey}
                    className="text-xs bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{copiedKey ? 'Copied' : 'Copy My Key'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-emerald-400 font-mono break-all select-all">
                  {identity ? identity.publicKeyHex : 'Generating Vault Key...'}
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Share this public hex with peers so they can call your app directly without a middleman server.
                </p>
              </div>

              {/* Recipient Dialer Form */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-300 block">
                  RECIPIENT PUBLIC IDENTITY (HEX KEY)
                </label>
                <input
                  type="text"
                  value={targetPubkeyHex}
                  onChange={(e) => setTargetPubkeyHex(e.target.value)}
                  placeholder="Paste peer's 64-character public key hex here..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/80 rounded-xl p-3 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
                />

                {/* Quick Test Contacts */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-zinc-500 block">Or pick a network test node:</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => setTargetPubkeyHex('3bf0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427a')}
                      className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded font-mono text-[11px] transition-colors"
                    >
                      FreePress_Asia (3bf037...)
                    </button>
                    <button
                      onClick={() => setTargetPubkeyHex('fa50372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427b')}
                      className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded font-mono text-[11px] transition-colors"
                    >
                      CitizenJournalist_PK (fa5037...)
                    </button>
                  </div>
                </div>

                {/* Dial Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    onClick={() => handleStartCall(false)}
                    disabled={!targetPubkeyHex.trim()}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 text-xs shadow-lg"
                  >
                    <Phone className="w-4 h-4" />
                    <span>START AUDIO CALL</span>
                  </button>

                  <button
                    onClick={() => handleStartCall(true)}
                    disabled={!targetPubkeyHex.trim()}
                    className="py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-zinc-100 font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 text-xs shadow-lg"
                  >
                    <Video className="w-4 h-4" />
                    <span>START VIDEO CALL</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: OUTBOUND CALLING / RINGING */}
          {callStatus === 'calling' && (
            <div className="p-8 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                  <Phone className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-100">Signaling Outbound Call...</h3>
                <p className="text-xs text-emerald-400 font-mono mt-1">
                  Broadcasting encrypted SDP offer to target peer over Nostr relays
                </p>
                <p className="text-[11px] text-zinc-500 font-mono mt-2 truncate">
                  Target: {activeCallSignal?.targetPubkey}
                </p>
              </div>

              <button
                onClick={handleEndCall}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-zinc-100 font-bold rounded-xl text-xs flex items-center gap-2 mx-auto transition-transform active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>CANCEL CALL</span>
              </button>
            </div>
          )}

          {/* STATE 3: INCOMING CALL PROMPT */}
          {callStatus === 'incoming' && (
            <div className="p-6 bg-zinc-950 border border-emerald-800/80 rounded-2xl text-center space-y-6 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center mx-auto shadow-xl">
                <Phone className="w-8 h-8 animate-bounce" />
              </div>

              <div>
                <span className="text-[10px] bg-emerald-900 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono font-bold">
                  INCOMING DECENTRALIZED CALL
                </span>
                <h3 className="text-lg font-bold text-zinc-100 mt-2">
                  {activeCallSignal?.senderPetname || 'Unknown Peer'}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-1 break-all">
                  {activeCallSignal?.senderPubkey}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => handleAcceptCall(false)}
                  className="py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>Audio</span>
                </button>

                <button
                  onClick={() => handleAcceptCall(true)}
                  className="py-3 bg-blue-600 hover:bg-blue-500 text-zinc-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  <span>Video</span>
                </button>

                <button
                  onClick={handleRejectCall}
                  className="py-3 bg-rose-600 hover:bg-rose-500 text-zinc-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: CONNECTED ACTIVE CALL VIEW */}
          {callStatus === 'connected' && (
            <div className="space-y-4">
              {/* Call Status & Timer Bar */}
              <div className="p-3 bg-zinc-950 border border-emerald-800/80 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-300 font-bold">E2EE CALL ACTIVE</span>
                  <span className="text-zinc-500">|</span>
                  <span className="text-zinc-300">{formatTimer(callDurationSec)}</span>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DTLS-SRTP E2EE</span>
                </div>
              </div>

              {/* Media Views Canvas */}
              <div className="relative w-full h-64 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center">
                {/* Remote Video Stream */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Visualizer overlay if remote video stream has no video track */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/60 to-transparent flex flex-col items-center justify-center pointer-events-none p-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 mb-2 shadow-xl">
                    <Volume2 className="w-8 h-8 animate-pulse" />
                  </div>
                  <strong className="text-sm font-bold text-zinc-100">
                    {activeCallSignal?.senderPetname || 'Connected Peer'}
                  </strong>
                  <span className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Direct Decentralized Peer-to-Peer Stream
                  </span>
                </div>

                {/* Local Video Thumbnail Preview */}
                <div className="absolute bottom-3 right-3 w-28 h-20 bg-zinc-900 border border-emerald-800/80 rounded-xl overflow-hidden shadow-2xl z-10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  <span className="absolute bottom-1 left-1 text-[9px] bg-zinc-950/80 px-1 rounded text-zinc-300">
                    You
                  </span>
                </div>
              </div>

              {/* In-Call Controls Bar */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={handleToggleMute}
                  className={`p-3.5 rounded-full border transition-all ${
                    isAudioMuted
                      ? 'bg-rose-950 border-rose-800 text-rose-300'
                      : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                  }`}
                  title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isAudioMuted ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleToggleVideo}
                  className={`p-3.5 rounded-full border transition-all ${
                    isVideoDisabled
                      ? 'bg-rose-950 border-rose-800 text-rose-300'
                      : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                  }`}
                  title={isVideoDisabled ? 'Enable Camera' : 'Disable Camera'}
                >
                  {isVideoDisabled ? <VideoOff className="w-5 h-5 text-rose-400" /> : <Video className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="p-3.5 bg-rose-600 hover:bg-rose-500 text-zinc-100 rounded-full shadow-lg transition-transform active:scale-95"
                  title="Hang Up Call"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 5: ENDED */}
          {callStatus === 'ended' && (
            <div className="p-8 text-center space-y-3 font-mono">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                <PhoneOff className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-200">Call Ended</h3>
              <p className="text-xs text-zinc-500">Peer connection terminated & session keys purged.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero-Server WebRTC DTLS-SRTP Stream</span>
          </span>
          <button onClick={onClose} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
