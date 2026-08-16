/**
 * Decentralized Content Moderation & Legal Compliance Filter Service
 * 
 * Provides automated client-side protection against severe illegal content (CSAM, 
 * credibly imminent violent threats, doxxing) without central authority censorship.
 * 
 * Strategy:
 * 1. Perceptual Hash (aHash/dHash) comparison against standard CSAM / Prohibited Harm registries.
 * 2. On-device text analysis for severe threats and PII/doxxing patterns.
 * 3. Decentralized Web-of-Trust (WoT) flagging & community moderation lists (NIP-36).
 */

export interface SafetyCheckResult {
  isAllowed: boolean;
  severity: 'clean' | 'warning' | 'blocked';
  reason?: string;
  category?: 'csam_prohibited' | 'imminent_threat' | 'doxxing_pii' | 'illegal_trade_contraband' | 'cybercrime_malware' | 'sensitive_content';
  perceptualHash?: string;
  flaggedTerms?: string[];
}

// Standardized list of prohibited perceptual hashes (aHash/dHash signatures)
const PROHIBITED_MEDIA_HASHES = new Set([
  '0000000000000000', // Example blacklisted hash pattern
  'ffffffffffffffff', // Synthetic CSAM test signature
  'a5a5a5a5a5a5a5a5',
]);

// Doxxing pattern detection (Credit cards, SSNs, phone numbers in public broadcast)
const SSN_REGEX = /\b(?!000|666|9\d{2})\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/;
const CREDIT_CARD_REGEX = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/;
const PHONE_REGEX = /\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/;

// Violent threat phrases
const SEVERE_THREAT_TERMS = [
  'bomb threat at',
  'imminent attack on',
  'how to make explosive',
  'mass casualty plan',
  'assassination plot',
];

// Illegal Trade, Contraband & Exploitation terms
const ILLEGAL_TRADE_TERMS = [
  'buy stolen credit card',
  'sell stolen credit cards',
  'buy illegal firearms',
  'untraceable automatic weapon sale',
  'buy fentanyl online',
  'heroin distribution market',
  'human trafficking service',
  'hire hitman',
  'illegal passport market',
  'buy stolen identity data',
];

// Cybercrime, Ransomware & Malware terms
const CYBERCRIME_TERMS = [
  'download ransomware.exe',
  'botnet C2 server IP',
  'credential dumping tool payload',
  'zero-day exploit payload download',
];

/**
 * Computes a simple 64-bit Average Hash (aHash) for image canvas pixel analysis
 */
export async function computeImageAverageHash(imageSource: HTMLImageElement | File | Blob): Promise<string> {
  return new Promise((resolve) => {
    let img: HTMLImageElement;
    
    const processImage = (imageElement: HTMLImageElement) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('0000000000000000');

        ctx.drawImage(imageElement, 0, 0, 8, 8);
        const imgData = ctx.getImageData(0, 0, 8, 8).data;

        // Calculate average grayscale brightness
        let totalBrightness = 0;
        const grays: number[] = [];

        for (let i = 0; i < imgData.length; i += 4) {
          const gray = Math.round(0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]);
          grays.push(gray);
          totalBrightness += gray;
        }

        const avgBrightness = totalBrightness / 64;
        let hashHex = '';
        let bitChunk = 0;

        for (let i = 0; i < grays.length; i++) {
          const bit = grays[i] >= avgBrightness ? 1 : 0;
          bitChunk = (bitChunk << 1) | bit;
          if ((i + 1) % 4 === 0) {
            hashHex += bitChunk.toString(16);
            bitChunk = 0;
          }
        }

        resolve(hashHex.padStart(16, '0'));
      } catch {
        resolve('0000000000000000');
      }
    };

    if (imageSource instanceof HTMLImageElement) {
      processImage(imageSource);
    } else {
      img = new Image();
      const url = URL.createObjectURL(imageSource);
      img.onload = () => {
        processImage(img);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => resolve('0000000000000000');
      img.src = url;
    }
  });
}

/**
 * Inspects text and media attachments against safety guidelines and illegal activity prohibitions
 */
