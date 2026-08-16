/**
 * Acoustic Modem & Ultrasonic Steganography Engine for Air-Gapped Transfers
 * Enables device-to-device offline emergency message transmission over high-frequency audio
 * (17.5 kHz - 19.5 kHz near-ultrasound) through standard device speaker and microphone.
 */

import { UltrasonicPacket, UltrasonicEmergencyType } from '../types';

// Frequency Shift Keying (FSK) Tone Configuration
export const ULTRASONIC_CONFIG = {
  PREAMBLE_FREQ: 17200,      // Start of Frame marker
  BIT_0_FREQ: 18200,         // Binary 0
  BIT_1_FREQ: 19200,         // Binary 1
  AUDIBLE_PREAMBLE: 1200,    // Optional audible mode for demo testing
  AUDIBLE_BIT_0: 1600,
  AUDIBLE_BIT_1: 2200,
  BIT_DURATION_SEC: 0.045,   // 45ms per bit (approx 22 baud, robust against room echo)
  SAMPLE_RATE: 44100,
};

export class AcousticModemService {
  private audioCtx: AudioContext | null = null;
  private isTransmitting: boolean = false;
  private isListening: boolean = false;
  private mediaStream: MediaStream | null = null;
  private analyserNode: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private receivedPackets: UltrasonicPacket[] = [];
  private listeners: Set<(packets: UltrasonicPacket[]) => void> = new Set();
  private statusListeners: Set<(status: { isTransmitting: boolean; isListening: boolean; lastActivity?: string }) => void> = new Set();
  private isAudibleMode: boolean = false;

  constructor() {
    this.loadCachedPackets();
  }

  private loadCachedPackets() {
    try {
      const saved = localStorage.getItem('aufbruch_ultrasonic_packets') ?? localStorage.getItem('voice_ultrasonic_packets');
      if (saved) {
        this.receivedPackets = JSON.parse(saved);
      }
    } catch {}
  }

  private savePackets() {
    try {
      localStorage.setItem('aufbruch_ultrasonic_packets', JSON.stringify(this.receivedPackets.slice(0, 50)));
    } catch {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l([...this.receivedPackets]));
  }

  private notifyStatus(lastActivity?: string) {
    this.statusListeners.forEach((l) =>
      l({
        isTransmitting: this.isTransmitting,
        isListening: this.isListening,
        lastActivity,
      })
    );
  }

