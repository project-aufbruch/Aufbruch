import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Sun, Cloud, RefreshCcw, ShieldCheck } from 'lucide-react';
import { restoreFromDuressMode } from '../services/duress';

interface DecoyFeedProps {
  onDeactivateDuress: () => void;
}

export const DecoyFeed: React.FC<DecoyFeedProps> = ({ onDeactivateDuress }) => {
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [overridePasskey, setOverridePasskey] = useState('');
  const [logoTapCount, setLogoTapCount] = useState(0);

  const handleLogoClick = () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    if (newCount >= 3) {
      setShowOverrideInput(true);
      setLogoTapCount(0);
    }
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restoreFromDuressMode(overridePasskey)) {
      onDeactivateDuress();
    } else {
      alert('Invalid restore code.');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/30 text-zinc-800 font-sans pb-12">
      {/* Decoy Header: "Pet Life & Daily News" */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={handleLogoClick} className="flex items-center gap-2 text-left focus:outline-none">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
              🐾
            </div>
            <div>
              <h1 className="font-bold text-base text-zinc-900 tracking-tight">Daily Pet Life & Weather</h1>
              <p className="text-[11px] text-zinc-500">Your daily dose of happy animal stories</p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>28°C Sunny</span>
          </div>
        </div>
      </header>

      {/* Main Decoy Feed Items */}
      <main className="max-w-xl mx-auto p-4 space-y-5">
        {/* Post 1 */}
        <article className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
              🐈
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Cute Cats Daily</h3>
              <p className="text-xs text-zinc-400">Posted 10 mins ago</p>
            </div>
          </div>

          <p className="text-sm text-zinc-700 leading-relaxed">
            Milo decided that his favorite place to sleep today was inside a cardboard box half his size. Look at this little sleepy face! 😴📦
          </p>

          <div className="rounded-xl overflow-hidden bg-amber-100 aspect-video flex items-center justify-center border border-zinc-100">
            <img
              src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80"
              alt="Cute Cat"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            <span className="flex items-center gap-1.5 font-medium text-rose-500">
              <Heart className="w-4 h-4 fill-rose-500" /> 1,420
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" /> 84 Comments
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              <Share2 className="w-4 h-4" /> Share
            </span>
          </div>
        </article>

        {/* Post 2 */}
        <article className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600">
              🌱
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Home Gardening Tips</h3>
              <p className="text-xs text-zinc-400">Posted 1 hour ago</p>
            </div>
          </div>

          <p className="text-sm text-zinc-700 leading-relaxed">
            Simple tip for indoor herbs: Ensure 6 hours of indirect sunlight daily and never overwater your basil. Happy planting! 🌿✨
          </p>

          <div className="flex items-center gap-6 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" /> 580
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" /> 22 Comments
            </span>
          </div>
        </article>
      </main>

      {/* Secret Restore Modal triggered by triple-tapping logo */}
      {showOverrideInput && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleOverrideSubmit} className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              AUFBRUCH System Restore
            </h3>
            <p className="text-xs text-zinc-500">Enter master override key or original PIN to restore cryptographic app state.</p>
            <input
              type="text"
              style={{ WebkitTextSecurity: 'disc' } as any}
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              value={overridePasskey}
              onChange={(e) => setOverridePasskey(e.target.value)}
              placeholder="Enter PIN (Default: 1234)"
              className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:border-amber-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowOverrideInput(false)}
                className="flex-1 py-2 bg-zinc-100 text-zinc-700 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg shadow"
              >
                Restore Session
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
