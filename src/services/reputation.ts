/**
 * Local Non-Centralized Web of Trust (WoT) & Reputation Engine
 * 
 * Evaluates creator reputation and computes spam probability purely on client-side
 * social graph distance, direct vouches (Kind 3 / Kind 30000 Nostr events), and
 * local mute lists without relying on central moderation servers.
 */

import { NostrEvent } from '../types';

export type TrustLevel = 'trusted_direct' | 'trusted_extended' | 'neutral' | 'suspicious' | 'muted';

export interface ReputationScore {
  pubkey: string;
  trustScore: number; // 0 to 100
  distance: number; // 1 = direct, 2 = 2nd degree, 3 = 3rd degree, Infinity = unconnected
  spamProbability: number; // 0% to 100%
  trustLevel: TrustLevel;
  directVouches: number;
  isMuted: boolean;
  reason: string;
}

const STORAGE_KEY_TRUST = 'aufbruch_wot_trust_v1';
const STORAGE_KEY_MUTE = 'aufbruch_wot_mute_v1';

class WebOfTrustService {
  private directTrustMap: Map<string, { petname?: string; addedAt: number }> = new Map();
  private extendedTrustMap: Map<string, Set<string>> = new Map(); // pubkey -> set of pubkeys it trusts
  private muteSet: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedTrust = localStorage.getItem(STORAGE_KEY_TRUST);
      if (storedTrust) {
        const parsed = JSON.parse(storedTrust);
        Object.entries(parsed).forEach(([k, v]: [string, any]) => {
          this.directTrustMap.set(k, v);
        });
      } else {
        // Pre-seed default trusted news / free-press nodes for bootstrap
        this.directTrustMap.set('3bf0372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427a', { petname: 'FreePress_Asia', addedAt: Date.now() });
        this.directTrustMap.set('fa50372b5d2e2c011e0c83a5efb28eb92040510526e0e37a28e833f677d2427b', { petname: 'CitizenJournalist_PK', addedAt: Date.now() });
      }

