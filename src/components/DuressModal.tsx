import React, { useState } from 'react';
import { ShieldAlert, Lock, Trash2, Key, Check, X, AlertTriangle } from 'lucide-react';
import { DuressConfig } from '../types';
import { getDuressConfig, saveDuressConfig, triggerDuressEmergencyWipe } from '../services/duress';

interface DuressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerDuressNow: () => void;
}

export const DuressModal: React.FC<DuressModalProps> = ({ isOpen, onClose, onTriggerDuressNow }) => {
  const [config, setConfig] = useState<DuressConfig>(getDuressConfig());
  const [normalPinInput, setNormalPinInput] = useState(config.normalPin);
  const [duressPinInput, setDuressPinInput] = useState(config.duressPin);
  const [savedMsg, setSavedMsg] = useState(false);

  if (!isOpen) return null;

  const handleSavePins = () => {
    if (normalPinInput.length < 4 || duressPinInput.length < 4) {
      alert('PINs must be at least 4 digits.');
      return;
    }
    if (normalPinInput === duressPinInput) {
      alert('Duress PIN must be different from Normal PIN!');
      return;
    }

    const updated = {
      ...config,
      normalPin: normalPinInput,
      duressPin: duressPinInput,
    };
    setConfig(updated);
    saveDuressConfig(updated);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleEmergencyWipeClick = () => {
    if (confirm('CRITICAL WARNING: This will immediately erase all cryptographic private keys from volatile memory and launch the Decoy Cat Feed. Continue?')) {
      triggerDuressEmergencyWipe();
      onTriggerDuressNow();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-mono">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg text-zinc-100 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="font-bold text-base text-zinc-100">Duress Mode & Anti-Seizure Protection</h2>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Threat Model Explanation */}
        <div className="p-4 bg-rose-950/30 border-b border-rose-900/50 text-xs space-y-2">
          <span className="text-rose-400 font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Street-Level Checkpoint Mitigation
          </span>
          <p className="text-zinc-300 leading-relaxed text-[11px]">
            If forced by authorities to unlock your phone at a physical checkpoint, entering your secondary <strong>Duress PIN</strong> opens a benign decoy news feed while instantly wiping all true cryptographic keys from device RAM.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-400 mb-1">NORMAL UNLOCK PIN</label>
              <input
                type="text"
                value={normalPinInput}
                onChange={(e) => setNormalPinInput(e.target.value)}
                maxLength={6}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-emerald-400 font-bold tracking-widest text-center"
              />
            </div>

            <div>
              <label className="block font-semibold text-rose-400 mb-1">DURESS EMERGENCY PIN</label>
              <input
                type="text"
                value={duressPinInput}
                onChange={(e) => setDuressPinInput(e.target.value)}
                maxLength={6}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-rose-400 font-bold tracking-widest text-center"
              />
            </div>
          </div>

          <button
            onClick={handleSavePins}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
          >
            {savedMsg ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{savedMsg ? 'PIN Configuration Saved' : 'Save PIN Configuration'}</span>
          </button>

          {/* Quick Immediate Emergency Wipe Button */}
          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <label className="block text-xs font-semibold text-rose-400">IMMEDIATE MANUAL EMERGENCY WIPE</label>
            <button
              onClick={handleEmergencyWipeClick}
              className="w-full py-2.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-rose-400 animate-bounce" />
              <span>TRIGGER IMMEDIATE DURESS QUICK-WIPE NOW</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
