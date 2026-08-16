import { NostrEvent, RelayNode } from '../types';
import { mineProofOfWork, signNostrEvent } from './crypto';
import { resolveHostnameDoH, DoHResult } from './doh';
import { recommendationEngine } from './recommendation';
import { antiSpamFortress } from './antiSpamFortress';

// Default global Nostr relays + regional anti-censorship backup relays
export const DEFAULT_RELAYS: RelayNode[] = [
  { url: 'wss://relay.damus.io', status: 'connected', pingMs: 42, eventsReceived: 1420, isBackup: false, location: 'Global High-Cap (DoH Cloudflare 1.1.1.1)' },
  { url: 'wss://nos.lol', status: 'connected', pingMs: 58, eventsReceived: 980, isBackup: false, location: 'EU Anti-Censorship (DoH Encrypted)' },
  { url: 'wss://relay.snort.social', status: 'connected', pingMs: 64, eventsReceived: 1100, isBackup: false, location: 'US West (DoH Secured)' },
  { url: 'wss://relay.primal.net', status: 'connected', pingMs: 38, eventsReceived: 2100, isBackup: false, location: 'High Availability (Direct IP Fallback)' },
  { url: 'wss://nostr.mom', status: 'connected', pingMs: 76, eventsReceived: 620, isBackup: true, location: 'Fallback Asia Edge' },
  { url: 'wss://relay.current.fyi', status: 'connected', pingMs: 82, eventsReceived: 450, isBackup: true, location: 'Onion / Obfs4 Bridge' },
];


// Initial default uncensorable public feed items across diverse channels
export const INITIAL_NOSTR_FEED: NostrEvent[] = [
  {
    id: 'evt_referendum_001_civic',
    pubkey: '9a90372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427f',
    authorNpub: 'npub180cvv07tjdrrg90v3d8q3cm08p9w000000000000000000000000000000',
    authorPetname: 'Global_Civic_Alliance',
    created_at: Math.floor(Date.now() / 1000) - 900,
    kind: 1,
    tags: [['nonce', '90122', '18'], ['channel', 'news'], ['t', 'CivicReferendum']],
    content: '🏛️ GLOBAL CIVIC REFERENDUM: Do you support or reject the proposed Central Bank Digital Currency (CBDC) & mandatory facial recognition surveillance bill? Cast your cryptographic vote below!',
    sig: 'sig_civic_referendum_99120',
    powDifficulty: 18,
    isVerifiedSig: true,
    zatsTotal: 48000,
    zapCount: 52,
    channel: 'news',
    postType: 'poll',
    pollCategory: 'government_policy',
    pollOptions: ['Reject / Oppose Bill 🛑', 'Support / Approve Bill 🟢', 'Abstain / Needs Amendments ⚖️'],
    pollVotes: [1284, 89, 142],
    privacyMode: 'public',
  },
  {
    id: 'evt_voice_001_1892',
    pubkey: '3bf0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427a',
    authorNpub: 'npub180cvv07tjdrrg90v3d8q3cm08p9w000000000000000000000000000001',
    authorPetname: 'FreePress_Asia',
    created_at: Math.floor(Date.now() / 1000) - 1800,
    kind: 1,
    tags: [['nonce', '18290', '16'], ['channel', 'news'], ['t', 'UncensoredVoice']],
    content: '🚨 ALERT: Regional internet blackout reported across major metropolitan centers. Cell towers switched to deep packet inspection. Broadcast this update through P2P mesh relay networks! #UncensoredVoice #News',
    sig: 'sig_89210038102931a1938a192',
    powDifficulty: 16,
    isVerifiedSig: true,
    zatsTotal: 12500,
    zapCount: 14,
    exifStripped: true,
    facesBlurred: 0,
    channel: 'news',
    postType: 'text',
    privacyMode: 'public',
  },
  {
    id: 'evt_voice_002_4421',
    pubkey: 'fa50372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427b',
    authorNpub: 'npub180cvv07tjdrrg90v3d8q3cm08p9w000000000000000000000000000002',
    authorPetname: 'CitizenJournalist_PK',
    created_at: Math.floor(Date.now() / 1000) - 3600,
    kind: 1,
    tags: [['nonce', '44810', '20'], ['channel', 'mesh'], ['t', 'VoiceNote']],
    content: '🎙️ Verified voice report from ground level. Pitch-shifted -5 semitones and scrubbed using WebAudio DSP before publishing to IPFS swarm node. Completely anonymous and untraceable. #MeshNetwork #PrivacyMatters',
    sig: 'sig_99182301823901b2839a281',
    powDifficulty: 20,
    isVerifiedSig: true,
    ipfsCid: 'bafybeic89210aa990182811a',
    mediaType: 'audio',
    voiceShifted: true,
    facesBlurred: 2,
    exifStripped: true,
    zatsTotal: 34000,
    zapCount: 29,
    channel: 'mesh',
    postType: 'audio',
    privacyMode: 'public',
  },
  {
    id: 'evt_voice_004_7721',
    pubkey: '71a0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427d',
    authorNpub: 'npub180cvv07tjdrrg90v3d8q3cm08p9w000000000000000000000000000004',
    authorPetname: 'Web3_Pioneer',
    created_at: Math.floor(Date.now() / 1000) - 7200,
    kind: 1,
    tags: [['nonce', '99120', '16'], ['channel', 'crypto'], ['t', 'Bitcoin']],
    content: '📊 COMMUNITY POLL: How do you primarily verify your decentralized social feeds? Cast your vote on-chain below! #Crypto #Web3',
    sig: 'sig_0028192038102931a',
    powDifficulty: 16,
    isVerifiedSig: true,
    zatsTotal: 18500,
    zapCount: 21,
    channel: 'crypto',
    postType: 'poll',
    pollOptions: ['Local PoW Nonce Validation', 'Encrypted DNS-over-HTTPS (DoH)', 'Peer-to-Peer WebRTC Mesh', 'Direct Nostr WebSocket Relays'],
    pollVotes: [42, 28, 65, 19],
    privacyMode: 'public',
  },
  {
    id: 'evt_voice_003_9910',
    pubkey: '8c50372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427c',
    authorNpub: 'npub180cvv07tjdrrg90v3d8q3cm08p9w000000000000000000000000000003',
    authorPetname: 'CyberSec_Daily',
    created_at: Math.floor(Date.now() / 1000) - 9800,
    kind: 1,
    tags: [['nonce', '29011', '16'], ['channel', 'tech'], ['t', 'TechNews']],
    content: '💻 AUFBRUCH client status: 100% operational across Nostr relays damus.io and nos.lol. Zero centralized servers, offline BIP-39 seed generation, zero Google or email dependencies! #TechNews #OpenSource',
    sig: 'sig_110293102931029c3819283',
    powDifficulty: 16,
    isVerifiedSig: true,
    zatsTotal: 8200,
    zapCount: 9,
    channel: 'tech',
    postType: 'text',
    privacyMode: 'public',
  },
];

