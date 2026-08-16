import React, { useState, useEffect } from 'react';
import { Link2, Copy, Check, ExternalLink, Zap, Trash2, ArrowRight, ShieldCheck, Share2, Sparkles, RefreshCw, QrCode, Tag } from 'lucide-react';
import { urlShortenerService, ShortUrlRecord, PET_DECOY_ALIASES } from '../services/urlShortener';
import { NostrEvent } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { QrModal } from './QrModal';

interface UrlShortenerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEvent?: NostrEvent | null;
  initialCid?: string | null;
}

export const UrlShortenerModal: React.FC<UrlShortenerModalProps> = ({
  isOpen,
  onClose,
  initialEvent,
  initialCid
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [inputUrl, setInputUrl] = useState('');
  const [targetType, setTargetType] = useState<'event' | 'cid' | 'custom'>('custom');
  const [targetId, setTargetId] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  
  const [generatedShortUrl, setGeneratedShortUrl] = useState('');
  const [generatedShortCode, setGeneratedShortCode] = useState('');
  const [compressionRatio, setCompressionRatio] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);
  
  const [history, setHistory] = useState<ShortUrlRecord[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHistory(urlShortenerService.getHistory());

      if (initialEvent) {
        setTargetType('event');
        setTargetId(initialEvent.id);
        const fullUrl = `${window.location.origin}${window.location.pathname}?event=${initialEvent.id}`;
        setInputUrl(fullUrl);
        handleGenerate(fullUrl, 'event', initialEvent.id, customAlias);
      } else if (initialCid) {
        setTargetType('cid');
        setTargetId(initialCid);
        const fullUrl = `${window.location.origin}${window.location.pathname}?cid=${initialCid}`;
        setInputUrl(fullUrl);
        handleGenerate(fullUrl, 'cid', initialCid, customAlias);
      } else if (!inputUrl) {
        const fullUrl = window.location.href;
        setInputUrl(fullUrl);
        handleGenerate(fullUrl, 'custom', undefined, customAlias);
      }
    }
  }, [isOpen, initialEvent, initialCid]);

  const handleGenerate = (
    urlToShorten: string,
    type: 'event' | 'cid' | 'custom' = targetType,
    id?: string,
    alias?: string
  ) => {
    if (!urlToShorten.trim()) return;

    const res = urlShortenerService.shortenUrl(urlToShorten, type, id || targetId, alias || customAlias);
    setGeneratedShortUrl(res.shortUrl);
    setGeneratedShortCode(res.shortCode);
    setCompressionRatio(res.compressionRatio);
    setHistory(urlShortenerService.getHistory());
  };

  const handleCopy = () => {
    if (!generatedShortUrl) return;
    navigator.clipboard.writeText(generatedShortUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDeleteHistory = (shortCode: string) => {
    urlShortenerService.deleteRecord(shortCode);
    setHistory(urlShortenerService.getHistory());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden text-zinc-100 font-sans">
        {/* Background Glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-zinc-100">Zero-API URL Shortener</h2>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                  Client-Side Hash
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Generate compact, $0 server cost shareable links for PWA broadcasts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 font-mono transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-5 font-mono text-xs">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 font-bold shadow'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Shorten Link</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 font-bold shadow'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Saved Short Links ({history.length})</span>
          </button>
        </div>

        {activeTab === 'create' ? (
          <div className="space-y-5">
            {/* Target Type Selector */}
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <button
                onClick={() => {
                  setTargetType('custom');
                  const fullUrl = window.location.href;
                  setInputUrl(fullUrl);
                  handleGenerate(fullUrl, 'custom');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  targetType === 'custom'
                    ? 'bg-zinc-800 border-emerald-500/80 text-emerald-300 font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                Custom URL / App
              </button>

              <button
                onClick={() => {
                  if (initialEvent) {
                    setTargetType('event');
                    setTargetId(initialEvent.id);
                    const url = `${window.location.origin}${window.location.pathname}?event=${initialEvent.id}`;
                    setInputUrl(url);
                    handleGenerate(url, 'event', initialEvent.id);
                  } else {
                    setTargetType('event');
                  }
                }}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  targetType === 'event'
                    ? 'bg-zinc-800 border-emerald-500/80 text-emerald-300 font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                Nostr Broadcast
              </button>

              <button
                onClick={() => {
                  if (initialCid) {
                    setTargetType('cid');
                    setTargetId(initialCid);
                    const url = `${window.location.origin}${window.location.pathname}?cid=${initialCid}`;
                    setInputUrl(url);
                    handleGenerate(url, 'cid', initialCid);
                  } else {
                    setTargetType('cid');
                  }
                }}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  targetType === 'cid'
                    ? 'bg-zinc-800 border-emerald-500/80 text-emerald-300 font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50'
                }`}
              >
                IPFS CID Link
              </button>
            </div>

            {/* Input URL Field */}
            <div className="space-y-2 font-mono">
              <label className="text-xs text-zinc-400 flex items-center justify-between">
                <span>Original Target URL:</span>
                <span className="text-[11px] text-zinc-500">{inputUrl.length} characters</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    handleGenerate(e.target.value, targetType, undefined, customAlias);
                  }}
                  placeholder="https://... or PWA link"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
                />

                <button
                  onClick={() => handleGenerate(inputUrl, targetType, undefined, customAlias)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2.5 rounded-xl text-xs shrink-0 transition-transform active:scale-95"
                >
                  Shorten
                </button>
              </div>
            </div>

            {/* Optional Custom Disguise / Vanity Alias (e.g., pet-weather, pet-detective) */}
            <div className="space-y-2 font-mono bg-amber-950/20 border border-amber-900/40 p-3 rounded-xl">
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Custom Camouflage Alias (Optional)</span>
                </span>
                <span className="text-[10px] text-zinc-400">e.g. pet-weather or pet-detective</span>
              </div>

              <input
                type="text"
                value={customAlias}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomAlias(val);
                  handleGenerate(inputUrl, targetType, undefined, val);
                }}
                placeholder="pet-weather, pet-detective, pet-care-news..."
                className="w-full bg-zinc-950 border border-amber-900/60 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-amber-200 placeholder-zinc-600 focus:outline-none"
              />

              {/* Quick Preset Camouflage Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-zinc-500 text-[10px] font-sans mr-1">Quick Presets:</span>
                {PET_DECOY_ALIASES.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setCustomAlias(preset);
                      handleGenerate(inputUrl, targetType, undefined, preset);
                    }}
                    className={`px-2 py-0.5 rounded border transition-all text-[10px] ${
                      customAlias === preset
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                        : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
                    }`}
                  >
                    #{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Display Box */}
            {generatedShortUrl && (
              <div className="bg-zinc-950 border border-emerald-900/60 rounded-xl p-4 space-y-4 shadow-inner relative overflow-hidden font-mono">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Shortened Hash Link:</span>
                  </div>

                  {compressionRatio > 0 && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      ⚡ {compressionRatio}% Shorter
                    </span>
                  )}
                </div>

                {/* Main Generated Link Bar */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between gap-3">
                  <span className="text-xs text-emerald-300 font-bold truncate selection:bg-emerald-500 selection:text-zinc-950">
                    {generatedShortUrl}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors"
                      title="Show QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={handleCopy}
                      className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-transform active:scale-95"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-zinc-950" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <a
                      href={generatedShortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
                      title="Test Short Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Compression Metrics */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1">
                  <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
                    <span className="text-zinc-500 block">Original Size:</span>
                    <strong className="text-zinc-300">{inputUrl.length} bytes</strong>
                  </div>
                  <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
                    <span className="text-zinc-500 block">Shortened Size:</span>
                    <strong className="text-emerald-400">{generatedShortUrl.length} bytes</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* History Tab */
          <div className="space-y-3 font-mono">
            {history.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
                No saved short links yet. Generate one above!
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {history.map((item) => (
                  <div
                    key={item.shortCode}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-emerald-400 font-bold font-mono">
                          #{item.shortCode}
                        </span>
                        <span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.2 rounded border border-zinc-800">
                          {item.targetType}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {item.originalUrl}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#v/${item.shortCode}`);
                        }}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                        title="Copy Short Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteHistory(item.shortCode)}
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>Client-Side Base62 / Hash Compression</span>
          <span className="text-emerald-400">100% Free & Unlimited</span>
        </div>

        <QrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title="Shortened Link QR"
          subtitle="Scan to open PWA link instantly"
          value={generatedShortUrl}
          shortCode={generatedShortCode}
        />
      </div>
    </div>
  );
};
