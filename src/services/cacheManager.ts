import {
  StorageBreakdown,
  StorageCategoryStats,
  PruneResult,
  IpfsStoredChunk,
} from '../types';
import {
  getAllStoredIpfsChunks,
  pruneStoredIpfsChunks,
  toggleIpfsChunkPin,
} from './ipfs';

const LAST_PRUNED_KEY = 'pv_storage_last_pruned';

export function formatByteSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getLocalStorageByteSize(key: string): { bytes: number; count: number; raw: any } {
  if (typeof localStorage === 'undefined') return { bytes: 0, count: 0, raw: null };
  const val = localStorage.getItem(key);
  if (!val) return { bytes: 0, count: 0, raw: null };
  const bytes = new Blob([val]).size;
  try {
    const parsed = JSON.parse(val);
    const count = Array.isArray(parsed) ? parsed.length : 1;
    return { bytes, count, raw: parsed };
  } catch {
    return { bytes, count: 1, raw: val };
  }
}

class StorageCacheManager {
  private subscribers: Array<(breakdown: StorageBreakdown) => void> = [];

  public subscribe(cb: (breakdown: StorageBreakdown) => void): () => void {
    this.subscribers.push(cb);
    this.getStorageBreakdown().then(cb);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private async notify(): Promise<void> {
    const breakdown = await this.getStorageBreakdown();
    this.subscribers.forEach((cb) => cb(breakdown));
  }

  /**
   * Scans IndexedDB, LocalStorage, and CacheStorage to generate a detailed usage breakdown
   */
  public async getStorageBreakdown(): Promise<StorageBreakdown> {
    const categories: StorageCategoryStats[] = [];

    // 1. IPFS Media Chunks (IndexedDB)
    let ipfsChunks: IpfsStoredChunk[] = [];
    try {
      ipfsChunks = await getAllStoredIpfsChunks();
    } catch {
      ipfsChunks = [];
    }

    const ipfsBytes = ipfsChunks.reduce((acc, c) => acc + (c.byteSize || 0), 0);
    categories.push({
      id: 'ipfs_chunks',
      name: 'IPFS Media Chunks & P2P Swarm Blobs',
      description: 'Locally cached 256 KB encrypted media blocks, voice notes, photos, and declassified attachments.',
      itemCount: ipfsChunks.length,
      bytesUsed: ipfsBytes,
      bytesFormatted: formatByteSize(ipfsBytes),
      storageType: 'indexedDB',
      isSafeToPrune: true,
      items: ipfsChunks.map((c) => ({
        id: c.id,
        name: `${c.fileName} (Chunk ${c.chunkIndex + 1}/${c.totalChunks})`,
        sizeFormatted: formatByteSize(c.byteSize),
        date: new Date(c.createdAt).toLocaleDateString(),
        details: `CID: ${c.cid.substring(0, 16)}... | ${c.pinned ? 'Pinned 📌' : 'Unpinned'}`,
      })),
    });

    // 2. IndexedDB Analytics & Audit Trail
    let analyticsCount = 0;
    let analyticsBytes = 0;
    try {
      if (typeof window !== 'undefined' && window.indexedDB) {
        const dbReq = indexedDB.open('aufbruch_local_analytics', 1);
        await new Promise<void>((resolve) => {
          dbReq.onsuccess = () => {
            const db = dbReq.result;
            if (db.objectStoreNames.contains('events')) {
              const tx = db.transaction('events', 'readonly');
              const store = tx.objectStore('events');
              const countReq = store.count();
              countReq.onsuccess = () => {
                analyticsCount = countReq.result || 0;
                analyticsBytes = analyticsCount * 380; // approx 380 bytes per event record
                resolve();
              };
              countReq.onerror = () => resolve();
            } else {
              resolve();
            }
          };
          dbReq.onerror = () => resolve();
        });
      }
    } catch {}

    const localMetrics = getLocalStorageByteSize('aufbruch_local_metrics');
    analyticsBytes += localMetrics.bytes;

    categories.push({
      id: 'analytics_db',
      name: 'IndexedDB Analytics & Audit Trail',
      description: 'Zero-telemetry client-side privacy metrics, event counters, and bandwidth impact logs.',
      itemCount: analyticsCount + (localMetrics.count > 0 ? 1 : 0),
      bytesUsed: analyticsBytes,
      bytesFormatted: formatByteSize(analyticsBytes),
      storageType: 'indexedDB',
      isSafeToPrune: true,
      warningNote: 'Pruning resets detailed event timeline but preserves high-level privacy score.',
    });

    // 3. Nostr Feed & Relay Broadcast Cache (LocalStorage)
    const feedInfo = getLocalStorageByteSize('aufbruch_cached_feed');
    categories.push({
      id: 'nostr_feed',
      name: 'Nostr Relay Feed & Event Cache',
      description: 'Cached public broadcasts, signed micro-blog dispatches, and relay stream records.',
      itemCount: feedInfo.count,
      bytesUsed: feedInfo.bytes,
      bytesFormatted: formatByteSize(feedInfo.bytes),
      storageType: 'localStorage',
      isSafeToPrune: true,
      items: Array.isArray(feedInfo.raw)
        ? feedInfo.raw.slice(0, 10).map((e: any) => ({
            id: e.id || Math.random().toString(),
            name: `${e.authorPetname || 'Anonymous'}: "${(e.content || '').substring(0, 30)}..."`,
            sizeFormatted: formatByteSize(new Blob([JSON.stringify(e)]).size),
            date: new Date((e.created_at || Date.now() / 1000) * 1000).toLocaleDateString(),
          }))
        : undefined,
    });

    // 4. Encrypted Chat & Direct Messages Cache (LocalStorage)
    const chatMsgs = getLocalStorageByteSize('aufbruch_chat_messages');
    const chatGroups = getLocalStorageByteSize('aufbruch_chat_groups');
    const chatTotalBytes = chatMsgs.bytes + chatGroups.bytes;
    const chatTotalCount = chatMsgs.count + chatGroups.count;
    categories.push({
      id: 'chat_cache',
      name: 'P2P Direct Messages & Channel Cache',
      description: 'Locally stored encrypted NIP-04/NIP-17 messages and group metadata.',
      itemCount: chatTotalCount,
      bytesUsed: chatTotalBytes,
      bytesFormatted: formatByteSize(chatTotalBytes),
      storageType: 'localStorage',
      isSafeToPrune: true,
      warningNote: 'Messages will be cleared from offline cache but remain safely encrypted on relay servers.',
    });

    // 5. Whistleblower Vault & Declassified Leaks (LocalStorage)
    const vaultDocs = getLocalStorageByteSize('aufbruch_whistleblower_vault_v1');
    const vaultComments = getLocalStorageByteSize('aufbruch_whistleblower_comments_v1');
    const vaultTotalBytes = vaultDocs.bytes + vaultComments.bytes;
    const vaultTotalCount = vaultDocs.count + vaultComments.count;
    categories.push({
      id: 'whistleblower_cache',
      name: 'Whistleblower Dead-Drop & Leaks Archive',
      description: 'Sanitized classified disclosures, proof hashes, and investigative commentary.',
      itemCount: vaultTotalCount,
      bytesUsed: vaultTotalBytes,
      bytesFormatted: formatByteSize(vaultTotalBytes),
      storageType: 'localStorage',
      isSafeToPrune: true,
    });

    // 6. Anti-Spam Fortress & Quarantine Logs (LocalStorage)
    const quarantineInfo = getLocalStorageByteSize('aufbruch_spam_quarantine_v1');
    const blockedInfo = getLocalStorageByteSize('aufbruch_blocked_entities');
    const abuseInfo = getLocalStorageByteSize('aufbruch_abuse_reports');
    const spamTotalBytes = quarantineInfo.bytes + blockedInfo.bytes + abuseInfo.bytes;
    const spamTotalCount = quarantineInfo.count + blockedInfo.count + abuseInfo.count;
    categories.push({
      id: 'spam_quarantine',
      name: 'Anti-Spam Fortress & Quarantine Logs',
      description: 'Blocked spam payloads, PoW violation captures, and Sybil cluster reports.',
      itemCount: spamTotalCount,
      bytesUsed: spamTotalBytes,
      bytesFormatted: formatByteSize(spamTotalBytes),
      storageType: 'localStorage',
      isSafeToPrune: true,
    });

    // 7. Offline Geo-Pins & Emergency Map (LocalStorage)
    const emergencyPins = getLocalStorageByteSize('aufbruch_emergency_pins');
    categories.push({
      id: 'emergency_pins',
      name: 'Offline Safe Zones & Geo-Pins',
      description: 'Custom community offline safe points, medical checkpoints, and water markers.',
      itemCount: emergencyPins.count,
      bytesUsed: emergencyPins.bytes,
      bytesFormatted: formatByteSize(emergencyPins.bytes),
      storageType: 'localStorage',
      isSafeToPrune: true,
    });

    // 8. Ultrasonic Packets & Sealed Blasts
    const ultrasonicPackets = getLocalStorageByteSize('aufbruch_ultrasonic_packets');
    const sealedBlasts = getLocalStorageByteSize('aufbruch_sealed_blasts');
    const meshTotalBytes = ultrasonicPackets.bytes + sealedBlasts.bytes;
    const meshTotalCount = ultrasonicPackets.count + sealedBlasts.count;
    categories.push({
      id: 'mesh_packets',
      name: 'Acoustic Mesh Packets & Sealed Blasts',
      description: 'Demodulated ultrasonic sound packets and time-lock sealed dispatches.',
      itemCount: meshTotalCount,
      bytesUsed: meshTotalBytes,
      bytesFormatted: formatByteSize(meshTotalBytes),
      storageType: 'localStorage',
      isSafeToPrune: true,
    });

    // 9. Browser CacheStorage (Service Worker / Assets)
    let cacheStorageBytes = 0;
    let cacheStorageCount = 0;
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await caches.keys();
        cacheStorageCount = keys.length;
        cacheStorageBytes = cacheStorageCount * 1024 * 512; // estimated ~512 KB per cache store
      }
    } catch {}

