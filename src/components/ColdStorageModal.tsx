import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Key,
  Download,
  Printer,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  HardDrive,
  QrCode,
  Lock,
  RefreshCw,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { coldStorageService } from '../services/coldStorage';
import { ColdStoragePaperKey, UserIdentity } from '../types';

interface ColdStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: UserIdentity | null;
}

export const ColdStorageModal: React.FC<ColdStorageModalProps> = ({
  isOpen,
  onClose,
  identity,
}) => {
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [backupHint, setBackupHint] = useState('');
  const [paperKey, setPaperKey] = useState<ColdStoragePaperKey | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'seed' | 'paper' | 'microsd'>('seed');

  useEffect(() => {
    if (isOpen && mnemonic.length === 0) {
      generateFreshSeed();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateFreshSeed = () => {
    const words = coldStorageService.generateMnemonic(24);
    setMnemonic(words);
    setPaperKey(null);
  };

  const handleGeneratePaperKey = async () => {
    if (!passphrase.trim() || !identity) return;
    setIsGenerating(true);
    try {
      const key = await coldStorageService.createPaperKey(
        mnemonic,
        identity.publicKeyHex,
        identity.privateKeyHex,
        passphrase,
        backupHint
      );
      setPaperKey(key);
      setActiveView('paper');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportMicroSD = () => {
    if (paperKey) {
      coldStorageService.exportMicroSDVault(paperKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-fade-in print:bg-white print:p-0 print:m-0">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden my-6 relative print:border-none print:shadow-none print:max-w-full">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center font-bold">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Hardware Vault & Cold Storage</h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300">
                  Air-Gapped BIP-39
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-medium">
                24-word cryptographic seed phrase, encrypted paper key, and MicroSD card backup
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

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5 text-xs font-bold print:hidden">
          <button
            onClick={() => setActiveView('seed')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeView === 'seed' ? 'bg-white text-amber-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>1. Seed Phrase</span>
          </button>
          <button
            onClick={() => setActiveView('paper')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeView === 'paper' ? 'bg-white text-amber-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>2. Printable Paper Key</span>
          </button>
          <button
            onClick={() => setActiveView('microsd')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeView === 'microsd' ? 'bg-white text-amber-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>3. MicroSD Vault</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto print:max-h-full print:p-0">
          {activeView === 'seed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">24-Word Mnemonic Master Seed</h3>
                  <p className="text-xs text-slate-600">Write these words down on physical paper in exact sequential order.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRevealed(!revealed)}
                    className="p-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{revealed ? 'Hide' : 'Reveal'}</span>
                  </button>
                  <button
                    onClick={generateFreshSeed}
                    className="p-1.5 text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 rounded-lg hover:bg-amber-50 transition-colors"
                    title="Generate new random seed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* 24 Word Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-100 font-mono text-xs">
                {mnemonic.map((word, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800"
                  >
                    <span className="text-[10px] text-slate-500 font-sans">{idx + 1}.</span>
                    <span className={`font-bold tracking-wide ${revealed ? 'text-amber-300' : 'filter blur-xs select-none'}`}>
                      {revealed ? word : '••••••'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleCopyMnemonic}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Words'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('paper')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Next: Seal Into Paper Key &rarr;
                </button>
              </div>
            </div>
          )}

          {activeView === 'paper' && (
            <div className="space-y-5">
              {!paperKey ? (
                <div className="space-y-4 bg-amber-50/50 border border-amber-200/80 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Encrypt Paper Key with Passphrase</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    The paper backup will be encrypted with PBKDF2 (100,000 rounds) + AES-256-GCM so anyone discovering your physical paper printout cannot extract your keys without your password.
                  </p>

                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Enter strong cold vault passphrase..."
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Optional passphrase hint (e.g. 'My 2nd childhood school locker code')"
                      value={backupHint}
                      onChange={(e) => setBackupHint(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white"
                    />
                    <button
                      onClick={handleGeneratePaperKey}
                      disabled={!passphrase.trim() || isGenerating}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {isGenerating ? 'Encrypting Key...' : 'Generate Encrypted Paper Key'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Printable Certificate Layout */
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 p-6 rounded-3xl bg-slate-50/40 space-y-4 print:border-black print:p-8">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-widest">
                          AUFBRUCH Cold Storage Certificate
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Vault Checksum: {paperKey.checksum} • {new Date(paperKey.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono border border-slate-300 px-2 py-1 rounded-md font-bold bg-white">
                        AES-256-GCM
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Public Identity (npub)</span>
                      <p className="text-[11px] font-mono break-all text-slate-800 bg-white p-2 rounded-xl border border-slate-200">
                        {paperKey.npub}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Encrypted Private Key Ciphertext</span>
                      <p className="text-[10px] font-mono break-all text-slate-700 bg-white p-2 rounded-xl border border-slate-200 max-h-20 overflow-y-auto">
                        {paperKey.encryptedPrivkey}
                      </p>
                    </div>

                    {paperKey.backupHint && (
                      <p className="text-[11px] text-slate-500 italic">
                        <strong>Passphrase Hint:</strong> {paperKey.backupHint}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between print:hidden">
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Cold Storage Sheet</span>
                    </button>
                    <button
                      onClick={() => setActiveView('microsd')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                    >
                      Export to MicroSD &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'microsd' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">MicroSD Hardware Vault File</h4>
                    <p className="text-[11px] text-slate-500">
                      Save a portable JSON backup to copy to offline flash media or hardware wallets.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  Store this MicroSD in an air-gapped waterproof Faraday container. It allows you to restore your full broadcast identity on any other device without cloud dependencies.
                </p>

                <button
                  onClick={handleExportMicroSD}
                  disabled={!paperKey}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{paperKey ? 'Download aufbruch_cold_vault.json' : 'Generate Paper Key First'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
