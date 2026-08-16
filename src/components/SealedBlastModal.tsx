import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  Flame,
  UserPlus,
  Trash2,
  Radio
} from 'lucide-react';
import { sealedBlastService } from '../services/sealedBlastService';
import { chatService } from '../services/chatService';
import { SealedBlastMessage, UserIdentity } from '../types';

interface SealedBlastModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: UserIdentity | null;
}

export const SealedBlastModal: React.FC<SealedBlastModalProps> = ({
  isOpen,
  onClose,
  identity,
}) => {
  const [blasts, setBlasts] = useState<SealedBlastMessage[]>(sealedBlastService.getBlasts());
  const [selectedContacts, setSelectedContacts] = useState<{ pubkey: string; petname: string }[]>([]);
  const [customPubkeyInput, setCustomPubkeyInput] = useState('');
  const [customPetnameInput, setCustomPetnameInput] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isBurnOnRead, setIsBurnOnRead] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');

  // Pre-load known contacts from chat service
  useEffect(() => {
    const unsub = sealedBlastService.subscribe((newBlasts) => {
      setBlasts(newBlasts);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleAddCustomContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPubkeyInput.trim()) return;
    const petname = customPetnameInput.trim() || customPubkeyInput.slice(0, 10);
    if (!selectedContacts.some((c) => c.pubkey === customPubkeyInput.trim())) {
      setSelectedContacts([...selectedContacts, { pubkey: customPubkeyInput.trim(), petname }]);
    }
    setCustomPubkeyInput('');
    setCustomPetnameInput('');
  };

  const handleRemoveContact = (pubkey: string) => {
    setSelectedContacts(selectedContacts.filter((c) => c.pubkey !== pubkey));
  };

  const handleSendBlast = async () => {
    if (!identity || selectedContacts.length === 0 || !messageContent.trim()) return;
    setIsSending(true);
    try {
      await sealedBlastService.sendSealedBlast(
        identity,
        selectedContacts,
        messageContent.trim(),
        isBurnOnRead
      );
      setMessageContent('');
      setSelectedContacts([]);
      setActiveTab('history');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden my-6 relative">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center font-bold">
              <Lock className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Multi-Recipient Encrypted Blast</h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200">
                  NIP-17 & NIP-59
                </span>
              </div>
              <p className="text-xs text-purple-200/80 font-medium">
                Sealed gift-wrapped rumors delivered across multiple peer keys with metadata obfuscation
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'compose' ? 'bg-white text-purple-950 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>1. Compose Blast</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-purple-950 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>2. Blast History ({blasts.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {activeTab === 'compose' && (
            <div className="space-y-4">
              {/* Recipient Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Recipients ({selectedContacts.length} selected)</span>
                  <span className="text-[10px] text-purple-700 font-semibold">Each gets unique gift-wrap</span>
                </label>

                {/* Recipient Chips */}
                {selectedContacts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-purple-50/50 border border-purple-200 rounded-2xl">
                    {selectedContacts.map((c) => (
                      <span
                        key={c.pubkey}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-900 shadow-2xs"
                      >
                        <span>{c.petname}</span>
                        <button
                          onClick={() => handleRemoveContact(c.pubkey)}
                          className="text-purple-400 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Custom Contact Form */}
                <form onSubmit={handleAddCustomContact} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Recipient Pubkey (npub or hex)..."
                    value={customPubkeyInput}
                    onChange={(e) => setCustomPubkeyInput(e.target.value)}
                    className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="Petname (optional)"
                    value={customPetnameInput}
                    onChange={(e) => setCustomPetnameInput(e.target.value)}
                    className="w-32 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Quick Add Presets */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span>Quick Add:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedContacts.some((c) => c.pubkey === 'relay_moderators_quorum')) {
                        setSelectedContacts([...selectedContacts, { pubkey: 'relay_moderators_quorum', petname: 'Relay Safety Mesh' }]);
                      }
                    }}
                    className="text-purple-700 hover:underline font-semibold"
                  >
                    + Relay Safety Mesh
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedContacts.some((c) => c.pubkey === 'medical_dispatch_all')) {
                        setSelectedContacts([...selectedContacts, { pubkey: 'medical_dispatch_all', petname: 'Medical Aid Circle' }]);
                      }
                    }}
                    className="text-purple-700 hover:underline font-semibold"
                  >
                    + Medical Aid Circle
                  </button>
                </div>
              </div>

              {/* Message Rumor Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Encrypted Payload (Rumor Content)
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                  placeholder="Type confidential broadcast... Public relay operators cannot see the sender or the recipients."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Gift Wrap Mechanism Diagram */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-[11px] text-slate-600">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  NIP-17 Gift-Wrapping Cryptography
                </div>
                <p>
                  1. <strong>Outer Wrap (Kind 1059):</strong> Signed by randomized throwaway ephemeral keys.<br />
                  2. <strong>Inner Seal (Kind 13):</strong> Encrypted strictly for the recipient's secp256k1 key.<br />
                  3. <strong>Rumor (Kind 14):</strong> Decrypted exclusively inside the recipient's secure sandbox.
                </p>
              </div>

              {/* Burn on Read Option */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBurnOnRead}
                  onChange={(e) => setIsBurnOnRead(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span className="flex items-center gap-1 text-red-700">
                  <Flame className="w-3.5 h-3.5" />
                  Burn & Auto-Purge from relay memory after 24 hours
                </span>
              </label>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSendBlast}
                disabled={selectedContacts.length === 0 || !messageContent.trim() || isSending}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSending
                    ? 'Sealing and Dispatching Wraps...'
                    : `Dispatch Sealed Blast to ${selectedContacts.length} Recipient${selectedContacts.length === 1 ? '' : 's'}`}
                </span>
              </button>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Dispatched Sealed Blasts</span>
                {blasts.length > 0 && (
                  <button
                    onClick={() => sealedBlastService.clearAll()}
                    className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear History</span>
                  </button>
                )}
              </div>

              {blasts.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                  No encrypted blasts dispatched yet. Compose one in Tab 1.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {blasts.map((b) => (
                    <div key={b.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-purple-600" />
                          <span>Sealed Blast ({b.recipients.length} recipients)</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(b.timestamp * 1000).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-slate-800 font-medium bg-white p-2.5 rounded-xl border border-slate-200">
                        {b.rumorContent}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {b.recipients.map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{r.petname}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
