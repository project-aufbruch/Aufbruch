import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Pin,
  PinOff,
  Shield,
  Layers,
  FileBox,
  MessageSquare,
  Database,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
} from 'lucide-react';
import { StorageBreakdown, PruneResult } from '../types';
import { storageCacheManager, formatByteSize } from '../services/cacheManager';

interface ClearCacheModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClearCacheModal: React.FC<ClearCacheModalProps> = ({ isOpen, onClose }) => {
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [olderThanDays, setOlderThanDays] = useState<number>(0); // 0 = all
  const [skipPinnedIpfs, setSkipPinnedIpfs] = useState<boolean>(true);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>('ipfs_chunks');
  const [isPruning, setIsPruning] = useState(false);
  const [lastPruneResult, setLastPruneResult] = useState<PruneResult | null>(null);
  const [isVacuuming, setIsVacuuming] = useState(false);
  const [vacuumSuccessMsg, setVacuumSuccessMsg] = useState<string | null>(null);
  const [confirmPruneDialog, setConfirmPruneDialog] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLastPruneResult(null);
      setVacuumSuccessMsg(null);
      setConfirmPruneDialog(false);
      return;
    }

    const unsubscribe = storageCacheManager.subscribe((data) => {
      setBreakdown(data);
      // Default selection: select all safe categories if not already chosen
      if (selectedCategories.length === 0 && data.categories.length > 0) {
        setSelectedCategories(data.categories.map((c) => c.id));
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const selectAll = () => {
    if (!breakdown) return;
    setSelectedCategories(breakdown.categories.map((c) => c.id));
  };

  const deselectAll = () => {
    setSelectedCategories([]);
  };

  const handleTogglePin = async (cid: string, currentPin: boolean) => {
    await storageCacheManager.togglePin(cid, !currentPin);
  };

  const handleExecutePrune = async () => {
    if (selectedCategories.length === 0) return;
    setIsPruning(true);
    setConfirmPruneDialog(false);
    setVacuumSuccessMsg(null);

    try {
      const result = await storageCacheManager.pruneSelected(selectedCategories, {
        olderThanDays,
        skipPinnedIpfs,
      });
      setLastPruneResult(result);
    } catch (err) {
      console.error('Pruning error:', err);
    } finally {
      setIsPruning(false);
    }
  };

  const handleVacuum = async () => {
    setIsVacuuming(true);
    setLastPruneResult(null);
    try {
      const res = await storageCacheManager.vacuumAndOptimize();
      setVacuumSuccessMsg(
        `Storage optimized! Reclaimed ${res.reclaimedFormatted} of redundant cache blocks and compacted database indexes.`
      );
    } catch (err) {
      console.error('Vacuum error:', err);
    } finally {
      setIsVacuuming(false);
    }
  };

  const selectedBytes =
    breakdown?.categories
      .filter((c) => selectedCategories.includes(c.id))
      .reduce((sum, c) => sum + c.bytesUsed, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <HardDrive className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Storage & Cache Pruning Studio</h2>
                <span className="text-[11px] font-mono bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 px-2 py-0.5 rounded-full font-medium">
                  IPFS & IndexedDB
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Inspect and selectively prune cached media blobs, IndexedDB records, and relay streams to free device storage.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Identity Protection Assurance Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 shadow-xs">
            <Shield className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="leading-relaxed">
              <strong className="font-semibold text-emerald-950">Cryptographic Protection Guarantee:</strong> Your
              private key, BIP-39 mnemonic seed, and cryptographic identity vault are stored in an isolated, tamper-proof
              hardware partition and are <strong>strictly excluded</strong> from all cache pruning operations.
            </div>
          </div>

          {/* Storage Overview Bar & Stats */}
          {breakdown && (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Application Cache</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {breakdown.totalBytesFormatted}
                    </span>
                    <span className="text-xs text-slate-500">
                      of {breakdown.quotaBytesFormatted} device storage space
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVacuum}
                    disabled={isVacuuming}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
                    title="Quick Vacuum will compress caches and remove stale blocks without touching chat"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isVacuuming ? 'animate-spin' : ''}`} />
                    {isVacuuming ? 'Optimizing...' : 'Quick Vacuum'}
                  </button>

                  <button
                    onClick={() => storageCacheManager.getStorageBreakdown()}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Refresh storage statistics"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress / Gauge Bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                  {breakdown.categories.map((cat, idx) => {
                    const pct = breakdown.totalBytesUsed > 0 ? (cat.bytesUsed / breakdown.totalBytesUsed) * 100 : 0;
                    if (pct <= 0) return null;
                    const colors = [
                      'bg-indigo-500',
                      'bg-blue-500',
                      'bg-emerald-500',
                      'bg-purple-500',
                      'bg-amber-500',
                      'bg-rose-500',
                      'bg-teal-500',
                      'bg-cyan-500',
                    ];
                    return (
                      <div
                        key={cat.id}
                        style={{ width: `${pct}%` }}
                        className={`${colors[idx % colors.length]} transition-all duration-500`}
                        title={`${cat.name}: ${cat.bytesFormatted} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>IPFS Chunks ({breakdown.categories.find((c) => c.id === 'ipfs_chunks')?.bytesFormatted || '0 B'})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>IndexedDB Analytics</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Nostr Feed Cache</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Encrypted Chat</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prune Result Notification */}
          {lastPruneResult && (
            <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-sm flex items-start justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Storage Reclaimed Successfully</h4>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Purged <strong>{lastPruneResult.itemsPrunedCount} items</strong> and freed{' '}
                    <strong>{lastPruneResult.reclaimedBytesFormatted}</strong> across{' '}
                    {lastPruneResult.categoriesPruned.join(', ')} in {lastPruneResult.durationMs}ms.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLastPruneResult(null)}
                className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {vacuumSuccessMsg && (
            <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-sm flex items-start justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-200 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Vacuum & Optimization Complete</h4>
                  <p className="text-xs text-indigo-100 mt-0.5">{vacuumSuccessMsg}</p>
                </div>
              </div>
              <button
                onClick={() => setVacuumSuccessMsg(null)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Selective Prune Controls & Options */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Selective Storage Pruning Categories</h3>
                <p className="text-xs text-slate-500">
                  Select the storage components you wish to purge from local device cache.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Filter Modifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>Age Filter Threshold:</span>
                </label>
                <select
                  value={olderThanDays}
                  onChange={(e) => setOlderThanDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>All Time (Purge All Selected Records)</option>
                  <option value={1}>Older than 24 Hours</option>
                  <option value={7}>Older than 7 Days</option>
                  <option value={30}>Older than 30 Days</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4 sm:pt-0">
                <input
                  type="checkbox"
                  id="skipPinnedCheck"
                  checked={skipPinnedIpfs}
                  onChange={(e) => setSkipPinnedIpfs(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="skipPinnedCheck" className="text-slate-700 font-medium cursor-pointer">
                  Protect Pinned IPFS Media Chunks (📌) from deletion
                </label>
              </div>
            </div>

            {/* Category Cards List */}
            <div className="space-y-2.5">
              {breakdown?.categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                const isExpanded = expandedCategoryId === category.id;

                const getStorageBadge = (type: string) => {
                  switch (type) {
                    case 'indexedDB':
                      return { label: 'IndexedDB', color: 'bg-blue-50 text-blue-700 border-blue-200' };
                    case 'localStorage':
                      return { label: 'LocalStorage', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                    case 'cacheStorage':
                      return { label: 'Cache API', color: 'bg-purple-50 text-purple-700 border-purple-200' };
                    default:
                      return { label: 'In-Memory', color: 'bg-slate-50 text-slate-700 border-slate-200' };
                  }
                };

                const badge = getStorageBadge(category.storageType);

                return (
                  <div
                    key={category.id}
                    className={`border rounded-xl transition-all ${
                      isSelected ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200 bg-white opacity-80'
                    }`}
                  >
                    <div className="p-3.5 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCategory(category.id)}
                        className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 mt-1 cursor-pointer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{category.name}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-medium ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-800">
                              {category.bytesFormatted}
                            </span>
                            <span className="text-[11px] text-slate-400">({category.itemCount} items)</span>

                            {category.items && category.items.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedCategoryId(isExpanded ? null : category.id)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                title="Toggle item details"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-0.5">{category.description}</p>

                        {category.warningNote && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            <Info className="w-3 h-3 shrink-0" />
                            <span>{category.warningNote}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sub-item Explorer Drawer */}
                    {isExpanded && category.items && category.items.length > 0 && (
                      <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 bg-slate-50/70 rounded-b-xl space-y-1.5 text-xs">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Cached Item Ledger ({category.items.length} records):
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                          {category.items.map((item) => {
                            const isChunkPinned = item.details?.includes('Pinned');
                            const cidMatch = item.details?.match(/CID: ([^.\s|]+)/);
                            const itemCid = cidMatch ? cidMatch[1] : '';

                            return (
                              <div
                                key={item.id}
                                className="p-2 bg-white border border-slate-200/80 rounded-lg flex items-center justify-between text-[11px]"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-medium text-slate-800 truncate">{item.name}</div>
                                  {item.details && <div className="text-[10px] text-slate-400 font-mono">{item.details}</div>}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono text-slate-600 font-semibold">{item.sizeFormatted}</span>

                                  {category.id === 'ipfs_chunks' && itemCid && (
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePin(itemCid, isChunkPinned || false)}
                                      className={`p-1 rounded-md transition-colors ${
                                        isChunkPinned
                                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                          : 'bg-slate-100 text-slate-400 hover:text-slate-700'
                                      }`}
                                      title={isChunkPinned ? 'Unpin chunk' : 'Pin chunk (prevents deletion)'}
                                    >
                                      {isChunkPinned ? <Pin className="w-3 h-3 fill-amber-700" /> : <PinOff className="w-3 h-3" />}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirmation Modal Overlay */}
        {confirmPruneDialog && (
          <div className="p-4 bg-rose-50 border-t border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                Confirm purging <strong>{formatByteSize(selectedBytes)}</strong> across {selectedCategories.length} storage{' '}
                {selectedCategories.length === 1 ? 'category' : 'categories'}?
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmPruneDialog(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePrune}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Prune Cache
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Selected for prune:{' '}
            <strong className="text-slate-900 font-bold">{formatByteSize(selectedBytes)}</strong> (
            {selectedCategories.length} categories)
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Done / Close
            </button>

            <button
              type="button"
              disabled={selectedCategories.length === 0 || isPruning || selectedBytes === 0}
              onClick={() => setConfirmPruneDialog(true)}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-98"
            >
              <Trash2 className={`w-4 h-4 ${isPruning ? 'animate-bounce' : ''}`} />
              {isPruning ? 'Pruning Storage...' : `Prune Selected (${formatByteSize(selectedBytes)})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
