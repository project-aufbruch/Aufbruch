import React, { useState, useRef, useEffect } from 'react';
import { Radio, Mic, Image as ImageIcon, EyeOff, Cpu, X, Upload, Volume2, ShieldCheck, ShieldAlert, Play, Pause, Check, Video, Camera, Sparkles, StopCircle, Send, Globe, Hash, Lock, Clock, UserX, BarChart2, Plus, Trash2, Network } from 'lucide-react';
import { UserIdentity, MediaScrubOptions, PoWProgress } from '../types';
import { inspectExifMetadata, stripExifAndScrubImage, processVoicePitchShift } from '../services/mediaScrubber';
import { realtimeStreamProcessor } from '../services/streamProcessor';
import { publishToIpfsSwarm } from '../services/ipfs';
import { nostrService } from '../services/nostr';
import { runSafetyInspection } from '../services/safetyFilter';
import { trackLocalEvent } from '../services/analytics';
import { recommendationEngine, POPULAR_CHANNELS } from '../services/recommendation';
import { checkDuplicatePollTopic, CIVIC_POLL_TEMPLATES, SimilarPollResult } from '../services/topicDeduplication';

interface CreateBroadcastModalProps {
  identity: UserIdentity | null;
  isOpen: boolean;
  onClose: () => void;
  onBroadcastSuccess: () => void;
}

