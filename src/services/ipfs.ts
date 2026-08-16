import { IpfsPeer, IpfsStoredChunk } from '../types';

/**
 * P2P / IPFS Decentralized Storage Layer Service
 */

const IPFS_DB_NAME = 'aufbruch_ipfs_storage';
const IPFS_DB_VERSION = 1;
const STORE_CHUNKS = 'chunks';
const STORE_FILES = 'files';

let ipfsDbPromise: Promise<IDBDatabase> | null = null;

function getIpfsDB(): Promise<IDBDatabase> {
  if (!ipfsDbPromise) {
    ipfsDbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not available'));
      }
      const request = indexedDB.open(IPFS_DB_NAME, IPFS_DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
          const chunkStore = db.createObjectStore(STORE_CHUNKS, { keyPath: 'id' });
          chunkStore.createIndex('cid', 'cid', { unique: false });
          chunkStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          db.createObjectStore(STORE_FILES, { keyPath: 'cid' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        seedDefaultChunksIfEmpty(db).then(() => resolve(db));
      };
      request.onerror = (e) => reject(e);
    });
  }
  return ipfsDbPromise;
}

/**
 * Seed initial sample IPFS media chunks into IndexedDB so the user has visible media storage
 */
async function seedDefaultChunksIfEmpty(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHUNKS, 'readwrite');
      const store = tx.objectStore(STORE_CHUNKS);
      const countReq = store.count();

      countReq.onsuccess = () => {
        if (countReq.result === 0) {
          const now = Date.now();
          const sampleChunks: IpfsStoredChunk[] = [
            {
              id: 'bafybeic89210aa990182811a_0',
              cid: 'bafybeic89210aa990182811a',
              chunkIndex: 0,
              totalChunks: 2,
              byteSize: 262144, // 256 KB
              fileName: 'peaceful_rally_press.jpg',
              mediaType: 'image',
              dataBlob: 'blob_header_chunk_0_exif_scrubbed',
              createdAt: now - 3600000 * 48, // 2 days ago
              lastAccessedAt: now - 3600000 * 2,
              pinned: false,
            },
            {
              id: 'bafybeic89210aa990182811a_1',
              cid: 'bafybeic89210aa990182811a',
              chunkIndex: 1,
              totalChunks: 2,
              byteSize: 184320, // 180 KB
              fileName: 'peaceful_rally_press.jpg',
              mediaType: 'image',
              dataBlob: 'blob_payload_chunk_1_scrubbed',
              createdAt: now - 3600000 * 48,
              lastAccessedAt: now - 3600000 * 2,
              pinned: false,
            },
            {
              id: 'bafybeicvoice991283018274a_0',
              cid: 'bafybeicvoice991283018274a',
              chunkIndex: 0,
              totalChunks: 1,
              byteSize: 524288, // 512 KB
              fileName: 'anonymized_whistleblower_audio.wav',
              mediaType: 'audio',
              dataBlob: 'blob_audio_pitch_shifted_fsk',
              createdAt: now - 3600000 * 72, // 3 days ago
              lastAccessedAt: now - 3600000 * 5,
              pinned: true,
            },
            {
              id: 'bafybeigdyrzt5sfp7udm7hu76u_0',
              cid: 'bafybeigdyrzt5sfp7udm7hu76u',
              chunkIndex: 0,
              totalChunks: 3,
              byteSize: 262144,
              fileName: 'surveillance_tender_declassified.pdf',
              mediaType: 'document',
              dataBlob: 'blob_doc_sanitized_redacted',
              createdAt: now - 3600000 * 12, // 12 hrs ago
              lastAccessedAt: now - 3600000 * 1,
              pinned: false,
            },
            {
              id: 'bafybeigdyrzt5sfp7udm7hu76u_1',
              cid: 'bafybeigdyrzt5sfp7udm7hu76u',
              chunkIndex: 1,
              totalChunks: 3,
              byteSize: 262144,
              fileName: 'surveillance_tender_declassified.pdf',
              mediaType: 'document',
              dataBlob: 'blob_doc_sanitized_part2',
              createdAt: now - 3600000 * 12,
              lastAccessedAt: now - 3600000 * 1,
              pinned: false,
            },
            {
              id: 'bafybeigdyrzt5sfp7udm7hu76u_2',
              cid: 'bafybeigdyrzt5sfp7udm7hu76u',
              chunkIndex: 2,
              totalChunks: 3,
              byteSize: 131072,
              fileName: 'surveillance_tender_declassified.pdf',
              mediaType: 'document',
              dataBlob: 'blob_doc_sanitized_part3',
              createdAt: now - 3600000 * 12,
              lastAccessedAt: now - 3600000 * 1,
              pinned: false,
            },
          ];

          sampleChunks.forEach((c) => store.put(c));
        }
        resolve();
      };
      countReq.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// Global mock list of decentralization swarm nodes across Asia-Pacific / High-Surveillance regional edge relays