      const storedMute = localStorage.getItem(STORAGE_KEY_MUTE);
      if (storedMute) {
        const parsed = JSON.parse(storedMute);
        if (Array.isArray(parsed)) {
          parsed.forEach(p => this.muteSet.add(p));
        }
      }
    } catch (e) {
      console.warn('[WoT] Failed to restore Web of Trust cache:', e);
    }
  }

  private saveToStorage() {
    try {
      const trustObj: Record<string, any> = {};
      this.directTrustMap.forEach((val, key) => {
        trustObj[key] = val;
      });
      localStorage.setItem(STORAGE_KEY_TRUST, JSON.stringify(trustObj));
      localStorage.setItem(STORAGE_KEY_MUTE, JSON.stringify(Array.from(this.muteSet)));
      this.notifyListeners();
    } catch (e) {
      console.warn('[WoT] Failed to save Web of Trust state:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn());
  }

  /**
   * Adds a direct trust relationship (Distance 1)
   */
  public addDirectTrust(pubkey: string, petname?: string) {
    this.directTrustMap.set(pubkey, { petname, addedAt: Date.now() });
    this.muteSet.delete(pubkey);
    this.saveToStorage();
  }

  /**
   * Removes a direct trust relationship
   */
  public removeDirectTrust(pubkey: string) {
    this.directTrustMap.delete(pubkey);
    this.saveToStorage();
  }

  /**
   * Mutes a peer locally (Spam probability 100%)
   */
  public muteAuthor(pubkey: string) {
    this.muteSet.add(pubkey);
    this.directTrustMap.delete(pubkey);
    this.saveToStorage();
  }

  /**
   * Unmutes a peer
   */
  public unmuteAuthor(pubkey: string) {
    this.muteSet.delete(pubkey);
    this.saveToStorage();
  }

  /**
   * Ingests a Nostr follow / trust list (Kind 3 or Kind 30000) event to update extended WoT
   */
  public processNostrTrustEvent(event: NostrEvent) {
    if (event.kind === 3 || event.kind === 30000) {
      const trustedPeers = new Set<string>();
      event.tags.forEach(tag => {
        if (tag[0] === 'p' && tag[1]) {
          trustedPeers.add(tag[1]);
        }
      });
      this.extendedTrustMap.set(event.pubkey, trustedPeers);
      this.notifyListeners();
    }
  }

  /**
   * Computes the Web of Trust score & spam probability for a given public key
   */
  public getReputation(pubkey: string, eventPoW: number = 0): ReputationScore {
    // 1. Muted check
    if (this.muteSet.has(pubkey)) {
      return {
        pubkey,
        trustScore: 0,
        distance: Infinity,
        spamProbability: 100,
        trustLevel: 'muted',
        directVouches: 0,
        isMuted: true,
        reason: 'Explicitly muted by local user blocklist'
      };
    }

    // 2. Direct Trust (Distance 1)
    if (this.directTrustMap.has(pubkey)) {
      return {
        pubkey,
        trustScore: 98,
        distance: 1,
        spamProbability: 0,
        trustLevel: 'trusted_direct',
        directVouches: 1,
        isMuted: false,
        reason: 'Directly trusted peer in your WoT list'
      };
    }

    // 3. Extended 2nd Degree Trust (Vouched by your direct trusted peers)
    let directVouches = 0;
    this.directTrustMap.forEach((_, trustedPubkey) => {
      const peersOfTrusted = this.extendedTrustMap.get(trustedPubkey);
      if (peersOfTrusted && peersOfTrusted.has(pubkey)) {
        directVouches++;
      }
    });

    if (directVouches > 0) {
      const trustScore = Math.min(92, 70 + directVouches * 8);
      const spamProb = Math.max(2, 20 - directVouches * 5);
      return {
        pubkey,
        trustScore,
        distance: 2,
        spamProbability: spamProb,
        trustLevel: 'trusted_extended',
        directVouches,
        isMuted: false,
        reason: `Vouched by ${directVouches} peer(s) in your direct network`
      };
    }

    // 4. Extended 3rd Degree Trust
    let thirdDegreeVouches = 0;
    this.extendedTrustMap.forEach((secondDegreePeers) => {
      if (secondDegreePeers.has(pubkey)) {
        thirdDegreeVouches++;
      }
    });

    if (thirdDegreeVouches > 0) {
      return {
        pubkey,
        trustScore: 65,
        distance: 3,
        spamProbability: 15,
        trustLevel: 'neutral',
        directVouches: 0,
        isMuted: false,
        reason: '3rd-degree social graph match'
      };
    }

    // 5. Unconnected Peer - Heuristic scoring based on Proof-of-Work (PoW) difficulty
    // Higher PoW difficulty reduces spam probability significantly
    let baseSpamProb = 65;
    let baseTrustScore = 35;

    if (eventPoW >= 20) {
      baseSpamProb = 10;
      baseTrustScore = 80;
    } else if (eventPoW >= 12) {
      baseSpamProb = 25;
      baseTrustScore = 60;
    } else if (eventPoW >= 8) {
      baseSpamProb = 40;
      baseTrustScore = 50;
    }

    return {
      pubkey,
      trustScore: baseTrustScore,
      distance: Infinity,
      spamProbability: baseSpamProb,
      trustLevel: baseSpamProb > 50 ? 'suspicious' : 'neutral',
      directVouches: 0,
      isMuted: false,
      reason: eventPoW > 0 
        ? `Unconnected peer (${eventPoW}-bit PoW spam resistance filter applied)`
        : 'Unconnected peer without social vouch or Proof of Work'
    };
  }

  /**
   * Evaluates whether an event should be filtered as spam
   */
  public isSpam(pubkey: string, eventPoW: number = 0): boolean {
    const rep = this.getReputation(pubkey, eventPoW);
    return rep.spamProbability > 60 || rep.isMuted;
  }

  public getDirectTrustMap() {
    return this.directTrustMap;
  }

  public getMuteSet() {
    return this.muteSet;
  }

  public exportTrustGraphJson(): string {
    const trustObj: Record<string, any> = {};
    this.directTrustMap.forEach((v, k) => { trustObj[k] = v; });
    return JSON.stringify({
      directTrust: trustObj,
      mutes: Array.from(this.muteSet),
      timestamp: Date.now()
    }, null, 2);
  }

  public importTrustGraphJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.directTrust && typeof data.directTrust === 'object') {
        Object.entries(data.directTrust).forEach(([k, v]: [string, any]) => {
          this.directTrustMap.set(k, v);
        });
      }
      if (Array.isArray(data.mutes)) {
        data.mutes.forEach((p: string) => this.muteSet.add(p));
      }
      this.saveToStorage();
      return true;
    } catch (e) {
      console.warn('[WoT] Failed to import trust graph JSON:', e);
      return false;
    }
  }
}

export const webOfTrustService = new WebOfTrustService();
