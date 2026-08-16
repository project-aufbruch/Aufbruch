import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, PlusSquare, MoreVertical, X, CheckCircle2, Sparkles, ShieldCheck, Apple, Monitor } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect OS / Device
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setDeviceType('ios');
      } else if (/android/.test(ua)) {
        setDeviceType('android');
      } else {
        setDeviceType('desktop');
      }

      // Check if already in standalone app mode
      if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
        setIsInstalled(true);
      }

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-5 text-slate-900 space-y-5 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Save App to Home Screen</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  PWA Ready
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Install as a standalone native app on iOS, Android, or Desktop
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zero Google Sign-in Callout Notice */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-emerald-950 block">Zero Google Sign-In Required</span>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              AUFBRUCH is completely decentralized and anonymous. You do NOT need a Google Account, email, or password to download or use this app. Any Google popups on Android are standard browser prompts (such as Chrome PWA sync or password autofill) and can be safely dismissed.
            </p>
          </div>
        </div>

        {/* Dynamic 1-Click Install Button if Native Event Triggered */}
        {deferredPrompt && !isInstalled && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="font-bold text-indigo-900 text-xs">Direct 1-Click Installation Ready!</p>
              <p className="text-[11px] text-slate-600">Click below to install instantly to your launcher</p>
            </div>
            <button
              onClick={handleNativeInstall}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition-transform active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Install Now</span>
            </button>
          </div>
        )}

        {isInstalled && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>App is already installed and running in Standalone PWA Mode!</span>
          </div>
        )}

        {/* Tab Selection for OS Instructions */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setDeviceType('ios')}
            className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              deviceType === 'ios' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone / iPad</span>
          </button>

          <button
            onClick={() => setDeviceType('android')}
            className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              deviceType === 'android' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setDeviceType('desktop')}
            className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              deviceType === 'desktop' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-600" />
            <span>Desktop</span>
          </button>
        </div>

        {/* OS Specific Instructions */}
        <div className="space-y-3 font-sans text-xs">
          {deviceType === 'ios' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Apple className="w-4 h-4 text-slate-700" />
                <span>iOS Safari (iPhone / iPad) Steps:</span>
              </h4>
              <ol className="space-y-2 text-[11px] text-slate-700">
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-600 shrink-0">1.</span>
                  <span>Tap the <strong className="text-slate-900 inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline text-indigo-600" /> Share button</strong> at the bottom of Safari.</span>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-600 shrink-0">2.</span>
                  <span>Scroll down and tap <strong className="text-indigo-600 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline text-indigo-600" /> "Add to Home Screen"</strong>.</span>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-600 shrink-0">3.</span>
                  <span>Tap <strong className="text-slate-900">"Add"</strong> in the top right. App icon appears on your home screen!</span>
                </li>
              </ol>
            </div>
          )}

          {deviceType === 'android' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Android Chrome / Samsung Internet Steps:</span>
              </h4>
              <ol className="space-y-2 text-[11px] text-slate-700">
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-600 shrink-0">1.</span>
                  <span>Tap the <strong className="text-slate-900 inline-flex items-center gap-1"><MoreVertical className="w-3.5 h-3.5 inline text-slate-600" /> Menu icon (3 dots)</strong> in Chrome.</span>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-600 shrink-0">2.</span>
                  <span>Tap <strong className="text-indigo-600 font-bold">"Add to Home screen"</strong> or <strong>"Install app"</strong>.</span>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-600 shrink-0">3.</span>
                  <span>Confirm by tapping <strong className="text-slate-900">"Install"</strong>.</span>
                </li>
              </ol>
            </div>
          )}

          {deviceType === 'desktop' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-600" />
                <span>Desktop Chrome / Brave / Edge Steps:</span>
              </h4>
              <ol className="space-y-2 text-[11px] text-slate-700">
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-cyan-600 shrink-0">1.</span>
                  <span>Look at the right side of your browser address bar for the <strong className="text-indigo-600 inline-flex items-center gap-1"><Download className="w-3.5 h-3.5 inline text-indigo-600" /> Install Icon</strong>.</span>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-cyan-600 shrink-0">2.</span>
                  <span>Click <strong className="text-slate-900">"Install AUFBRUCH"</strong> when prompted.</span>
                </li>
              </ol>
            </div>
          )}
        </div>

        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-[11px] text-slate-600 flex items-center gap-2 font-sans">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Works offline after saving. All encryption keys remain stored safely in local device storage.</span>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