export const CreateBroadcastModal: React.FC<CreateBroadcastModalProps> = ({
  identity,
  isOpen,
  onClose,
  onBroadcastSuccess,
}) => {
  const [content, setContent] = useState('');
  const [powBits, setPowBits] = useState<number>(16);
  const [isPublishing, setIsPublishing] = useState(false);
  const [powProgress, setPowProgress] = useState<PoWProgress | null>(null);
  const [ipfsProgress, setIpfsProgress] = useState<{ percent: number; peers: number } | null>(null);
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'voice' | 'image' | 'camera' | 'poll'>('text');

  // WHERE TO POST: Channel & Network
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [targetNetwork, setTargetNetwork] = useState<'global_nostr' | 'ipfs_swarm' | 'local_mesh'>('global_nostr');

  // HOW TO POST: Privacy Mode
  const [privacyMode, setPrivacyMode] = useState<'public' | 'self_destruct' | 'encrypted' | 'anonymous'>('public');

  // POLL & DEDUPLICATION STATE
  const [pollOptions, setPollOptions] = useState<string[]>(['Support / Yes 🟢', 'Reject / Oppose 🛑', 'Abstain / Amend ⚖️']);
  const [pollCategory, setPollCategory] = useState<'government_policy' | 'system_motion' | 'community_proposal' | 'general'>('government_policy');
  const [duplicateCheck, setDuplicateCheck] = useState<SimilarPollResult | null>(null);
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState(false);

  useEffect(() => {
    if (activeTab === 'poll' && content.trim().length > 6) {
      const result = checkDuplicatePollTopic(content, nostrService.getFeed());
      setDuplicateCheck(result);
      setIgnoreDuplicateWarning(false);
    } else {
      setDuplicateCheck(null);
    }
  }, [activeTab, content]);

  // Media Scrubbing State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scrubbedDataUrl, setScrubbedDataUrl] = useState<string | null>(null);
  const [exifMetadata, setExifMetadata] = useState<Array<{ label: string; value: string }>>([]);
  const [scrubOptions, setScrubOptions] = useState<MediaScrubOptions>({
    stripExif: true,
    blurFaces: true,
    blurTattoos: false,
    faceBlurIntensity: 18,
    pitchShiftSemitones: -5,
    anonymizeVoice: true,
  });

  // Voice Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Camera State
  const [isStreamingCamera, setIsStreamingCamera] = useState(false);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const rawCameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  const startLiveCamera = async () => {
    try {
      stopLiveCamera();
      const rawStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      rawCameraStreamRef.current = rawStream;

      const processedStream = await realtimeStreamProcessor.startProcessing(rawStream, {
        blurFaces: true,
        blurMode: 'blur',
        blurIntensity: 18,
      });

      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = processedStream;
        await liveVideoRef.current.play().catch(() => {});
      }

      setIsStreamingCamera(true);
    } catch {
      alert('Camera access is required for live photo capture.');
    }
  };

  const stopLiveCamera = () => {
    realtimeStreamProcessor.stopProcessing();
    if (rawCameraStreamRef.current) {
      rawCameraStreamRef.current.getTracks().forEach((t) => t.stop());
      rawCameraStreamRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
    setIsStreamingCamera(false);
  };

  const snapshotLiveFrame = () => {
    if (!liveVideoRef.current) return;
    const video = liveVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setScrubbedDataUrl(dataUrl);
      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'camera_snapshot.jpg', { type: 'image/jpeg' });
          setImageFile(file);
        });
    }
  };

  if (!isOpen) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const inspection = await inspectExifMetadata(file);
    setExifMetadata(inspection.metadataList);

    try {
      const scrubbed = await stripExifAndScrubImage(file, scrubOptions);
      setScrubbedDataUrl(scrubbed.cleanDataUrl);
    } catch (err) {
      console.error('Image scrubbing failed:', err);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);

        const processed = await processVoicePitchShift(audioBlob, scrubOptions.pitchShiftSemitones);
        setProcessedAudioUrl(processed.processedDataUrl);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingVoice(true);
    } catch {
      alert('Microphone access required for voice notes.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`]);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, idx) => idx !== index));
    }
  };

  const handlePollOptionChange = (index: number, text: string) => {
    const updated = [...pollOptions];
    updated[index] = text;
    setPollOptions(updated);
  };

  const handlePublishBroadcast = async () => {
    if (!identity) {
      alert('Account identity required to post. Please create or load your key.');
      return;
    }

    if (!content.trim() && !scrubbedDataUrl && !processedAudioUrl) {
      alert('Please enter a message or attach media.');
      return;
    }

    setSafetyError(null);

    const safetyResult = await runSafetyInspection(content, imageFile);
    if (!safetyResult.isAllowed) {
      setSafetyError(safetyResult.reason || 'Content blocked by safety filter.');
      return;
    }

    setIsPublishing(true);
    let ipfsCid: string | undefined = undefined;
    let mediaType: 'image' | 'audio' | 'none' = 'none';

    if (scrubbedDataUrl) {
      mediaType = 'image';
      const ipfsRes = await publishToIpfsSwarm(scrubbedDataUrl, 'photo.jpg', (percent, peers) => {
        setIpfsProgress({ percent, peers });
      });
      ipfsCid = ipfsRes.cid;
    } else if (processedAudioUrl) {
      mediaType = 'audio';
      const ipfsRes = await publishToIpfsSwarm(processedAudioUrl, 'voice.wav', (percent, peers) => {
        setIpfsProgress({ percent, peers });
      });
      ipfsCid = ipfsRes.cid;
    }

    try {
      // Feed recommendation engine user interest score
      recommendationEngine.trackInteraction(selectedChannel, 5);
      if (content) {
        content.split(' ').forEach((w) => {
          if (w.startsWith('#')) recommendationEngine.trackInteraction(w, 3);
        });
      }

      await nostrService.publishBroadcast(
        content,
        identity.privateKeyHex,
        identity.publicKeyHex,
        identity.petname,
        {
          targetPowBits: powBits,
          ipfsCid,
          mediaType,
          voiceShifted: !!processedAudioUrl,
          facesBlurred: scrubbedDataUrl ? 1 : 0,
          exifStripped: scrubOptions.stripExif,
          channel: selectedChannel,
          postType: activeTab === 'poll' ? 'poll' : mediaType === 'audio' ? 'audio' : mediaType === 'image' ? 'image' : 'text',
          pollOptions: activeTab === 'poll' ? pollOptions.filter((o) => o.trim().length > 0) : undefined,
          pollCategory: activeTab === 'poll' ? pollCategory : undefined,
          privacyMode,
          targetNetwork,
        },
        (progress) => {
          setPowProgress(progress);
        }
      );

      await trackLocalEvent('broadcast_created', { powDifficulty: powBits, ipfsCid, channel: selectedChannel });

      setIsPublishing(false);
      onBroadcastSuccess();
      onClose();
    } catch (err) {
      console.error('Publish error:', err);
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Compose Broadcast</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Decentralized Multi-Channel Post</span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isPublishing}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Safety Error Banner */}
          {safetyError && (
            <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 p-3 rounded-2xl text-xs flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{safetyError}</span>
            </div>
          )}

          {/* 1. WHERE TO POST (Channel & Target Network) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Select Channel / Topic</span>
              </label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
              >
                <option value="general">🌐 #General</option>
                <option value="tech">💻 #Tech & AI</option>
                <option value="crypto">⚡ #Crypto & Web3</option>
                <option value="news">📰 #News & Uncensored</option>
                <option value="art">🎨 #Art & Creative</option>
                <option value="mesh">📡 #Local Mesh P2P</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <Network className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Target Relay Network</span>
              </label>
              <select
                value={targetNetwork}
                onChange={(e) => setTargetNetwork(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
              >
                <option value="global_nostr">Global Nostr Relays</option>
                <option value="ipfs_swarm">IPFS Swarm Storage</option>
                <option value="local_mesh">Local WebRTC Mesh</option>
              </select>
            </div>
          </div>

          {/* 2. WHAT TO POST (Content Input) */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening? Share thoughts, links, or news..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-2xl p-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all resize-none shadow-inner"
            />
          </div>

          {/* Media Attachments & Format Selector */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>Text</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'voice'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Voice Note</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                if (!isStreamingCamera) startLiveCamera();
              }}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Camera</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('poll')}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'poll'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Poll</span>
            </button>
          </div>

          {/* Active Tab Sub-Panels */}
          {activeTab === 'image' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Upload Image</span>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>

              {scrubbedDataUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 bg-slate-900 flex items-center justify-center">
                  <img src={scrubbedDataUrl} alt="Preview" className="max-h-48 object-contain" />
                </div>
              )}
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                {!isRecordingVoice ? (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{recordedAudioBlob ? 'Record Again' : 'Record Voice Note'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl flex items-center gap-2 animate-pulse shadow-sm cursor-pointer"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Stop Recording</span>
                  </button>
                )}

                {processedAudioUrl && (
                  <audio src={processedAudioUrl} controls className="h-8 max-w-[200px]" />
                )}
              </div>
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 max-h-48 flex items-center justify-center">
                <video ref={liveVideoRef} autoPlay playsInline muted className="w-full max-h-48 object-cover" />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={snapshotLiveFrame}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Snapshot</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'poll' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3.5">
              {/* Civic Referendum Quick Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Civic & Policy Referendum Presets</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CIVIC_POLL_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        if (!content.trim()) setContent(tmpl.defaultTitle);
                        setPollOptions(tmpl.options);
                        setPollCategory(tmpl.category as any);
                      }}
                      className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl text-left transition-all hover:shadow-xs cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white block truncate">{tmpl.label}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{tmpl.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DUPLICATE TOPIC DETECTED WARNING */}
              {duplicateCheck?.hasDuplicate && !ignoreDuplicateWarning && (
                <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 p-3.5 rounded-2xl space-y-2 text-xs text-amber-900 dark:text-amber-200 animate-fade-in shadow-xs">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-amber-950 dark:text-amber-100 block">
                        Similar Active Referendum Detected!
                      </span>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                        {duplicateCheck.reason}
                      </p>
                      <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                        "{duplicateCheck.existingPoll?.content}"
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        alert(`Directing to existing vote topic. You can cast your vote on post #${duplicateCheck.existingPoll?.id.substring(0, 8)} in the main feed.`);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-[11px] hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      Vote on Existing Referendum
                    </button>
                    <button
                      type="button"
                      onClick={() => setIgnoreDuplicateWarning(true)}
                      className="px-3 py-1.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-semibold rounded-xl text-[11px] hover:bg-amber-300 dark:hover:bg-amber-800 transition-colors cursor-pointer"
                    >
                      Create Distinct Sub-Topic
                    </button>
                  </div>
                </div>
              )}

              {/* Poll Options Inputs */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Voting Options</span>
                  {pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {pollOptions.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 shadow-2xs"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. HOW TO POST (Privacy Mode Selector) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">How to Post (Privacy & Persistence Mode)</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPrivacyMode('public')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  privacyMode === 'public'
                    ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                🌐 Public
              </button>

              <button
                type="button"
                onClick={() => setPrivacyMode('self_destruct')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  privacyMode === 'self_destruct'
                    ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                ⏳ 24h Auto-Expire
              </button>

              <button
                type="button"
                onClick={() => setPrivacyMode('anonymous')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  privacyMode === 'anonymous'
                    ? 'bg-purple-600 text-white font-bold border-purple-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                👻 Ghost Alias
              </button>

              <button
                type="button"
                onClick={() => setPrivacyMode('encrypted')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  privacyMode === 'encrypted'
                    ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                🔒 Encrypted
              </button>
            </div>
          </div>

          {/* Publishing Status Banner */}
          {isPublishing && (
            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-200 font-medium">
                <span className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                  Publishing broadcast...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePublishBroadcast}
            disabled={isPublishing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isPublishing ? 'Publishing...' : 'Broadcast Post'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


