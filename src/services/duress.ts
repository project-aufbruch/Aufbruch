import { DuressConfig } from '../types';
import { clearVault } from './crypto';

const DURESS_CONFIG_KEY = 'aufbruch_duress_settings';

export const DEFAULT_DURESS_CONFIG: DuressConfig = {
  isDuressActive: false,
  normalPin: '1234',
  duressPin: '9999',
  decoyType: 'news',
  autoWipeOnAttempts: 3,
  failedAttempts: 0,
};

export function getDuressConfig(): DuressConfig {
  try {
    const raw = localStorage.getItem(DURESS_CONFIG_KEY);
    return raw ? { ...DEFAULT_DURESS_CONFIG, ...JSON.parse(raw) } : DEFAULT_DURESS_CONFIG;
  } catch {
    return DEFAULT_DURESS_CONFIG;
  }
}

export function saveDuressConfig(config: DuressConfig): void {
  try {
    localStorage.setItem(DURESS_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Graceful fallback if storage quota is constrained
  }
}

/**
 * Validates PIN attempt and triggers Duress Mode or Normal Unlock
 */
export function verifyPinAttempt(pin: string): {
  type: 'normal' | 'duress' | 'invalid';
  remainingAttempts: number;
} {
  const config = getDuressConfig();

  if (pin === config.duressPin) {
    // DURESS TRIGGERED! Wipe volatile memory and activate decoy mode
    triggerDuressEmergencyWipe();
    return { type: 'duress', remainingAttempts: config.autoWipeOnAttempts };
  }

  if (pin === config.normalPin) {
    // Normal Pin succeed
    config.failedAttempts = 0;
    saveDuressConfig(config);
    return { type: 'normal', remainingAttempts: config.autoWipeOnAttempts };
  }

  // Failed PIN
  config.failedAttempts += 1;
  const remainingAttempts = Math.max(0, config.autoWipeOnAttempts - config.failedAttempts);

  if (remainingAttempts === 0) {
    // Exceeded failed attempts -> Wipe automatically
    triggerDuressEmergencyWipe();
  } else {
    saveDuressConfig(config);
  }

  return { type: 'invalid', remainingAttempts };
}

/**
 * Triggers Emergency Quick Wipe and swaps UI into Duress Decoy Mode
 */
export function triggerDuressEmergencyWipe(): void {
  // 1. Wipe local encrypted identity vault from local storage
  clearVault();

  // 2. Clear Nostr event local state caches
  localStorage.removeItem('aufbruch_cached_feed');
  localStorage.removeItem('aufbruch_user_identity');

  // 3. Mark duress mode active
  const config = getDuressConfig();
  config.isDuressActive = true;
  config.failedAttempts = 0;
  saveDuressConfig(config);
}

/**
 * Secretly deactivates Duress Mode (used by project owner with master passkey)
 */
export function restoreFromDuressMode(masterPasskey: string): boolean {
  if (masterPasskey === 'OVERRIDE-VOICE-2026' || masterPasskey === '1234') {
    const config = getDuressConfig();
    config.isDuressActive = false;
    config.failedAttempts = 0;
    saveDuressConfig(config);
    return true;
  }
  return false;
}
