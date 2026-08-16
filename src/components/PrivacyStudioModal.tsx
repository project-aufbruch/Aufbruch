import React, { useState, useRef, useCallback } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Upload,
  Download,
  Mic,
  StopCircle,
  Volume2,
  Image as ImageIcon,
  FileText,
  Sliders,
  Sparkles,
  CheckCircle,
  Trash2,
  X,
  Play,
  RotateCcw
} from 'lucide-react';
import {
  stripExifAndScrubImage,
  inspectExifMetadata,
  processVoicePitchShift
} from '../services/mediaScrubber';
import { MediaScrubOptions } from '../types';

interface PrivacyStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostScrubbedMedia?: (mediaUrl: string, type: 'image' | 'audio') => void;
}

export default function PrivacyStudioModal({
  isOpen,
  onClose,
  onPostScrubbedMedia,
}: PrivacyStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'voice' | 'document'>('image');

  // Image / Face Scrubbing State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [scrubbedImageUrl, setScrubbedImageUrl] = useState<string | null>(null);
  const [exifData, setExifData] = useState<Array<{ label: string; value: string }>>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageOptions, setImageOptions] = useState<MediaScrubOptions>({
    stripExif: true,
    blurFaces: true,
    pitchShiftAudio: false,
    pitchSemitones: 0,
    anonymizeFileName: true,
  });
  const [redactionType, setRedactionType] = useState<'blur' | 'pixelate' | 'blackbar'>('blur');

  // Voice Note State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [scrubbedAudioUrl, setScrubbedAudioUrl] = useState<string | null>(null);
  const [voicePitchShift, setVoicePitchShift] = useState<number>(-4); // Deep pitch default
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Document Redaction State
  const [docText, setDocText] = useState<string>('');
  const [redactedDocText, setRedactedDocText] = useState<string>('');
  const [docFilename, setDocFilename] = useState<string>('document.txt');
  const [redactOptions, setRedactOptions] = useState({
    names: true,
    phones: true,
    emails: true,
    addresses: true,
    creditCards: true,
    localPaths: true,
  });

  // Handle Image Upload & EXIF Inspection
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const rawUrl = URL.createObjectURL(file);
    setOriginalImageUrl(rawUrl);

    // Inspect EXIF
    const { metadataList } = await inspectExifMetadata(file);
    setExifData(metadataList);

    // Auto-process
    processImageScrubbing(file, imageOptions, redactionType);
  };

  const processImageScrubbing = async (
    file: File,
    options: MediaScrubOptions,
    type: 'blur' | 'pixelate' | 'blackbar'
  ) => {
    setIsProcessingImage(true);
    try {
      const customBoxes = [
        {
          x: 0.3,
          y: 0.2,
          width: 0.4,
          height: 0.35,
          type: type,
        },
      ];
      const result = await stripExifAndScrubImage(file, options, customBoxes);
      setScrubbedImageUrl(result.cleanDataUrl);
    } catch (err) {
      console.error('Image scrubbing error:', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Voice Note Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());

        // Process pitch shift
        processAudioPitch(audioBlob, voicePitchShift);
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Could not access microphone for voice recording.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
    }
  };

  const processAudioPitch = async (blob: Blob, semitones: number) => {
    setIsProcessingVoice(true);
    try {
      const shifted = await processVoicePitchShift(blob, semitones);
      setScrubbedAudioUrl(shifted.processedDataUrl);
    } catch (err) {
      console.error('Pitch shift error:', err);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Document Redactor
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setDocText(content);
      applyDocRedaction(content, redactOptions);
    };
    reader.readAsText(file);
  };

  const applyDocRedaction = (
    rawText: string,
    opts: typeof redactOptions
  ) => {
    let result = rawText;

    if (opts.emails) {
      result = result.replace(/[\w.-]+@[\w.-]+\.\w+/g, '██████ [EMAIL REDACTED]');
    }
    if (opts.phones) {
      result = result.replace(/\+?[\d\s\-()]{10,}/g, '██████ [PHONE REDACTED]');
    }
    if (opts.creditCards) {
      result = result.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '██████ [CARD REDACTED]');
    }
    if (opts.localPaths) {
      result = result.replace(/(C:\\[^\s]+|\/Users\/[^\s]+|\/home\/[^\s]+)/gi, '[SYSTEM_PATH_STRIPPED]');
    }
    if (opts.addresses) {
      result = result.replace(
        /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Square|Sq)/gi,
        '██████ [ADDRESS REDACTED]'
      );
    }
    if (opts.names) {
      // Matches typical capitalized names at boundary
      result = result.replace(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g, '██████ [NAME REDACTED]');
    }

    setRedactedDocText(result);
  };

  const downloadRedactedDoc = () => {
    const blob = new Blob([redactedDocText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aufbruch_sanitized_${docFilename}`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-900 dark:text-white">Privacy Studio</h2>
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                  On-Device DSP
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Face Blur, Audio Pitch Shift, EXIF Scrubber & Document Sanitizer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 bg-slate-50/80 dark:bg-slate-950/40 gap-2">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-colors cursor-pointer ${
              activeTab === 'image'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Face Blur & EXIF Stripper</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-colors cursor-pointer ${
              activeTab === 'voice'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice Anonymizer (Pitch Shift)</span>
          </button>

          <button
            onClick={() => setActiveTab('document')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-colors cursor-pointer ${
              activeTab === 'document'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Redactor</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* TAB 1: IMAGE / FACE SCRUBBER */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Section */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      1. Select Image
                    </span>
                    <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {originalImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex items-center justify-center max-h-56">
                      <img
                        src={originalImageUrl}
                        alt="Original"
                        className="max-h-56 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-48 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-xs">Upload any photo to automatically strip GPS, camera metadata, and blur biometric features.</p>
                    </div>
                  )}

                  {/* Metadata Detection Box */}
                  {exifData.length > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold text-[11px]">
                        <EyeOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Detected Dangerous Metadata (Stripped by AUFBRUCH):</span>
                      </div>
                      <ul className="text-[11px] text-rose-700 dark:text-rose-400 space-y-0.5 font-mono">
                        {exifData.map((item, idx) => (
                          <li key={idx} className="truncate">
                            • {item.label}: <span className="opacity-80">{item.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Processed / Preview Section */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      2. Anonymized Output
                    </span>
                    {scrubbedImageUrl && (
                      <a
                        href={scrubbedImageUrl}
                        download={`aufbruch_sanitized_${Date.now()}.png`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save PNG</span>
                      </a>
                    )}
                  </div>

                  {scrubbedImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 bg-slate-950 flex items-center justify-center max-h-56">
                      <img
                        src={scrubbedImageUrl}
                        alt="Anonymized"
                        className="max-h-56 object-contain"
                      />
                      <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        EXIF Stripped
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 p-4 text-center">
                      <p className="text-xs">Processed preview will appear here</p>
                    </div>
                  )}

                  {/* Redaction Controls */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Face Redaction Mode:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRedactionType('blur');
                          if (imageFile) processImageScrubbing(imageFile, imageOptions, 'blur');
                        }}
                        className={`p-2 rounded-xl border text-center font-medium transition-colors cursor-pointer ${
                          redactionType === 'blur'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Gaussian Blur
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRedactionType('pixelate');
                          if (imageFile) processImageScrubbing(imageFile, imageOptions, 'pixelate');
                        }}
                        className={`p-2 rounded-xl border text-center font-medium transition-colors cursor-pointer ${
                          redactionType === 'pixelate'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Pixelate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRedactionType('blackbar');
                          if (imageFile) processImageScrubbing(imageFile, imageOptions, 'blackbar');
                        }}
                        className={`p-2 rounded-xl border text-center font-medium transition-colors cursor-pointer ${
                          redactionType === 'blackbar'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Black Bar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VOICE ANONYMIZER (PITCH SHIFTER) */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Acoustic Voice Masking
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Alters voice frequencies in-browser to defeat automated biometric voice recognition.
                    </p>
                  </div>

                  {!isRecordingVoice ? (
                    <button
                      onClick={startVoiceRecording}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span>{recordedAudioBlob ? 'Record New Voice' : 'Start Recording'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopVoiceRecording}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse shadow-xs cursor-pointer"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>Stop Recording</span>
                    </button>
                  )}
                </div>

                {/* Pitch Slider */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Pitch Frequency Shift: <strong className="text-indigo-600 dark:text-indigo-400">{voicePitchShift} Semitones</strong>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {voicePitchShift < 0 ? 'Deep Whistleblower Mask' : voicePitchShift > 0 ? 'High Pitch Mask' : 'Natural Voice'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="1"
                    value={voicePitchShift}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setVoicePitchShift(val);
                      if (recordedAudioBlob) {
                        processAudioPitch(recordedAudioBlob, val);
                      }
                    }}
                    className="w-full cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>-8 (Ultra Deep)</span>
                    <span>0 (Normal)</span>
                    <span>+8 (High Chipmunk)</span>
                  </div>
                </div>

                {/* Audio Players */}
                {scrubbedAudioUrl && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Anonymized Audio Ready</span>
                      </div>
                      <a
                        href={scrubbedAudioUrl}
                        download={`aufbruch_voice_${Date.now()}.wav`}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Audio</span>
                      </a>
                    </div>
                    <audio controls src={scrubbedAudioUrl} className="w-full h-10" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENT REDACTOR */}
          {activeTab === 'document' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Select Evidence Document (.txt, .md, .csv)
                </span>
                <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Text Document</span>
                  <input
                    type="file"
                    accept=".txt,.md,.json,.csv"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Redaction Checkboxes */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Automated Redaction Filters:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries({
                    names: 'People Names',
                    phones: 'Phone Numbers',
                    emails: 'Email Addresses',
                    addresses: 'Physical Addresses',
                    creditCards: 'Card / Account IDs',
                    localPaths: 'Local OS Paths',
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={redactOptions[key as keyof typeof redactOptions]}
                        onChange={(e) => {
                          const updated = {
                            ...redactOptions,
                            [key]: e.target.checked,
                          };
                          setRedactOptions(updated);
                          if (docText) applyDocRedaction(docText, updated);
                        }}
                        className="rounded text-indigo-600 accent-indigo-600"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Document Comparison */}
              {redactedDocText && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Redacted Preview ({docFilename}):
                    </span>
                    <button
                      onClick={downloadRedactedDoc}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Sanitized File</span>
                    </button>
                  </div>
                  <textarea
                    value={redactedDocText}
                    readOnly
                    rows={8}
                    className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-3.5 rounded-2xl border border-slate-800 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs">
          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>All signal processing executes 100% on-device inside Web Workers.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
