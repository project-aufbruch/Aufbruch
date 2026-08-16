/**
 * Tactical Notification & Audio Alert Service for AUFBRUCH
 * - Web Audio API synthesizer for message chimes, call ringtones, self-destruct sound effects
 * - Web Notifications API integration with permission management
 */

class NotificationService {
  private soundEnabled: boolean = true;
  private notificationsEnabled: boolean = true;
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: any = null;

  constructor() {
    try {
      const savedSound = localStorage.getItem('aufbruch_sound_enabled') ?? localStorage.getItem('voice_sound_enabled');
      const savedNotifs = localStorage.getItem('aufbruch_notifs_enabled') ?? localStorage.getItem('voice_notifs_enabled');
      if (savedSound !== null) this.soundEnabled = savedSound === 'true';
      if (savedNotifs !== null) this.notificationsEnabled = savedNotifs === 'true';
    } catch {
      // localStorage fallback
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('aufbruch_sound_enabled', String(enabled));
    } catch {}
  }

  public isNotificationsEnabled(): boolean {
    return this.notificationsEnabled;
  }

  public setNotificationsEnabled(enabled: boolean) {
    this.notificationsEnabled = enabled;
    try {
      localStorage.setItem('aufbruch_notifs_enabled', String(enabled));
    } catch {}
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }

  public notify(title: string, options?: NotificationOptions) {
    if (!this.notificationsEnabled) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          ...options,
        });
      } catch {
        // Suppress browser notification limitations in iframe/sandboxed modes
      }
    }
  }

  /**
   * High-contrast pleasant synthesized chime for new encrypted incoming message
   */
  public playMessageChime() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.05); // D6
      osc2.frequency.exponentialRampToValueAtTime(1760.0, now + 0.18); // A6

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.05);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {
      // Audio playback safety catch
    }
  }

  /**
   * Sound effect played when a disappearing self-destruct message vaporizes
   */
  public playSelfDestructSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  /**
   * Looping tactical encrypted ringtone for incoming P2P voice/video call
   */
  public playCallRingtone() {
    if (!this.soundEnabled) return;
    this.stopCallRingtone();

    const ringPulse = () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now); // A4
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now); // B4

        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.setValueAtTime(0.18, now + 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
      } catch {}
    };

    ringPulse();
    this.ringtoneInterval = setInterval(ringPulse, 2200);
  }

  public stopCallRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }
}

export const notificationService = new NotificationService();