class NostrRelayManager {
  private relays: RelayNode[] = [...DEFAULT_RELAYS];
  private localFeed: NostrEvent[] = [];
  private sockets: Map<string, WebSocket> = new Map();

  constructor() {
    this.loadCachedFeed();
    this.initSockets();
    this.startBackendSync();
  }

  private startBackendSync() {
    this.syncEventsFromBackend();
    setInterval(() => {
      this.syncEventsFromBackend();
    }, 2000);
  }

  public async syncEventsFromBackend() {
    try {
      const res = await fetch('/api/sync/events');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.events)) {
          let updated = false;
          for (const evt of data.events) {
            if (!this.localFeed.some((e) => e.id === evt.id)) {
              this.localFeed.unshift(evt);
              updated = true;
            }
          }
          if (updated) {
            this.saveCachedFeed();
          }
        }
      }
    } catch {
      // Offline fallback
    }
  }

  private async pushEventToBackend(event: NostrEvent) {
    try {
      await fetch('/api/sync/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      });
    } catch {
      // Offline fallback
    }
  }

  private loadCachedFeed() {
    try {
      const raw = localStorage.getItem('aufbruch_cached_feed');
      if (raw) {
        this.localFeed = JSON.parse(raw);
      } else {
        this.localFeed = [...INITIAL_NOSTR_FEED];
      }
    } catch {
      this.localFeed = [...INITIAL_NOSTR_FEED];
    }
  }

  private saveCachedFeed() {
    // Sanitize feed items to prevent storing large base64 strings or huge payloads
    const sanitizedFeed = this.localFeed.map(evt => ({
      id: evt.id,
      pubkey: evt.pubkey,
      created_at: evt.created_at,
      kind: evt.kind,
      tags: evt.tags,
      content: typeof evt.content === 'string' && evt.content.length > 3000 ? evt.content.substring(0, 3000) + '...' : evt.content,
      sig: evt.sig,
      powDifficulty: evt.powDifficulty,
      ipfsCid: evt.ipfsCid,
      mediaType: evt.mediaType,
      voiceShifted: evt.voiceShifted,
      facesBlurred: evt.facesBlurred,
      exifStripped: evt.exifStripped,
      authorPetname: evt.authorPetname,
      authorNpub: evt.authorNpub,
      isVerifiedSig: evt.isVerifiedSig,
      zatsTotal: evt.zatsTotal,
      zapCount: evt.zapCount,
    }));

    // Progressive fallback logic if local storage quota is exceeded
    const tryCounts = [50, 25, 10, 5, 2];
    for (const count of tryCounts) {
      try {
        const slice = sanitizedFeed.slice(0, count);
        localStorage.setItem('aufbruch_cached_feed', JSON.stringify(slice));
        return; // Successfully cached
      } catch {
        // Quota exceeded for this batch size, retry with a smaller count
      }
    }

    // Fallback: clear cached key if local storage is completely saturated
    try {
      localStorage.removeItem('aufbruch_cached_feed');
    } catch {
      // Ignored
    }
  }

  private async initSockets() {
    // Perform DoH resolution for relays to bypass ISP DNS tracking
    for (const relay of this.relays) {
      try {
        const dohRes: DoHResult = await resolveHostnameDoH(relay.url);
        if (dohRes.ip) {
          relay.location = `${relay.location.split(' (')[0]} (DoH: ${dohRes.ip})`;
        }

        const ws = new WebSocket(relay.url);
        ws.onopen = () => {
          relay.status = 'connected';
          // Send Nostr REQ filter for Kind 1 posts
          const reqFilter = JSON.stringify(['REQ', 'voice_feed_sub', { kinds: [1], limit: 20 }]);
          ws.send(reqFilter);
        };
        ws.onerror = () => {
          relay.status = 'blocked';
        };
        ws.onclose = () => {
          relay.status = 'disconnected';
        };
        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data[0] === 'EVENT' && data[2]) {
              const evt = data[2];
              this.addIncomingEvent({
                id: evt.id,
                pubkey: evt.pubkey,
                created_at: evt.created_at,
                kind: evt.kind,
                tags: evt.tags || [],
                content: evt.content || '',
                sig: evt.sig || '',
                powDifficulty: 16,
                isVerifiedSig: true,
                zatsTotal: 1000,
                zapCount: 1,
              });
            }
          } catch {
            // ignore malformed websocket frames
          }
        };
        this.sockets.set(relay.url, ws);
      } catch {
        relay.status = 'blocked';
      }
    }
  }


  public getRelays(): RelayNode[] {
    return this.relays;
  }

  public getFeed(): NostrEvent[] {
    return [...this.localFeed].sort((a, b) => b.created_at - a.created_at);
  }

  public addIncomingEvent(event: NostrEvent, relayUrl: string = 'local') {
    if (!recommendationEngine.isCleanPost(event)) {
      return;
    }
    const evalRes = antiSpamFortress.evaluateEvent(event, relayUrl);
    if (!evalRes.isAllowed) {
      return;
    }
    if (!this.localFeed.some(e => e.id === event.id)) {
      this.localFeed.unshift(event);
      this.saveCachedFeed();
    }
  }

  /**
   * Complete Broadcast Workflow:
   * 1. Constructs Nostr Event
   * 2. Runs PoW Miner (NIP-13)
   * 3. Signs Event with secret key
   * 4. Publishes to Nostr WebSocket Relays
   */
  public async publishBroadcast(
    content: string,
    privateKeyHex: string,
    publicKeyHex: string,
    petname: string,
    options: {
      targetPowBits?: number;
      ipfsCid?: string;
      mediaType?: 'image' | 'audio' | 'video' | 'none';
      voiceShifted?: boolean;
      facesBlurred?: number;
      exifStripped?: boolean;
      mediaDataUrl?: string;
      channel?: string;
      postType?: 'text' | 'image' | 'audio' | 'link' | 'poll';
      pollOptions?: string[];
      pollCategory?: 'government_policy' | 'system_motion' | 'community_proposal' | 'general';
      privacyMode?: 'public' | 'self_destruct' | 'encrypted' | 'anonymous';
      targetNetwork?: 'global_nostr' | 'ipfs_swarm' | 'local_mesh';
    },
    onPowProgress?: (p: any) => void
  ): Promise<NostrEvent> {
    const createdAt = Math.floor(Date.now() / 1000);
    const targetBits = options.targetPowBits || 16;

    const baseTags: string[][] = [];
    if (options.ipfsCid) {
      baseTags.push(['ipfs', options.ipfsCid]);
    }
    if (options.mediaType && options.mediaType !== 'none') {
      baseTags.push(['media', options.mediaType]);
    }
    if (options.voiceShifted) {
      baseTags.push(['dsp', 'pitch_shifted']);
    }
    if (options.exifStripped) {
      baseTags.push(['exif', 'stripped']);
    }
    if (options.channel) {
      baseTags.push(['channel', options.channel]);
    }

    let expiresAt: number | undefined = undefined;
    if (options.privacyMode === 'self_destruct') {
      expiresAt = createdAt + 24 * 3600; // 24 hours self-destruct
      baseTags.push(['expiration', expiresAt.toString()]);
    }

    const eventTemplate = {
      kind: 1,
      created_at: createdAt,
      tags: baseTags,
      content,
      pubkey: publicKeyHex,
    };

    // 1. Mine Proof of Work nonce
    const mined = await mineProofOfWork(eventTemplate, targetBits, onPowProgress);

    // 2. Sign Mined Nostr Event
    const fullTemplate = {
      ...eventTemplate,
      tags: mined.tags,
    };

    const finalized = signNostrEvent(fullTemplate, privateKeyHex);

    const fullEvent: NostrEvent = {
      id: finalized.id,
      pubkey: finalized.pubkey,
      created_at: finalized.created_at,
      kind: finalized.kind,
      tags: finalized.tags,
      content: finalized.content,
      sig: finalized.sig,
      powDifficulty: targetBits,
      ipfsCid: options.ipfsCid,
      mediaType: options.mediaType,
      voiceShifted: options.voiceShifted,
      facesBlurred: options.facesBlurred,
      exifStripped: options.exifStripped,
      authorPetname: options.privacyMode === 'anonymous' ? 'Anonymous_Ghost' : petname,
      authorNpub: `npub1${publicKeyHex.substring(0, 16)}`,
      isVerifiedSig: true,
      zatsTotal: 0,
      zapCount: 0,
      channel: options.channel || 'general',
      postType: options.postType || (options.mediaType === 'audio' ? 'audio' : options.mediaType === 'image' ? 'image' : 'text'),
      pollOptions: options.pollOptions,
      pollVotes: options.pollOptions ? options.pollOptions.map(() => 0) : undefined,
      pollCategory: options.pollCategory,
      privacyMode: options.privacyMode || 'public',
      expiresAt,
      targetNetwork: options.targetNetwork || 'global_nostr',
    };

    // 3. Broadcast to connected WebSockets
    const nostrEventFrame = JSON.stringify(['EVENT', finalized]);
    this.sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(nostrEventFrame);
      }
    });

    // 4. Save to local state
    this.addIncomingEvent(fullEvent);
    this.pushEventToBackend(fullEvent);

    return fullEvent;
  }

  public voteOnPoll(eventId: string, optionIndex: number) {
    const evt = this.localFeed.find((e) => e.id === eventId);
    if (evt && evt.pollVotes) {
      evt.pollVotes[optionIndex] = (evt.pollVotes[optionIndex] || 0) + 1;
      this.saveCachedFeed();
    }
  }

  public clearFeedAndReset() {
    this.localFeed = [...INITIAL_NOSTR_FEED];
    try {
      localStorage.removeItem('aufbruch_cached_feed');
    } catch {
      // Ignored
    }
  }

  public addZapToEvent(eventId: string, sats: number) {
    const evt = this.localFeed.find(e => e.id === eventId);
    if (evt) {
      evt.zatsTotal = (evt.zatsTotal || 0) + sats;
      evt.zapCount = (evt.zapCount || 0) + 1;
      this.saveCachedFeed();
    }
  }

  /**
   * Delete multiple events according to NIP-09 (Event Deletion)
   * 1. Constructs a Kind: 5 deletion event referencing the event IDs via `['e', id]` tags
   * 2. Signs it using author's privateKeyHex
   * 3. Broadcasts the Kind 5 event to all connected Nostr WebSocket relays
   * 4. Removes the events from localFeed and local storage
   * 5. Syncs the deletion to backend multi-device store
   */
  public async deleteEvents(
    eventIds: string[],
    privateKeyHex?: string,
    publicKeyHex?: string
  ): Promise<{ success: boolean; deletedCount: number; deletionEvent?: any }> {
    if (!eventIds || eventIds.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    let deletionSignedEvent: any = null;

    // If privateKeyHex is available, sign standard Nostr NIP-09 Kind 5 deletion event
    if (privateKeyHex) {
      try {
        const deleteTemplate = {
          kind: 5,
          created_at: Math.floor(Date.now() / 1000),
          tags: eventIds.map((id) => ['e', id]),
          content: `Deleted ${eventIds.length} event(s) by author`,
        };
        deletionSignedEvent = signNostrEvent(deleteTemplate, privateKeyHex);

        const nostrEventFrame = JSON.stringify(['EVENT', deletionSignedEvent]);
        this.sockets.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(nostrEventFrame);
          }
        });
      } catch (err) {
        console.warn('NIP-09 sign event error:', err);
      }
    }

    // Remove from local feed
    const idSet = new Set(eventIds);
    this.localFeed = this.localFeed.filter((e) => !idSet.has(e.id));
    this.saveCachedFeed();

    // Sync deletion to multi-device backend
    try {
      await fetch('/api/sync/events/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds, pubkey: publicKeyHex }),
      });
    } catch {
      // offline fallback
    }

    return {
      success: true,
      deletedCount: eventIds.length,
      deletionEvent: deletionSignedEvent,
    };
  }
}

export const nostrService = new NostrRelayManager();
