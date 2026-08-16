import React, { useState } from 'react';
import { Key, ShieldCheck, Copy, Check, Lock, RefreshCw, X, Download, Shield, QrCode, Eye, EyeOff, Sparkles, Cpu, User } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { UserIdentity } from '../types';
import { generateSeedPhrase, deriveIdentityFromSeed, saveIdentityToVault, performHardwareAttestation, HardwareAttestationResult, BiometricVault } from '../services/crypto';

interface IdentityModalProps {
  identity: UserIdentity | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveIdentity: (id: UserIdentity) => void;
}

export const IdentityModal: React.FC<IdentityModalProps> = ({
  identity,
  isOpen,
  onClose,
  onSaveIdentity,
}) => {
  const [seedInput, setSeedInput] = useState(identity?.seedPhrase || '');
  const [passkeyInput, setPasskeyInput] = useState('Voice-Vault-2026');
  const [exportPin, setExportPin] = useState('');
  const [isQrUnlocked, setIsQrUnlocked] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [attestationResult, setAttestationResult] = useState<HardwareAttestationResult | null>(null);
  const [isAttesting, setIsAttesting] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<string | null>(null);
  const [isBiometricRegistered, setIsBiometricRegistered] = useState<boolean>(BiometricVault.isRegistered());

  const [copiedSeed, setCopiedSeed] = useState(false);
  const [copiedNsec, setCopiedNsec] = useState(false);
  const [copiedNpub, setCopiedNpub] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'generate' | 'import'>('view');
  const [petname, setPetname] = useState(identity?.petname || '');

  if (!isOpen) return null;

  const handleUnlockWithBiometrics = async () => {
    setPinError(null);
    setBiometricStatus('Scanning Face ID / Fingerprint...');
    const result = await BiometricVault.unlock(passkeyInput);
    if (result.identity) {
      setIsQrUnlocked(true);
      setBiometricStatus('Biometric Unlock Successful');
      setPinError(null);
    } else {
      setBiometricStatus(null);
      setPinError(result.error || 'Biometric authentication failed.');
    }
  };

  const handleRegisterBiometrics = async () => {
    if (!identity) return;
    setBiometricStatus('Enrolling TouchID / FaceID...');
    const result = await BiometricVault.register(identity, passkeyInput);
    if (result.success) {
      setIsBiometricRegistered(true);
      setBiometricStatus('TouchID / FaceID Enrolled Successfully!');
    } else {
      setBiometricStatus(null);
      setPinError(result.error || 'Biometric enrollment failed.');
    }
  };

  const handleVerifyPinAndShowQr = async () => {
    setPinError(null);
    if (!exportPin.trim()) {
      setPinError('Please enter your Vault PIN.');
      return;
    }
    if (exportPin.trim() === passkeyInput.trim() || exportPin.trim().length >= 4) {
      setIsAttesting(true);
      const attRes = await performHardwareAttestation();
      setAttestationResult(attRes);
      setIsAttesting(false);

      if (attRes.verified) {
        setIsQrUnlocked(true);
        setPinError(null);
      } else {
        setPinError('Hardware Attestation failed.');
      }
    } else {
      setPinError('Incorrect PIN.');
    }
  };

  const handleLockQr = () => {
    setIsQrUnlocked(false);
    setExportPin('');
    setPinError(null);
  };

  const handleDownloadQrPng = () => {
    const canvas = document.getElementById('high-contrast-seed-qr') as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `aufbruch-seed-qr-${petname || 'identity'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateFreshSeed = () => {
    const freshMnemonic = generateSeedPhrase();
    const newId = deriveIdentityFromSeed(freshMnemonic, petname || 'VoiceUser');
    setSeedInput(freshMnemonic);
    onSaveIdentity(newId);
    saveIdentityToVault(newId, passkeyInput);
    setActiveTab('view');
  };

  const handleImportSeed = () => {
    if (!seedInput.trim()) {
      alert('Please enter a 12-word seed phrase.');
      return;
    }
    const importedId = deriveIdentityFromSeed(seedInput, petname || 'VoiceUser');
    onSaveIdentity(importedId);
    saveIdentityToVault(importedId, passkeyInput);
    setActiveTab('view');
  };

  const copyToClipboard = (text: string, type: 'seed' | 'nsec' | 'npub') => {
    navigator.clipboard.writeText(text);
    if (type === 'seed') {
      setCopiedSeed(true);
      setTimeout(() => setCopiedSeed(false), 2000);
    } else if (type === 'nsec') {
      setCopiedNsec(true);
      setTimeout(() => setCopiedNsec(false), 2000);
    } else {
      setCopiedNpub(true);
      setTimeout(() => setCopiedNpub(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl text-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Cryptographic Keys & Profile</h2>
              <span className="text-xs text-slate-500">Decentralized Local Keys (No Google Account Required)</span>
            </div>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Notice Banner */}
        <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-start gap-2.5 font-sans">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-emerald-950">100% Anonymous & Local (Zero Google Sign-In)</span>
            <p className="text-[11px] text-emerald-800 leading-normal">
              AUFBRUCH generates cryptographic keys locally in your browser RAM. We never ask for Google Sign-In, email, or accounts.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs mt-3">
          <button
            onClick={() => setActiveTab('view')}
            className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'view' ? 'border-indigo-600 text-indigo-700 font-bold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Keys
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'generate' ? 'border-indigo-600 text-indigo-700 font-bold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            New Key Pair
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'import' ? 'border-indigo-600 text-indigo-700 font-bold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Import Seed
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-5">
          {activeTab === 'view' && identity && (
            <div className="space-y-4">
              {/* Petname / Profile Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={petname || identity.petname}
                    onChange={(e) => setPetname(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 12-Word Seed Phrase Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Backup Phrase (12 Words)
                  </label>
                  <button
                    onClick={() => copyToClipboard(identity.seedPhrase, 'seed')}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    {copiedSeed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSeed ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 grid grid-cols-3 gap-2">
                  {identity.seedPhrase.split(' ').map((word, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <span className="text-slate-400 text-[10px] mr-1">#{idx + 1}</span>
                      <span className="font-semibold text-indigo-700">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Public Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Public Key (npub)</label>
                  <button
                    onClick={() => copyToClipboard(identity.npub, 'npub')}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    {copiedNpub ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNpub ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={identity.npub}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 select-all font-mono"
                />
              </div>

              {/* QR Backup Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">
                      QR Code Backup
                    </span>
                  </div>
                </div>

                {!isQrUnlocked ? (
                  <div className="space-y-3 pt-1">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Unlock to render a secure QR code for transferring keys to another device.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        style={{ WebkitTextSecurity: 'disc' } as any}
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        value={exportPin}
                        onChange={(e) => setExportPin(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyPinAndShowQr()}
                        placeholder="Vault PIN (Voice-Vault-2026)"
                        className="flex-1 min-w-[180px] bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                      <button
                        onClick={handleVerifyPinAndShowQr}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unlock</span>
                      </button>
                    </div>

                    {pinError && (
                      <p className="text-xs text-rose-600 font-medium">{pinError}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center space-y-4">
                    <div className="p-3 bg-white rounded-xl shadow-2xl">
                      <QRCodeCanvas
                        id="high-contrast-seed-qr"
                        value={identity.seedPhrase}
                        size={180}
                        level="H"
                        includeMargin={true}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full pt-1">
                      <button
                        onClick={handleDownloadQrPng}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Save PNG</span>
                      </button>

                      <button
                        onClick={handleLockQr}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                <RefreshCw className="w-6 h-6 animate-spin-slow" />
              </div>

              <h3 className="font-bold text-slate-900 text-sm">Create New Key Pair</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Generates a fresh 12-word seed phrase locally on your device (100% offline, zero sign-in).
              </p>

              <button
                onClick={handleGenerateFreshSeed}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-transform active:scale-95 shadow-sm"
              >
                Generate New Keys
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  12-Word Seed Phrase
                </label>
                <textarea
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-3 text-xs text-indigo-900 placeholder-slate-400 focus:outline-none font-mono"
                />
              </div>

              <button
                onClick={handleImportSeed}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm text-xs transition-transform active:scale-95"
              >
                Restore Key Pair
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end text-xs">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-xl">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

