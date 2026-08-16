import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Copy, Check, Download, Share2, Tag, Smartphone, ShieldCheck, Globe } from 'lucide-react';
import { PET_DECOY_ALIASES } from '../services/urlShortener';

interface ShareQrSectionProps {
  onOpenPwaInstall?: () => void;
}

export const ShareQrSection: React.FC<ShareQrSectionProps> = ({ onOpenPwaInstall }) => {
  const [selectedAlias, setSelectedAlias] = useState<string>('pet-weather');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>('');

  // Compute live app link (defaults to current window.location.origin or custom Vercel / domain URL)
  const defaultOrigin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const activeBaseUrl = customBaseUrl.trim() ? customBaseUrl.trim().replace(/\/$/, '') : defaultOrigin;
  const liveShareUrl = selectedAlias 
    ? `${activeBaseUrl}#v/${selectedAlias}`
    : activeBaseUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(liveShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQr = () => {
    const canvas = document.getElementById('main-share-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `aufbruch-${selectedAlias || 'app'}-qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'AUFBRUCH App',
          text: 'Scan or click link to open AUFBRUCH App:',
          url: liveShareUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 shadow-sm font-sans text-slate-800 my-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>Share AUFBRUCH</span>
            </h2>
            <p className="text-xs text-slate-500">
              Scan QR or share link with friends
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors font-medium"
        >
          {isCollapsed ? 'Show QR Code' : 'Minimize'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: QR Code Canvas Frame */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
              <QRCodeCanvas
                id="main-share-qr-canvas"
                value={liveShareUrl}
                size={160}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="H"
                includeMargin={false}
              />
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Live App Link Sync Enabled</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">QR automatically encodes current deployment URL</span>
            </div>
          </div>

          {/* Right Column: Share Options & Links */}
          <div className="md:col-span-7 space-y-4">
            {/* Alias Selectors */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select Camouflage Alias:</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {PET_DECOY_ALIASES.map((alias) => (
                  <button
                    key={alias}
                    onClick={() => setSelectedAlias(alias)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      selectedAlias === alias
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    #{alias}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Vercel / Domain Link Input */}
            <div className="space-y-1.5 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" /> Custom Domain / Vercel Link:
                </span>
                {customBaseUrl && (
                  <button
                    onClick={() => setCustomBaseUrl('')}
                    className="text-[10px] text-indigo-600 hover:underline"
                  >
                    Reset to Default Origin
                  </button>
                )}
              </div>
              <input
                type="url"
                placeholder="https://your-app.vercel.app (Leave blank for current domain)"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs font-mono"
              />
              <p className="text-[10px] text-slate-500">
                When deployed on Vercel or a custom domain, the QR code automatically encodes your live address. You can also paste your Vercel link above to preview or download a custom QR code.
              </p>
            </div>

            {/* Link Input Box */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-500 font-medium">Generated Shareable Link:</span>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={liveShareUrl}
                  className="bg-transparent flex-1 text-xs text-indigo-700 font-mono focus:outline-none truncate px-1"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 rounded-xl text-xs font-medium flex items-center gap-1 shrink-0 transition-transform active:scale-95 shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> How Friends & Family Connect:
              </div>
              <p className="text-[11px] text-slate-600">
                When your friend opens this link, they can read your public broadcasts, post updates, or click <strong>••• &gt; Call Author</strong> on any of your posts to start an encrypted voice or video call!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleDownloadQr}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Save QR Image</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share App</span>
              </button>

              {onOpenPwaInstall && (
                <button
                  onClick={onOpenPwaInstall}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Install Web App</span>
                </button>
              )}
            </div>

            <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-slate-600 flex items-center gap-2 font-sans">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Offline-capable PWA. Installs directly to home screen on mobile and desktop.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