export const DEFAULT_IPFS_PEERS: IpfsPeer[] = [
  { id: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco', address: '185.199.108.153:4001 (Mumbai Edge)', pingMs: 18, status: 'synced', chunkCount: 1024, downloadSpeedKbps: 4200 },
  { id: 'QmYwAPJzv5CZsnA625s3X2nemtYgPpHdWEz79ojWnPbdG1', address: '104.21.58.12:4001 (Karachi Node)', pingMs: 24, status: 'active', chunkCount: 850, downloadSpeedKbps: 3800 },
  { id: 'QmaCpDM1trcqL31z5y3G7Sao25y6vPAnBipB26y3m1K123', address: '13.232.140.22:4001 (Dhaka P2P Swarm)', pingMs: 31, status: 'active', chunkCount: 920, downloadSpeedKbps: 2900 },
  { id: 'QmZ4t12b93k5K1m3v7y2BAn12x43C12K12L934V22J111', address: '52.76.12.89:4001 (Singapore Gateway)', pingMs: 45, status: 'synced', chunkCount: 2048, downloadSpeedKbps: 8500 },
  { id: 'QmP12x889V12A93K551N122A599M113B1289C338A999', address: '198.51.100.44:4001 (Tor Onion Gateway)', pingMs: 110, status: 'active', chunkCount: 412, downloadSpeedKbps: 1200 },
];

/**
 * Generates an IPFS Content Identifier (CID v1) hash from file data
 */
export async function calculateIpfsCid(data: Uint8Array | ArrayBuffer | string): Promise<string> {
  const enc = new TextEncoder();
  const bytes = typeof data === 'string' ? enc.encode(data) : new Uint8Array(data);
  
  // Compute SHA-256 multihash
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return IPFS CID representation format (bafybeic...)
  return `bafybeic${hexHash.substring(0, 32)}`;
}

/**
 * Simulates client-side P2P file chunking (256 KB chunks) and publishing to IPFS network
 * and commits the media chunks into local IndexedDB storage cache
 */
export async function publishToIpfsSwarm(
  fileDataUrl: string,
  fileName: string,
  onProgress?: (progressPercent: number, peersReached: number) => void
): Promise<{ cid: string; chunks: number; totalBytes: number }> {
  const cid = await calculateIpfsCid(fileDataUrl);
  const totalBytes = fileDataUrl.length;
  const chunkSize = 256 * 1024; // 256 KB
  const totalChunks = Math.max(1, Math.ceil(totalBytes / chunkSize));

  const isAudio = fileName.endsWith('.wav') || fileName.endsWith('.mp3') || fileName.endsWith('.ogg');
  const isDoc = fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.txt');
  const mediaType: 'image' | 'audio' | 'video' | 'document' | 'other' = isAudio
    ? 'audio'
    : isDoc
    ? 'document'
    : 'image';

  // Save chunks into IndexedDB
  try {
    const db = await getIpfsDB();
    const tx = db.transaction(STORE_CHUNKS, 'readwrite');
    const store = tx.objectStore(STORE_CHUNKS);
    const now = Date.now();

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(totalBytes, start + chunkSize);
      const chunkBytes = end - start;
      const chunkData = fileDataUrl.substring(start, Math.min(start + 100, end));

      const chunkObj: IpfsStoredChunk = {
        id: `${cid}_${i}`,
        cid,
        chunkIndex: i,
        totalChunks,
        byteSize: chunkBytes,
        fileName,
        mediaType,
        dataBlob: chunkData,
        createdAt: now,
        lastAccessedAt: now,
        pinned: false,
      };

      store.put(chunkObj);
    }
  } catch (err) {
    console.warn('[IPFS] Failed saving chunks to IndexedDB:', err);
  }

  for (let i = 1; i <= totalChunks; i++) {
    const percent = Math.min(100, Math.round((i / totalChunks) * 100));
    const activePeers = Math.min(DEFAULT_IPFS_PEERS.length, Math.floor((i / totalChunks) * DEFAULT_IPFS_PEERS.length) + 1);
    
    if (onProgress) {
      onProgress(percent, activePeers);
    }
    await new Promise(res => setTimeout(res, 80)); // Simulate P2P network propagation
  }

  return {
    cid,
    chunks: totalChunks,
    totalBytes,
  };
}