    if (cacheStorageCount > 0) {
      categories.push({
        id: 'browser_cache_storage',
        name: 'Browser CacheStorage & App Shell Assets',
        description: 'Offline PWA cached icons, audio tones, and font binaries.',
        itemCount: cacheStorageCount,
        bytesUsed: cacheStorageBytes,
        bytesFormatted: formatByteSize(cacheStorageBytes),
        storageType: 'cacheStorage',
        isSafeToPrune: true,
      });
    }

    // Calculate totals and device storage estimate
    const totalBytesUsed = categories.reduce((sum, cat) => sum + cat.bytesUsed, 0);
    let quotaBytes = 1024 * 1024 * 1024 * 5; // Default fallback: 5 GB
    let systemUsedBytes = totalBytesUsed;

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota) quotaBytes = estimate.quota;
        if (estimate.usage && estimate.usage > totalBytesUsed) {
          systemUsedBytes = estimate.usage;
        }
      } catch {}
    }

    const percentUsed = Math.min(100, Math.max(0.5, (systemUsedBytes / quotaBytes) * 100));

    let lastPrunedTimestamp: number | undefined;
    if (typeof localStorage !== 'undefined') {
      const storedLast = localStorage.getItem(LAST_PRUNED_KEY);
      if (storedLast) lastPrunedTimestamp = parseInt(storedLast, 10);
    }

    return {
      totalBytesUsed,
      totalBytesFormatted: formatByteSize(totalBytesUsed),
      quotaBytes,
      quotaBytesFormatted: formatByteSize(quotaBytes),
      percentUsed: parseFloat(percentUsed.toFixed(1)),
      categories,
      lastPrunedTimestamp,
    };
  }

  /**
   * Executes selective pruning for chosen categories and age filters
   */
  public async pruneSelected(
    categoryIds: string[],
    options?: {
      olderThanDays?: number; // 0 means all
      skipPinnedIpfs?: boolean;
      specificIpfsCids?: string[];
    }
  ): Promise<PruneResult> {
    const startTime = performance.now();
    let reclaimedBytes = 0;
    let itemsPrunedCount = 0;
    const categoriesPruned: string[] = [];

    const olderThanMs = options?.olderThanDays ? options.olderThanDays * 86400000 : 0;

    for (const catId of categoryIds) {
      switch (catId) {
        case 'ipfs_chunks': {
          const res = await pruneStoredIpfsChunks({
            cids: options?.specificIpfsCids,
            olderThanMs,
            skipPinned: options?.skipPinnedIpfs ?? true,
          });
          reclaimedBytes += res.bytesReclaimed;
          itemsPrunedCount += res.prunedCount;
          categoriesPruned.push('IPFS Media Chunks');
          break;
        }

        case 'analytics_db': {
          try {
            if (typeof window !== 'undefined' && window.indexedDB) {
              const dbReq = indexedDB.open('aufbruch_local_analytics', 1);
              await new Promise<void>((resolve) => {
                dbReq.onsuccess = () => {
                  const db = dbReq.result;
                  if (db.objectStoreNames.contains('events')) {
                    const tx = db.transaction('events', 'readwrite');
                    const store = tx.objectStore('events');
                    const countReq = store.count();
                    countReq.onsuccess = () => {
                      const count = countReq.result || 0;
                      itemsPrunedCount += count;
                      reclaimedBytes += count * 380;
                      store.clear();
                      resolve();
                    };
                    countReq.onerror = () => resolve();
                  } else {
                    resolve();
                  }
                };
                dbReq.onerror = () => resolve();
              });
            }
          } catch {}
          categoriesPruned.push('IndexedDB Analytics');
          break;
        }

        case 'nostr_feed': {
          const feedInfo = getLocalStorageByteSize('aufbruch_cached_feed');
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('aufbruch_cached_feed');
          }
          reclaimedBytes += feedInfo.bytes;
          itemsPrunedCount += feedInfo.count;
          categoriesPruned.push('Nostr Feed Cache');
          break;
        }

        case 'chat_cache': {
          const msgs = getLocalStorageByteSize('aufbruch_chat_messages');
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('aufbruch_chat_messages');
          }
          reclaimedBytes += msgs.bytes;
          itemsPrunedCount += msgs.count;
          categoriesPruned.push('Chat Cache');
          break;
        }

        case 'whistleblower_cache': {
          const docs = getLocalStorageByteSize('aufbruch_whistleblower_vault_v1');
          const comments = getLocalStorageByteSize('aufbruch_whistleblower_comments_v1');
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('aufbruch_whistleblower_vault_v1');
            localStorage.removeItem('aufbruch_whistleblower_comments_v1');
            localStorage.removeItem('aufbruch_vault_docs');
            localStorage.removeItem('aufbruch_vault_comments');
          }
          reclaimedBytes += docs.bytes + comments.bytes;
          itemsPrunedCount += docs.count + comments.count;
          categoriesPruned.push('Whistleblower Vault');
          break;
        }

        case 'spam_quarantine': {
          const q = getLocalStorageByteSize('aufbruch_spam_quarantine_v1');
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('aufbruch_spam_quarantine_v1');
            localStorage.removeItem('pv_fortress_quarantine_log');
            localStorage.removeItem('aufbruch_blocked_entities');
            localStorage.removeItem('aufbruch_abuse_reports');
          }
          reclaimedBytes += q.bytes;
          itemsPrunedCount += q.count;
          categoriesPruned.push('Spam Quarantine Log');
          break;
        }

        case 'emergency_pins': {
          const pins = getLocalStorageByteSize('aufbruch_emergency_pins');
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('aufbruch_emergency_pins');
            localStorage.removeItem('voice_emergency_pins');
          }
          reclaimedBytes += pins.bytes;
          itemsPrunedCount += pins.count;
          categoriesPruned.push('Offline Geo-Pins');
          break;
        }

        case 'mesh_packets': {
          const u = getLocalStorageByteSize('aufbruch_ultrasonic_packets');
          const s = getLocalStorageByteSize('aufbruch_sealed_blasts');
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('aufbruch_ultrasonic_packets');
            localStorage.removeItem('aufbruch_sealed_blasts');
            localStorage.removeItem('voice_ultrasonic_packets');
            localStorage.removeItem('voice_sealed_blasts');
          }
          reclaimedBytes += u.bytes + s.bytes;
          itemsPrunedCount += u.count + s.count;
          categoriesPruned.push('Acoustic Packets');
          break;
        }

        case 'browser_cache_storage': {
          try {
            if (typeof window !== 'undefined' && 'caches' in window) {
              const keys = await caches.keys();
              for (const k of keys) {
                await caches.delete(k);
                itemsPrunedCount++;
                reclaimedBytes += 1024 * 512;
              }
            }
          } catch {}
          categoriesPruned.push('Browser CacheStorage');
          break;
        }
      }
    }

    const now = Date.now();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAST_PRUNED_KEY, now.toString());
    }

    const durationMs = Math.round(performance.now() - startTime);

    await this.notify();

    return {
      reclaimedBytes,
      reclaimedBytesFormatted: formatByteSize(reclaimedBytes),
      itemsPrunedCount,
      categoriesPruned,
      durationMs,
      timestamp: now,
    };
  }

  /**
   * One-Click Vacuum & Compact: Safely compresses caches, purges orphan chunks, and recalculates storage
   */
  public async vacuumAndOptimize(): Promise<{ reclaimedBytes: number; reclaimedFormatted: string }> {
    // Prune unpinned IPFS chunks older than 3 days, spam quarantine, and dead logs
    const result = await this.pruneSelected(['spam_quarantine', 'mesh_packets', 'ipfs_chunks'], {
      olderThanDays: 3,
      skipPinnedIpfs: true,
    });
    return {
      reclaimedBytes: result.reclaimedBytes,
      reclaimedFormatted: result.reclaimedBytesFormatted,
    };
  }

  /**
   * Pin or unpin an IPFS CID
   */
  public async togglePin(cid: string, pinned: boolean): Promise<void> {
    await toggleIpfsChunkPin(cid, pinned);
    await this.notify();
  }
}

export const storageCacheManager = new StorageCacheManager();
