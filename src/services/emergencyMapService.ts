/**
 * Offline Emergency Maps & Geofenced Safe Zone Service
 * Caches vector geographic points of interest, safe corridors, water points,
 * medical stations, and danger zones with offline Haversine distance triangulation.
 */

import { EmergencyPin, SafeZoneCategory } from '../types';

const PRELOADED_SAFE_ZONES: EmergencyPin[] = [
  {
    id: 'pin_shelter_01',
    title: 'Civic Center Emergency Bunkers',
    description: 'Underground civic refuge shelter with emergency power generation and dual air filtration.',
    category: 'shelter',
    latitude: 37.7749,
    longitude: -122.4194,
    verifiedByCount: 14,
    isVerified: true,
    authorPetname: 'RedCross volunteer',
    authorPubkey: '9a31...b42c',
    timestamp: Date.now() - 3600000 * 5,
    capacityStatus: 'open',
    contactFrequency: 'VHF 146.520 MHz',
  },
  {
    id: 'pin_medical_01',
    title: 'Field Trauma & First Aid Clinic',
    description: 'Volunteer triage center equipped with surgical kits, trauma bandages, and sterile IV fluids.',
    category: 'medical',
    latitude: 37.7833,
    longitude: -122.4167,
    verifiedByCount: 22,
    isVerified: true,
    authorPetname: 'Dr. Marcus MedField',
    authorPubkey: '18ab...cc91',
    timestamp: Date.now() - 3600000 * 2,
    capacityStatus: 'open',
    contactFrequency: 'UHF 433.500 MHz',
  },
  {
    id: 'pin_water_01',
    title: 'Gravity-Fed Clean Water Depot',
    description: 'Potable water distribution point with activated carbon gravity filtration (10,000 gal).',
    category: 'water',
    latitude: 37.7695,
    longitude: -122.4467,
    verifiedByCount: 31,
    isVerified: true,
    authorPetname: 'WaterGuard-Mesh',
    authorPubkey: '55ef...881a',
    timestamp: Date.now() - 3600000 * 12,
    capacityStatus: 'open',
  },
  {
    id: 'pin_hazard_01',
    title: 'Cellular Jammer & Checkpoint Perimeter',
    description: 'Active surveillance drones and signal suppression grid. Avoid electronic emissions.',
    category: 'hazard',
    latitude: 37.7915,
    longitude: -122.4089,
    verifiedByCount: 45,
    isVerified: true,
    authorPetname: 'Observer-77',
    authorPubkey: '7721...33dd',
    timestamp: Date.now() - 3600000 * 1,
    capacityStatus: 'compromised',
  },
  {
    id: 'pin_evac_01',
    title: 'West Corridor Evacuation Route',
    description: 'Unobstructed mountain bypass route open for pedestrian and bicycle transit.',
    category: 'evacuation',
    latitude: 37.7558,
    longitude: -122.4449,
    verifiedByCount: 19,
    isVerified: true,
    authorPetname: 'TrailGuide',
    authorPubkey: '44dc...9921',
    timestamp: Date.now() - 3600000 * 8,
    capacityStatus: 'open',
  },
  {
    id: 'pin_comms_01',
    title: 'Solar Mesh Relay Tower (Nostr LoRa Gateway)',
    description: 'Autonomous LoRa repeater bridging offline packets to regional shortwave radio relays.',
    category: 'comms',
    latitude: 37.7600,
    longitude: -122.4350,
    verifiedByCount: 28,
    isVerified: true,
    authorPetname: 'MeshOperator-09',
    authorPubkey: '22ee...aa34',
    timestamp: Date.now() - 3600000 * 20,
    capacityStatus: 'open',
    contactFrequency: 'LoRa 915 MHz / Ch 2',
  },
];

export class EmergencyMapService {
  private pins: EmergencyPin[] = [];
  private userLocation: { latitude: number; longitude: number; accuracy: number } | null = null;
  private listeners: Set<(pins: EmergencyPin[]) => void> = new Set();
  private isWatchingLocation: boolean = false;
  private watchId: number | null = null;

  constructor() {
    this.loadPins();
  }

  private loadPins() {
    try {
      const saved = localStorage.getItem('voice_emergency_pins');
      if (saved) {
        this.pins = JSON.parse(saved);
      } else {
        this.pins = PRELOADED_SAFE_ZONES;
      }
    } catch {
      this.pins = PRELOADED_SAFE_ZONES;
    }
  }

  private savePins() {
    try {
      localStorage.setItem('voice_emergency_pins', JSON.stringify(this.pins));
    } catch {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l([...this.pins]));
  }

  public subscribe(listener: (pins: EmergencyPin[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.pins]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getPins(): EmergencyPin[] {
    return [...this.pins];
  }

  public addPin(pin: Omit<EmergencyPin, 'id' | 'timestamp' | 'verifiedByCount' | 'isVerified'>): EmergencyPin {
    const newPin: EmergencyPin = {
      ...pin,
      id: 'pin_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      verifiedByCount: 1,
      isVerified: false,
    };

    this.pins.unshift(newPin);
    this.savePins();
    return newPin;
  }

  public verifyPin(pinId: string): void {
    this.pins = this.pins.map((p) => {
      if (p.id === pinId) {
        const count = p.verifiedByCount + 1;
        return {
          ...p,
          verifiedByCount: count,
          isVerified: count >= 3,
        };
      }
      return p;
    });
    this.savePins();
  }

  public deletePin(pinId: string): void {
    this.pins = this.pins.filter((p) => p.id !== pinId);
    this.savePins();
  }

  public resetToDefaults(): void {
    this.pins = PRELOADED_SAFE_ZONES;
    this.savePins();
  }

  /**
   * Calculates Haversine distance in kilometers between two GPS coordinates
   */
  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Calculates compass bearing angle from user to target coordinate
   */
  public calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.cos(((lon2 - lon1) * Math.PI) / 180);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  }

  /**
   * Requests device GPS location without sending data to any external network
   */
  public getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        // Fallback default city center coordinate
        resolve({ latitude: 37.7749, longitude: -122.4194, accuracy: 50 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          this.userLocation = loc;
          resolve(loc);
        },
        () => {
          // Default fallback
          const fallback = { latitude: 37.7749, longitude: -122.4194, accuracy: 100 };
          this.userLocation = fallback;
          resolve(fallback);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
  }

  public getUserLocation() {
    return this.userLocation || { latitude: 37.7749, longitude: -122.4194, accuracy: 50 };
  }
}

export const emergencyMapService = new EmergencyMapService();