/**
 * Returns a gateway URL or data URI fallback for a CID
 */
export function getIpfsGatewayUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`;
}

/**
 * Retrieves all stored IPFS chunks from local IndexedDB
 */
export async function getAllStoredIpfsChunks(): Promise<IpfsStoredChunk[]> {
  try {
    const db = await getIpfsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CHUNKS, 'readonly');
      const store = tx.objectStore(STORE_CHUNKS);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Prunes specific IPFS media chunks from IndexedDB based on CIDs or age filter
 */
export async function pruneStoredIpfsChunks(options?: {
  cids?: string[];
  olderThanMs?: number;
  skipPinned?: boolean;
}): Promise<{ prunedCount: number; bytesReclaimed: number }> {
  try {
    const db = await getIpfsDB();
    const allChunks = await getAllStoredIpfsChunks();
    const now = Date.now();

    const toDelete = allChunks.filter((chunk) => {
      if (options?.skipPinned && chunk.pinned) return false;
      if (options?.cids && options.cids.length > 0) {
        return options.cids.includes(chunk.cid);
      }
      if (options?.olderThanMs && options.olderThanMs > 0) {
        return now - chunk.createdAt > options.olderThanMs;
      }
      return true;
    });

    if (toDelete.length === 0) {
      return { prunedCount: 0, bytesReclaimed: 0 };
    }

    const tx = db.transaction(STORE_CHUNKS, 'readwrite');
    const store = tx.objectStore(STORE_CHUNKS);

    let bytesReclaimed = 0;
    toDelete.forEach((chunk) => {
      bytesReclaimed += chunk.byteSize;
      store.delete(chunk.id);
    });

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve({ prunedCount: toDelete.length, bytesReclaimed });
      tx.onerror = () => resolve({ prunedCount: 0, bytesReclaimed: 0 });
    });
  } catch {
    return { prunedCount: 0, bytesReclaimed: 0 };
  }
}

/**
 * Toggles pinning status for an IPFS CID
 */
export async function toggleIpfsChunkPin(cid: string, pinned: boolean): Promise<void> {
  try {
    const db = await getIpfsDB();
    const allChunks = await getAllStoredIpfsChunks();
    const tx = db.transaction(STORE_CHUNKS, 'readwrite');
    const store = tx.objectStore(STORE_CHUNKS);

    allChunks
      .filter((c) => c.cid === cid)
      .forEach((c) => {
        c.pinned = pinned;
        store.put(c);
      });
  } catch {}
}