  public subscribe(listener: (packets: UltrasonicPacket[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.receivedPackets]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeStatus(
    listener: (status: { isTransmitting: boolean; isListening: boolean; lastActivity?: string }) => void
  ): () => void {
    this.statusListeners.add(listener);
    listener({ isTransmitting: this.isTransmitting, isListening: this.isListening });
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public setAudibleMode(audible: boolean) {
    this.isAudibleMode = audible;
  }

  public getAudibleMode(): boolean {
    return this.isAudibleMode;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Encodes an emergency packet into a compact binary bitstring
   */
  private packetToBitstring(packet: UltrasonicPacket): string {
    const jsonStr = JSON.stringify({
      t: packet.type,
      p: packet.senderPetname,
      k: packet.senderPubkeyPrefix,
      m: packet.message,
      lat: packet.latitude ? Number(packet.latitude.toFixed(4)) : undefined,
      lng: packet.longitude ? Number(packet.longitude.toFixed(4)) : undefined,
      ts: Math.floor(packet.timestamp / 1000),
    });

    // Simple CRC-16 / parity checksum
    let checksum = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      checksum = (checksum + jsonStr.charCodeAt(i) * (i + 1)) % 65535;
    }

    let binary = '';
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i);
      binary += charCode.toString(2).padStart(8, '0');
    }

    // Append 16-bit checksum
    binary += checksum.toString(2).padStart(16, '0');
    return binary;
  }

  /**
   * Decodes a binary bitstring back into an emergency packet
   */
  private bitstringToPacket(bits: string): UltrasonicPacket | null {
    try {
      if (bits.length < 24) return null;
      const dataBits = bits.slice(0, -16);
      const checksumBits = bits.slice(-16);
      const expectedChecksum = parseInt(checksumBits, 2);

      let text = '';
      for (let i = 0; i < dataBits.length; i += 8) {
        const byte = dataBits.slice(i, i + 8);
        if (byte.length === 8) {
          text += String.fromCharCode(parseInt(byte, 2));
        }
      }

      let calcChecksum = 0;
      for (let i = 0; i < text.length; i++) {
        calcChecksum = (calcChecksum + text.charCodeAt(i) * (i + 1)) % 65535;
      }

      if (calcChecksum !== expectedChecksum) {
        console.warn('[AcousticModem] Checksum mismatch in decoded acoustic frame');
        return null;
      }

      const obj = JSON.parse(text);
      return {
        id: 'acoustic_' + Math.random().toString(36).substring(2, 9),
        type: obj.t,
        senderPetname: obj.p,
        senderPubkeyPrefix: obj.k,
        message: obj.m,
        latitude: obj.lat,
        longitude: obj.lng,
        timestamp: (obj.ts || Math.floor(Date.now() / 1000)) * 1000,
        checksum: calcChecksum,
      };
    } catch (e) {
      console.warn('[AcousticModem] Failed to decode bitstring packet:', e);
      return null;
    }
  }

  /**
   * Transmits an emergency alert over near-ultrasonic sound chirps
   */
  public async transmitAlert(
    type: UltrasonicEmergencyType,
    senderPetname: string,
    senderPubkey: string,
    message: string,
    coordinates?: { latitude: number; longitude: number }
  ): Promise<UltrasonicPacket> {
    const packet: UltrasonicPacket = {
      id: 'acoustic_' + Date.now().toString(36),
      type,
      senderPetname,
      senderPubkeyPrefix: senderPubkey.slice(0, 8),
      message,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      timestamp: Date.now(),
      checksum: 0,
    };

    const bits = this.packetToBitstring(packet);
    const ctx = this.getAudioContext();

    this.isTransmitting = true;
    this.notifyStatus(`Transmitting ${bits.length} bits via ${this.isAudibleMode ? 'Audible FSK' : '18-19kHz Ultrasonic'}...`);

    const preambleFreq = this.isAudibleMode ? ULTRASONIC_CONFIG.AUDIBLE_PREAMBLE : ULTRASONIC_CONFIG.PREAMBLE_FREQ;
    const bit0Freq = this.isAudibleMode ? ULTRASONIC_CONFIG.AUDIBLE_BIT_0 : ULTRASONIC_CONFIG.BIT_0_FREQ;
    const bit1Freq = this.isAudibleMode ? ULTRASONIC_CONFIG.AUDIBLE_BIT_1 : ULTRASONIC_CONFIG.BIT_1_FREQ;
    const bitDur = ULTRASONIC_CONFIG.BIT_DURATION_SEC;

    let startTime = ctx.currentTime + 0.05;

    // 1. Play Preamble sync chirp (3x bit duration)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    // Cosine envelope to prevent acoustic clicks
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);

    osc.frequency.setValueAtTime(preambleFreq, startTime);
    startTime += bitDur * 3;

    // 2. Play data bits
    for (let i = 0; i < bits.length; i++) {
      const bit = bits[i];
      const freq = bit === '1' ? bit1Freq : bit0Freq;
      osc.frequency.setValueAtTime(freq, startTime);
      startTime += bitDur;
    }

    // 3. Postamble end tone
    osc.frequency.setValueAtTime(preambleFreq, startTime);
    startTime += bitDur * 2;

    gain.gain.setValueAtTime(0.3, startTime - 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + 0.05);
    osc.stop(startTime);

    // Add to local list
    this.receivedPackets.unshift(packet);
    this.savePackets();

    setTimeout(() => {
      this.isTransmitting = false;
      this.notifyStatus('Transmission complete.');
    }, (startTime - ctx.currentTime) * 1000);

    return packet;
  }

