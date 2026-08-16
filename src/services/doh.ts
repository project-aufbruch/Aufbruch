/**
 * DNS-over-HTTPS (DoH) Encrypted Relay Lookup Engine
 * Prevents ISP-level DNS tracking and Deep Packet Inspection (DPI) censorship
 * in regime-controlled networks (e.g. India, Pakistan, Iran) by tunneling DNS queries
 * through Cloudflare (1.1.1.1) or Google DoH over HTTPS.
 */

export interface DoHResult {
  hostname: string;
  ip: string | null;
  provider: 'Cloudflare (1.1.1.1)' | 'Google (8.8.8.8)' | 'Direct-Mapped IP' | 'Failed';
  latencyMs: number;
  timestamp: number;
}

// Pre-cached Direct Anycast IPs for primary Nostr relays to bypass DNS entirely if DoH is blocked
const DIRECT_RELAY_IPS: Record<string, string> = {
  'relay.damus.io': '104.21.32.112',
  'nos.lol': '172.67.135.201',
  'relay.snort.social': '104.26.10.15',
  'relay.primal.net': '104.21.48.91',
  'nostr.mom': '172.67.190.45',
  'relay.current.fyi': '104.21.75.120',
};

const dohCache: Map<string, DoHResult> = new Map();

/**
 * Resolves a hostname via Cloudflare or Google DNS-over-HTTPS
 */
export async function resolveHostnameDoH(hostname: string): Promise<DoHResult> {
  const cleanHost = hostname.replace(/^wss?:\/\//, '').split('/')[0].split(':')[0];
  const start = Date.now();

  // Check cache (valid for 10 minutes)
  const cached = dohCache.get(cleanHost);
  if (cached && Date.now() - cached.timestamp < 600000) {
    return cached;
  }

  // 1. Try Cloudflare DoH (https://1.1.1.1/dns-query or https://cloudflare-dns.com/dns-query)
  try {
    const cfUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanHost)}&type=A`;
    const res = await fetch(cfUrl, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.Answer && data.Answer.length > 0) {
        const aRecord = data.Answer.find((a: { type: number; data: string }) => a.type === 1);
        if (aRecord) {
          const result: DoHResult = {
            hostname: cleanHost,
            ip: aRecord.data,
            provider: 'Cloudflare (1.1.1.1)',
            latencyMs: Date.now() - start,
            timestamp: Date.now(),
          };
          dohCache.set(cleanHost, result);
          return result;
        }
      }
    }
  } catch (e) {
    console.warn(`Cloudflare DoH lookup failed for ${cleanHost}:`, e);
  }

  // 2. Try Google DoH (https://dns.google/resolve)
  try {
    const gUrl = `https://dns.google/resolve?name=${encodeURIComponent(cleanHost)}&type=A`;
    const res = await fetch(gUrl, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.Answer && data.Answer.length > 0) {
        const aRecord = data.Answer.find((a: { type: number; data: string }) => a.type === 1);
        if (aRecord) {
          const result: DoHResult = {
            hostname: cleanHost,
            ip: aRecord.data,
            provider: 'Google (8.8.8.8)',
            latencyMs: Date.now() - start,
            timestamp: Date.now(),
          };
          dohCache.set(cleanHost, result);
          return result;
        }
      }
    }
  } catch (e) {
    console.warn(`Google DoH lookup failed for ${cleanHost}:`, e);
  }

  // 3. Fallback to Direct-Mapped Relay IP table (Bypasses DNS lookups completely)
  if (DIRECT_RELAY_IPS[cleanHost]) {
    const result: DoHResult = {
      hostname: cleanHost,
      ip: DIRECT_RELAY_IPS[cleanHost],
      provider: 'Direct-Mapped IP',
      latencyMs: Date.now() - start,
      timestamp: Date.now(),
    };
    dohCache.set(cleanHost, result);
    return result;
  }

  return {
    hostname: cleanHost,
    ip: null,
    provider: 'Failed',
    latencyMs: Date.now() - start,
    timestamp: Date.now(),
  };
}

/**
 * Returns all active DoH resolution cache items
 */
export function getDoHCacheList(): DoHResult[] {
  return Array.from(dohCache.values());
}
