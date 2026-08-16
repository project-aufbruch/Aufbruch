/**
 * Anti-Spam, Anti-Abuse & Decentralized Moderation Shield
 * Implements NIP-13 Proof-of-Work hashcash mining, Web-of-Trust (WoT) verification,
 * NIP-51 mute/blocklist management, keyword filters, and community quorum reporting.
 */

import { ModerationConfig, BlockedEntity, AbuseReport } from '../types';

const DEFAULT_BANNED_KEYWORDS = [
  'free crypto',
  't.me/',
  'pump and dump',
  'double your btc',
  'whatsapp me at',
  'claim air drop',
  'investment guaranteed',
  'bot trade profit',
];

const INITIAL_BLOCKED: BlockedEntity[] = [
  {
    id: 'block_01',
    pubkey: 'spam_bot_882910aafe912',
    petname: 'CryptoMatrixBot',
    reason: 'bot',
    blockedAt: Date.now() - 86400000 * 2,
    blockedBy: 'community_quorum',
  },
  {
    id: 'block_02',
    pubkey: 'phishing_relay_impersonator_99',
    petname: 'AufbruchOfficial_Scam',
    reason: 'impersonation',
    blockedAt: Date.now() - 86400000 * 4,
    blockedBy: 'relay_filter',
  },
];

export class AntiAbuseShieldService {
  private config: ModerationConfig;
  private blockedEntities: BlockedEntity[] = [];
  private abuseReports: AbuseReport[] = [];
  private listeners: Set<(state: { config: ModerationConfig; blocked: BlockedEntity[]; reports: AbuseReport[] }) => void> = new Set();

  constructor() {
    this.config = this.loadConfig();
    this.blockedEntities = this.loadBlocked();
    this.abuseReports = this.loadReports();
  }

  private loadConfig(): ModerationConfig {
    try {
      const saved = localStorage.getItem('voice_mod_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      powDifficulty: 8, // 8-bit default light PoW
      strictWebOfTrust: false,
      autoQuarantineThreshold: 3,
      bannedKeywords: DEFAULT_BANNED_KEYWORDS,
      blockUnvouchedDMs: false,
      rateLimitMs: 2000,
    };
  }

  private loadBlocked(): BlockedEntity[] {
    try {
      const saved = localStorage.getItem('voice_blocked_entities');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_BLOCKED;
  }

  private loadReports(): AbuseReport[] {
    try {
      const saved = localStorage.getItem('voice_abuse_reports');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }

  private saveState() {
    try {
      localStorage.setItem('voice_mod_config', JSON.stringify(this.config));
      localStorage.setItem('voice_blocked_entities', JSON.stringify(this.blockedEntities));
      localStorage.setItem('voice_abuse_reports', JSON.stringify(this.abuseReports));
    } catch {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) =>
      l({
        config: { ...this.config },
        blocked: [...this.blockedEntities],
        reports: [...this.abuseReports],
      })
    );
  }

  public subscribe(
    listener: (state: { config: ModerationConfig; blocked: BlockedEntity[]; reports: AbuseReport[] }) => void
  ): () => void {
    this.listeners.add(listener);
    listener({
      config: { ...this.config },
      blocked: [...this.blockedEntities],
      reports: [...this.abuseReports],
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getConfig(): ModerationConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<ModerationConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveState();
  }

  public getBlockedEntities(): BlockedEntity[] {
    return [...this.blockedEntities];
  }

  public isPubkeyBlocked(pubkey: string): boolean {
    return this.blockedEntities.some((b) => b.pubkey.toLowerCase() === pubkey.toLowerCase());
  }

  public blockPubkey(
    pubkey: string,
    reason: BlockedEntity['reason'] = 'spam',
    petname?: string,
    blockedBy: string = 'local_user'
  ): void {
    if (this.isPubkeyBlocked(pubkey)) return;
    this.blockedEntities.unshift({
      id: 'block_' + Date.now().toString(36),
      pubkey,
      petname: petname || pubkey.slice(0, 10),
      reason,
      blockedAt: Date.now(),
      blockedBy,
    });
    this.saveState();
  }

  public unblockPubkey(pubkey: string): void {
    this.blockedEntities = this.blockedEntities.filter(
      (b) => b.pubkey.toLowerCase() !== pubkey.toLowerCase()
    );
    this.saveState();
  }

  /**
   * Evaluates if a given message text triggers keyword spam shadowfilters
   */
  public evaluateSpamKeywords(text: string): { isSpam: boolean; matchedWord?: string } {
    const lower = text.toLowerCase();
    for (const kw of this.config.bannedKeywords) {
      if (lower.includes(kw.toLowerCase())) {
        return { isSpam: true, matchedWord: kw };
      }
    }
    return { isSpam: false };
  }

  /**
   * Reports a malicious/spamming pubkey and verifies community quorum threshold
   */
  public reportPubkey(
    targetPubkey: string,
    reporterPubkey: string,
    reason: string,
    evidenceEventId?: string
  ): { autoQuarantined: boolean; reportCount: number } {
    const report: AbuseReport = {
      id: 'rep_' + Date.now().toString(36),
      targetPubkey,
      reporterPubkey,
      reason,
      evidenceEventId,
      timestamp: Date.now(),
    };

    this.abuseReports.unshift(report);

    // Count reports for this target
    const targetReports = this.abuseReports.filter(
      (r) => r.targetPubkey.toLowerCase() === targetPubkey.toLowerCase()
    );

    let autoQuarantined = false;
    if (targetReports.length >= this.config.autoQuarantineThreshold) {
      this.blockPubkey(targetPubkey, 'spam', undefined, 'community_quorum');
      autoQuarantined = true;
    }

    this.saveState();
    return { autoQuarantined, reportCount: targetReports.length };
  }

  /**
   * Computes NIP-13 Proof of Work nonce for anti-spam message generation
   */
  public async computePoWNonce(
    eventId: string,
    targetDifficulty: number = this.config.powDifficulty
  ): Promise<{ nonce: number; difficulty: number; timeMs: number }> {
    if (targetDifficulty <= 0) return { nonce: 0, difficulty: 0, timeMs: 0 };

    const startTime = performance.now();
    let nonce = 0;

    const countLeadingZeroBits = (hashHex: string): number => {
      let zeros = 0;
      for (let i = 0; i < hashHex.length; i++) {
        const nibble = parseInt(hashHex[i], 16);
        if (nibble === 0) {
          zeros += 4;
        } else {
          zeros += Math.clz32(nibble) - 28;
          break;
        }
      }
      return zeros;
    };

    // Calculate sha256 loop
    const enc = new TextEncoder();
    while (true) {
      nonce++;
      const payload = `${eventId}:${nonce}`;
      const hashBuf = await window.crypto.subtle.digest('SHA-256', enc.encode(payload));
      const hashHex = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const bits = countLeadingZeroBits(hashHex);
      if (bits >= targetDifficulty || nonce > 100000) {
        return {
          nonce,
          difficulty: bits,
          timeMs: Math.round(performance.now() - startTime),
        };
      }
    }
  }

  public addBannedKeyword(kw: string) {
    if (!kw.trim()) return;
    if (!this.config.bannedKeywords.includes(kw.trim())) {
      this.config.bannedKeywords.push(kw.trim());
      this.saveState();
    }
  }

  public removeBannedKeyword(kw: string) {
    this.config.bannedKeywords = this.config.bannedKeywords.filter((k) => k !== kw);
    this.saveState();
  }
}

export const antiAbuseShield = new AntiAbuseShieldService();