  /**
   * Starts listening via the device microphone for incoming ultrasonic/FSK packets
   */
  public async startListening(onPacketReceived?: (packet: UltrasonicPacket) => void): Promise<boolean> {
    if (this.isListening) return true;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const ctx = this.getAudioContext();
      const source = ctx.createMediaStreamSource(this.mediaStream);
      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.2;
      source.connect(this.analyserNode);

      this.isListening = true;
      this.notifyStatus('Listening for ultrasonic & acoustic chirps...');

      // Radar receiver loop
      const bufferLength = this.analyserNode.frequencyBinCount;
      const freqData = new Float32Array(bufferLength);
      const binWidth = ctx.sampleRate / this.analyserNode.fftSize;

      let receivingBits = '';
      let isReceiving = false;
      let lastBitSampleTime = 0;

      const detectFreqMagnitude = (targetFreq: number) => {
        const binIndex = Math.round(targetFreq / binWidth);
        if (binIndex >= 0 && binIndex < bufferLength) {
          return freqData[binIndex]; // dB value (-100 to 0)
        }
        return -120;
      };

      const listenLoop = () => {
        if (!this.isListening || !this.analyserNode) return;
        this.analyserNode.getFloatFrequencyData(freqData);

        const now = Date.now();
        const preambleFreq = this.isAudibleMode ? ULTRASONIC_CONFIG.AUDIBLE_PREAMBLE : ULTRASONIC_CONFIG.PREAMBLE_FREQ;
        const bit0Freq = this.isAudibleMode ? ULTRASONIC_CONFIG.AUDIBLE_BIT_0 : ULTRASONIC_CONFIG.BIT_0_FREQ;
        const bit1Freq = this.isAudibleMode ? ULTRASONIC_CONFIG.AUDIBLE_BIT_1 : ULTRASONIC_CONFIG.BIT_1_FREQ;

        const preambleMag = detectFreqMagnitude(preambleFreq);
        const bit0Mag = detectFreqMagnitude(bit0Freq);
        const bit1Mag = detectFreqMagnitude(bit1Freq);

        const threshold = -65; // dB threshold for detection

        // Preamble detected
        if (!isReceiving && preambleMag > threshold && preambleMag > bit0Mag + 10 && preambleMag > bit1Mag + 10) {
          isReceiving = true;
          receivingBits = '';
          lastBitSampleTime = now + (ULTRASONIC_CONFIG.BIT_DURATION_SEC * 1000 * 2.5);
          this.notifyStatus('Acoustic preamble detected! Ingesting binary frame...');
        } else if (isReceiving && now >= lastBitSampleTime) {
          if (bit1Mag > bit0Mag && bit1Mag > threshold) {
            receivingBits += '1';
            lastBitSampleTime = now + (ULTRASONIC_CONFIG.BIT_DURATION_SEC * 1000);
          } else if (bit0Mag > bit1Mag && bit0Mag > threshold) {
            receivingBits += '0';
            lastBitSampleTime = now + (ULTRASONIC_CONFIG.BIT_DURATION_SEC * 1000);
          } else if (preambleMag > threshold && preambleMag > bit0Mag + 5 && preambleMag > bit1Mag + 5 && receivingBits.length > 20) {
            // Postamble detected - complete packet
            isReceiving = false;
            const packet = this.bitstringToPacket(receivingBits);
            if (packet) {
              this.receivedPackets.unshift(packet);
              this.savePackets();
              if (onPacketReceived) onPacketReceived(packet);
              this.notifyStatus(`Decoded ${packet.type} alert from ${packet.senderPetname}!`);
            }
            receivingBits = '';
          }
        }

        this.animationFrameId = requestAnimationFrame(listenLoop);
      };

      this.animationFrameId = requestAnimationFrame(listenLoop);
      return true;
    } catch (err) {
      console.error('[AcousticModem] Failed to initialize microphone receiver:', err);
      this.isListening = false;
      this.notifyStatus('Microphone access denied or unavailable.');
      return false;
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.notifyStatus('Acoustic listener stopped.');
  }

  public getPackets(): UltrasonicPacket[] {
    return [...this.receivedPackets];
  }

  public clearPackets() {
    this.receivedPackets = [];
    this.savePackets();
  }
}

export const acousticModemService = new AcousticModemService();
