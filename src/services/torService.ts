/**
 * Tor Onion Routing & SOCKS5 Proxy Simulator & Bridge Manager
 * Provides 3-hop cryptographic circuit emulation for high-threat surveillance environments.
 */

import { TorConfig, TorHop } from '../types';

const GUARD_NODES: Omit<TorHop, 'role'>[] = [
  { name: 'OnionGuard-Frankfurt-01', ip: '185.220.101.5', country: 'Germany', flag: '🇩🇪', latencyMs: 24, fingerprint: '8F4A...19C2' },
  { name: 'FreedomRelay-Reykjavik', ip: '194.187.249.12', country: 'Iceland', flag: '🇮🇸', latencyMs: 41, fingerprint: '3E2B...AA91' },
  { name: 'PrivacySentry-Zurich', ip: '178.63.14.99', country: 'Switzerland', flag: '🇨🇭', latencyMs: 18, fingerprint: '77D1...F044' },
  { name: 'NordicShield-Stockholm', ip: '193.11.164.20', country: 'Sweden', flag: '🇸🇪', latencyMs: 32, fingerprint: '5B98...11EC' },
];

const MIDDLE_NODES: Omit<TorHop, 'role'>[] = [
  { name: 'RelayHop-Amsterdam', ip: '46.166.185.14', country: 'Netherlands', flag: '🇳🇱', latencyMs: 28, fingerprint: '12AA...8899' },
  { name: 'OnionTransit-Vienna', ip: '80.92.122.3', country: 'Austria', flag: '🇦🇹', latencyMs: 36, fingerprint: '99CF...012D' },
  { name: 'ShadowMesh-Helsinki', ip: '95.216.144.81', country: 'Finland', flag: '🇫🇮', latencyMs: 44, fingerprint: '44E7...CB29' },
  { name: 'ObfsNode-Bucharest', ip: '185.107.56.2', country: 'Romania', flag: '🇷🇴', latencyMs: 52, fingerprint: '66F2...1A87' },
];

const EXIT_NODES: Omit<TorHop, 'role'>[] = [
  { name: 'ExitTor-Geneva', ip: '185.220.103.7', country: 'Switzerland', flag: '🇨🇭', latencyMs: 22, fingerprint: 'AA01...88DE' },
  { name: 'ExitOnion-Montreal', ip: '198.96.155.3', country: 'Canada', flag: '🇨🇦', latencyMs: 88, fingerprint: '22DD...910F' },
  { name: 'ExitGateway-Oslo', ip: '185.195.236.4', country: 'Norway', flag: '🇳🇴', latencyMs: 39, fingerprint: '7741...AC49' },
  { name: 'LibertyExit-Tallinn', ip: '89.249.65.10', country: 'Estonia', flag: '🇪🇪', latencyMs: 46, fingerprint: '3310...FF82' },
];

class TorService {
  private config: TorConfig;
  private listeners: Set<(config: TorConfig) => void> = new Set();

  constructor() {
    this.config = this.loadInitialConfig();
  }

  private getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private generateCircuit(): TorHop[] {
    const guard = this.getRandomItem(GUARD_NODES);
    const middle = this.getRandomItem(MIDDLE_NODES);
    const exit = this.getRandomItem(EXIT_NODES);

    return [
      { ...guard, role: 'Guard' },
      { ...middle, role: 'Middle' },
      { ...exit, role: 'Exit' },
    ];
  }

  private loadInitialConfig(): TorConfig {
    try {
      const saved = localStorage.getItem('aufbruch_tor_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    return {
      enabled: false,
      bridgeMode: 'obfs4',
      socksPort: 9050,
      circuit: this.generateCircuit(),
      dnsLeakProtection: true,
      isolationByOrigin: true,
    };
  }

  private saveConfig() {
    try {
      localStorage.setItem('aufbruch_tor_config', JSON.stringify(this.config));
    } catch {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.config }));
  }

  public subscribe(listener: (config: TorConfig) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.config });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getConfig(): TorConfig {
    return { ...this.config };
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public toggleTor(): boolean {
    this.config.enabled = !this.config.enabled;
    if (this.config.enabled && this.config.circuit.length === 0) {
      this.config.circuit = this.generateCircuit();
    }
    this.saveConfig();
    return this.config.enabled;
  }

  public buildNewCircuit(): TorHop[] {
    this.config.circuit = this.generateCircuit();
    this.saveConfig();
    return this.config.circuit;
  }

  public setBridgeMode(mode: 'obfs4' | 'meek-azure' | 'snowflake' | 'direct') {
    this.config.bridgeMode = mode;
    this.saveConfig();
  }

  public getTotalLatency(): number {
    if (!this.config.enabled || !this.config.circuit) return 12;
    return this.config.circuit.reduce((acc, hop) => acc + hop.latencyMs, 0);
  }

  public getExitIp(): string {
    if (!this.config.enabled) return 'Direct ISP';
    const exitHop = this.config.circuit.find((h) => h.role === 'Exit');
    return exitHop ? `${exitHop.ip} (${exitHop.country})` : '185.220.103.7 (CH)';
  }
}

export const torService = new TorService();
