/**
 * Free, Client-Side URL Shortener Service for AUFBRUCH PWA
 * 
 * Employs a dual client-side pattern:
 * 1. API-Free Hash Mapping: Generates deterministic 6-character Base62/Base36 hash IDs
 *    and maintains a local client mapping in localStorage for instant retrieval.
 * 2. Portable Hash Compression: Encodes post IDs, CIDs, and deep routes into compact 
 *    Base64URL hash fragments (#s/...) that decode client-side on any device without a server.
 */

export interface ShortUrlRecord {
  shortCode: string;
  originalUrl: string;
  targetType: 'event' | 'cid' | 'profile' | 'custom';
  targetId?: string;
  createdAt: number;
  clickCount: number;
}

const STORAGE_KEY = 'aufbruch_short_urls_v1';

/**
 * Generates a deterministic short hash from string input (Base36 / Base62 style)
 */
function generateShortHash(input: string, length = 6): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const positiveHash = Math.abs(hash);
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  let temp = positiveHash;
  
  while (temp > 0) {
    result = chars[temp % chars.length] + result;
    temp = Math.floor(temp / chars.length);
  }
  
  // Pad if too short
  while (result.length < length) {
    result = chars[(result.length + input.length) % chars.length] + result;
  }
  
  return result.substring(0, length);
}

/**
 * Encodes a JSON object or string into a compact Base64URL string safe for URL hashes
 */
export function encodeToCompactHash(data: Record<string, unknown> | string): string {
  try {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    const encoded = btoa(encodeURIComponent(jsonStr))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return encoded;
  } catch {
    return '';
  }
}

/**
 * Decodes a compact Base64URL string back into an object or string
 */
export function decodeCompactHash<T = unknown>(hashStr: string): T | null {
  try {
    let base64 = hashStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonStr = decodeURIComponent(atob(base64));
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      return jsonStr as unknown as T;
    }
  } catch {
    return null;
  }
}

export const PET_DECOY_ALIASES = [
  'pet-weather',
  'pet-detective',
  'pet-care-news',
  'pet-walker-gps',
  'pet-health-log'
];

class UrlShortenerService {
  private records: Map<string, ShortUrlRecord> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ShortUrlRecord[] = JSON.parse(raw);
        parsed.forEach(rec => this.records.set(rec.shortCode, rec));
      }
    } catch {
      // Storage fallback
    }
  }

  private saveToStorage(): void {
    try {
      const arrayList = Array.from(this.records.values()).slice(0, 100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arrayList));
    } catch {
      // Ignore quota limits gracefully
    }
  }

  /**
   * Shortens a given URL or PWA deep link into a compact shareable link.
   * Supports custom alias/vanity names (e.g., 'pet-weather', 'pet-detective')
   */
  public shortenUrl(
    originalUrl: string,
    targetType: 'event' | 'cid' | 'profile' | 'custom' = 'custom',
    targetId?: string,
    customAlias?: string
  ): {
    shortCode: string;
    shortUrl: string;
    originalUrl: string;
    compressionRatio: number;
    record: ShortUrlRecord;
  } {
    const baseUrl = window.location.origin + window.location.pathname;

    let shortCode = '';
    let hashRoute = '';

    if (customAlias && customAlias.trim().length > 0) {
      // Sanitize custom alias (e.g. "Pet Weather" -> "pet-weather")
      shortCode = customAlias.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
      hashRoute = `#v/${shortCode}`;

      const record: ShortUrlRecord = {
        shortCode,
        originalUrl,
        targetType,
        targetId,
        createdAt: Date.now(),
        clickCount: 0
      };

      this.records.set(shortCode, record);
      this.saveToStorage();
    } else if (targetType === 'event' && targetId) {
      const compactPayload = encodeToCompactHash({ e: targetId, t: 'evt' });
      hashRoute = `#s/${compactPayload}`;
      shortCode = `s/${compactPayload}`;
    } else if (targetType === 'cid' && targetId) {
      const compactPayload = encodeToCompactHash({ c: targetId, t: 'cid' });
      hashRoute = `#s/${compactPayload}`;
      shortCode = `s/${compactPayload}`;
    } else {
      // Generate deterministic short code for custom or general URLs
      shortCode = generateShortHash(originalUrl + Date.now().toString());
      hashRoute = `#v/${shortCode}`;
      
      const record: ShortUrlRecord = {
        shortCode,
        originalUrl,
        targetType,
        targetId,
        createdAt: Date.now(),
        clickCount: 0
      };

      this.records.set(shortCode, record);
      this.saveToStorage();
    }

    const shortUrl = `${baseUrl}${hashRoute}`;

    const origLength = originalUrl.length;
    const shortLength = shortUrl.length;
    const compressionRatio = origLength > 0 
      ? Math.max(0, Math.round(((origLength - shortLength) / origLength) * 100))
      : 0;

    const record: ShortUrlRecord = this.records.get(shortCode.replace(/^v\//, '')) || {
      shortCode,
      originalUrl,
      targetType,
      targetId,
      createdAt: Date.now(),
      clickCount: 0
    };

    return {
      shortCode,
      shortUrl,
      originalUrl,
      compressionRatio,
      record
    };
  }

  /**
   * Resolves a short code or hash route to its original URL/target
   */
  public resolveShortCode(codeOrHash: string): ShortUrlRecord | { targetType: string; targetId?: string; originalUrl: string } | null {
    const cleanCode = codeOrHash.replace(/^#\/?/, '').replace(/^s\//, '').replace(/^v\//, '');

    // 1. Try local storage records table
    if (this.records.has(cleanCode)) {
      const rec = this.records.get(cleanCode)!;
      rec.clickCount++;
      this.saveToStorage();
      return rec;
    }

    // 2. Default fallback for preset decoy aliases if not in local storage
    if (PET_DECOY_ALIASES.includes(cleanCode)) {
      return {
        targetType: 'custom',
        originalUrl: `${window.location.origin}${window.location.pathname}`
      };
    }

    // 3. Try portable payload decoding
    const portableData = decodeCompactHash<{ e?: string; c?: string; t?: string }>(cleanCode);
    if (portableData && typeof portableData === 'object') {
      if (portableData.e) {
        return {
          targetType: 'event',
          targetId: portableData.e,
          originalUrl: `${window.location.origin}${window.location.pathname}?event=${portableData.e}`
        };
      }
      if (portableData.c) {
        return {
          targetType: 'cid',
          targetId: portableData.c,
          originalUrl: `${window.location.origin}${window.location.pathname}?cid=${portableData.c}`
        };
      }
    }

    return null;
  }

  /**
   * Retrieves all user generated short links
   */
  public getHistory(): ShortUrlRecord[] {
    return Array.from(this.records.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Deletes a short link record
   */
  public deleteRecord(shortCode: string): void {
    this.records.delete(shortCode);
    this.saveToStorage();
  }
}

export const urlShortenerService = new UrlShortenerService();