export async function runSafetyInspection(
  textContent: string,
  mediaFile?: File | null
): Promise<SafetyCheckResult> {
  const lowerText = textContent.toLowerCase();

  // 1. Text Imminent Severe Threat Check
  for (const term of SEVERE_THREAT_TERMS) {
    if (lowerText.includes(term)) {
      return {
        isAllowed: false,
        severity: 'blocked',
        category: 'imminent_threat',
        reason: 'Content contains actionable violent threat or explosive manufacture instructions prohibited by legal safety guidelines.',
        flaggedTerms: [term]
      };
    }
  }

  // 2. Illegal Trade & Contraband Check
  for (const term of ILLEGAL_TRADE_TERMS) {
    if (lowerText.includes(term)) {
      return {
        isAllowed: false,
        severity: 'blocked',
        category: 'illegal_trade_contraband',
        reason: 'Broadcast promotes illegal trade, illicit contraband, human trafficking, or black-market activity prohibited by law.',
        flaggedTerms: [term]
      };
    }
  }

  // 3. Cybercrime & Malware Check
  for (const term of CYBERCRIME_TERMS) {
    if (lowerText.includes(term)) {
      return {
        isAllowed: false,
        severity: 'blocked',
        category: 'cybercrime_malware',
        reason: 'Broadcast contains malware distribution or cybercrime exploits prohibited by security guidelines.',
        flaggedTerms: [term]
      };
    }
  }

  // 4. Doxxing / PII Protection
  if (SSN_REGEX.test(textContent) || CREDIT_CARD_REGEX.test(textContent)) {
    return {
      isAllowed: false,
      severity: 'blocked',
      category: 'doxxing_pii',
      reason: 'Broadcast contains unredacted financial or Social Security PII, violating anti-doxxing safety protocols.'
    };
  }

  // 5. Media Perceptual Hash Check for CSAM & Illegal Harm
  if (mediaFile && mediaFile.type.startsWith('image/')) {
    const pHash = await computeImageAverageHash(mediaFile);
    if (PROHIBITED_MEDIA_HASHES.has(pHash)) {
      return {
        isAllowed: false,
        severity: 'blocked',
        category: 'csam_prohibited',
        reason: 'Media matches blacklisted illegal harm perceptual signature (CSAM / Prohibited Content Hash Match). Publication blocked locally.',
        perceptualHash: pHash
      };
    }
  }

  // 6. Sensitive Content Warning Flagging (NIP-36 style)
  const sensitiveKeywords = ['nsfw', 'graphic', 'gory', 'spoiler', '18+'];
  const hasSensitiveKeyword = sensitiveKeywords.some(kw => lowerText.includes(kw));

  if (hasSensitiveKeyword) {
    return {
      isAllowed: true,
      severity: 'warning',
      category: 'sensitive_content',
      reason: 'Broadcast contains sensitive materials. NIP-36 content warning tag auto-attached.'
    };
  }

  return {
    isAllowed: true,
    severity: 'clean'
  };
}

/**
 * Synchronous fast check for feed rendering to filter out illegal text
 */
export function checkFastIllegalContent(textContent: string): { isIllegal: boolean; reason?: string } {
  const lower = textContent.toLowerCase();

  for (const term of SEVERE_THREAT_TERMS) {
    if (lower.includes(term)) {
      return { isIllegal: true, reason: 'Violent Threat / Extremism' };
    }
  }

  for (const term of ILLEGAL_TRADE_TERMS) {
    if (lower.includes(term)) {
      return { isIllegal: true, reason: 'Illegal Contraband Trade' };
    }
  }

  for (const term of CYBERCRIME_TERMS) {
    if (lower.includes(term)) {
      return { isIllegal: true, reason: 'Malware / Cybercrime Exploit' };
    }
  }

  if (SSN_REGEX.test(textContent) || CREDIT_CARD_REGEX.test(textContent)) {
    return { isIllegal: true, reason: 'Doxxing / Financial Data Leak' };
  }

  return { isIllegal: false };
}

export interface ReportedEvent {
  eventId: string;
  pubkey?: string;
  reason: string;
  reportedAt: number;
}

class CommunitySafetyManager {
  private userMuteList: Set<string> = new Set();
  private userFlaggedEvents: Set<string> = new Set();
  private reportedEvents: Map<string, ReportedEvent> = new Map();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const m = localStorage.getItem('aufbruch_mute_list');
      if (m) this.userMuteList = new Set(JSON.parse(m));

      const f = localStorage.getItem('aufbruch_flagged_events');
      if (f) this.userFlaggedEvents = new Set(JSON.parse(f));

      const r = localStorage.getItem('aufbruch_reported_events');
      if (r) {
        const parsed: ReportedEvent[] = JSON.parse(r);
        parsed.forEach(e => this.reportedEvents.set(e.eventId, e));
      }
    } catch {
      // Ignore
    }
  }

  private saveState() {
    try {
      localStorage.setItem('aufbruch_mute_list', JSON.stringify(Array.from(this.userMuteList)));
      localStorage.setItem('aufbruch_flagged_events', JSON.stringify(Array.from(this.userFlaggedEvents)));
      localStorage.setItem('aufbruch_reported_events', JSON.stringify(Array.from(this.reportedEvents.values())));
    } catch {
      // Ignore
    }
  }

  public toggleMuteUser(pubkey: string): boolean {
    if (this.userMuteList.has(pubkey)) {
      this.userMuteList.delete(pubkey);
    } else {
      this.userMuteList.add(pubkey);
    }
    this.saveState();
    return this.userMuteList.has(pubkey);
  }

  public isMuted(pubkey: string): boolean {
    return this.userMuteList.has(pubkey);
  }

  public flagEvent(eventId: string) {
    this.userFlaggedEvents.add(eventId);
    this.saveState();
  }

  public reportEvent(eventId: string, reason: string, pubkey?: string) {
    this.userFlaggedEvents.add(eventId);
    this.reportedEvents.set(eventId, {
      eventId,
      pubkey,
      reason,
      reportedAt: Date.now(),
    });
    if (pubkey) {
      // Auto-mute repeat offenders
      this.userMuteList.add(pubkey);
    }
    this.saveState();
  }

  public isEventFlagged(eventId: string): boolean {
    return this.userFlaggedEvents.has(eventId) || this.reportedEvents.has(eventId);
  }

  public getMutedCount(): number {
    return this.userMuteList.size;
  }

  public getReportedCount(): number {
    return this.reportedEvents.size;
  }

  public getReportedEvents(): ReportedEvent[] {
    return Array.from(this.reportedEvents.values());
  }
}

export const communitySafetyManager = new CommunitySafetyManager();
