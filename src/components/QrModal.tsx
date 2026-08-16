import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Copy, Check, Download, Share2, ShieldCheck, X, Link2, Sparkles } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  value: string;
  shortCode?: string;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  title = 'QR Link Share',
  subtitle = 'Scan with camera or PWA reader to open instant link',
  value,
  shortCode
}) => {
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(value);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadQr = () => {
    const canvas = document.getElementById('qr-canvas-element') as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `project-voice-qr-${shortCode || 'link'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'AUFBRUCH Broadcast',
          text: 'Scan or open AUFBRUCH secure link:',
          url: value,
        });
      } catch {
        // Share cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden text-zinc-100">
        {/* Glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-zinc-100">{title}</h3>
              <p className="text-[11px] font-mono text-zinc-400">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 font-mono"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container Box */}
        <div className="bg-zinc-950 border border-emerald-900/60 rounded-xl p-5 flex flex-col items-center justify-center space-y-4 shadow-inner relative">
          <div className="p-3 bg-white rounded-xl shadow-lg border-2 border-emerald-500/40 relative">
            <QRCodeCanvas
              id="qr-canvas-element"
              value={value}
              size={190}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#09090b"
            />
          </div>

          {/* Short code pill if present */}
          {shortCode && (
            <div className="flex items-center gap-1.5 font-mono text-xs bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Code: #{shortCode}</span>
            </div>
          )}

          {/* Raw Value Box */}
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs font-mono">
            <span className="text-zinc-300 truncate selection:bg-emerald-500 selection:text-zinc-950">
              {value}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded shrink-0 transition-colors"
              title="Copy URL"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4 font-mono text-xs">
          <button
            onClick={handleDownloadQr}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save PNG</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-transform active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-zinc-950" />
            <span>Share Link</span>
          </button>
        </div>

        {/* Footer Security Badge */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Offline-Ready Hash</span>
          </span>
          <span>Zero Server Tracking</span>
        </div>
      </div>
    </div>
  );
};
