import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Compass,
  Plus,
  Shield,
  Heart,
  Droplet,
  AlertTriangle,
  Radio,
  Share2,
  CheckCircle2,
  Filter,
  Search
} from 'lucide-react';
import { emergencyMapService } from '../services/emergencyMapService';
import { EmergencyPin, SafeZoneCategory, UserIdentity } from '../types';

interface EmergencyMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: UserIdentity | null;
}

export const EmergencyMapModal: React.FC<EmergencyMapModalProps> = ({
  isOpen,
  onClose,
  identity,
}) => {
  const [pins, setPins] = useState<EmergencyPin[]>(emergencyMapService.getPins());
  const [selectedCategory, setSelectedCategory] = useState<SafeZoneCategory | 'all'>('all');
  const [selectedPin, setSelectedPin] = useState<EmergencyPin | null>(null);
  const [userLoc, setUserLoc] = useState({ latitude: 37.7749, longitude: -122.4194, accuracy: 50 });
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Pin form fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<SafeZoneCategory>('shelter');
  const [newContactFreq, setNewContactFreq] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsub = emergencyMapService.subscribe((newPins) => {
      setPins(newPins);
    });

    emergencyMapService.getCurrentLocation().then((loc) => {
      setUserLoc(loc);
    });

    return unsub;
  }, []);

  // Canvas Vector Map Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw dark tactical vector grid
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vector grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Concentric range rings from user position
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 1.5;
    [60, 120, 180, 240].forEach((r) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw User Location marker
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Plot pins relative to user center
    const scale = 12000; // coordinate delta scale factor
    pins.forEach((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return;

      const px = centerX + (p.longitude - userLoc.longitude) * scale;
      const py = centerY - (p.latitude - userLoc.latitude) * scale;

      if (px >= 10 && px <= canvas.width - 10 && py >= 10 && py <= canvas.height - 10) {
        // Pin color
        let color = '#3b82f6';
        if (p.category === 'shelter') color = '#10b981';
        if (p.category === 'medical') color = '#ef4444';
        if (p.category === 'water') color = '#06b6d4';
        if (p.category === 'hazard') color = '#f59e0b';
        if (p.category === 'evacuation') color = '#8b5cf6';
        if (p.category === 'comms') color = '#ec4899';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();

        // Pin border
        ctx.strokeStyle = selectedPin?.id === p.id ? '#ffffff' : 'rgba(255,255,255,0.6)';
        ctx.lineWidth = selectedPin?.id === p.id ? 3 : 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(p.title.slice(0, 16), px + 10, py + 3);
      }
    });
  }, [pins, selectedCategory, selectedPin, userLoc]);

  if (!isOpen) return null;

  const filteredPins = pins.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Place slightly offset from current user location
    const offsetLat = (Math.random() - 0.5) * 0.01;
    const offsetLon = (Math.random() - 0.5) * 0.01;

    const created = emergencyMapService.addPin({
      title: newTitle.trim(),
      description: newDesc.trim() || 'Verified field resource location.',
      category: newCategory,
      latitude: userLoc.latitude + offsetLat,
      longitude: userLoc.longitude + offsetLon,
      authorPetname: identity?.petname || 'Field Scout',
      authorPubkey: identity?.publicKeyHex || 'anonymous_mesh',
      capacityStatus: 'open',
      contactFrequency: newContactFreq.trim() || undefined,
    });

    setSelectedPin(created);
    setIsCreatingPin(false);
    setNewTitle('');
    setNewDesc('');
    setNewContactFreq('');
  };

  const getCategoryIcon = (cat: SafeZoneCategory) => {
    switch (cat) {
      case 'shelter': return <Shield className="w-4 h-4 text-emerald-600" />;
      case 'medical': return <Heart className="w-4 h-4 text-red-600" />;
      case 'water': return <Droplet className="w-4 h-4 text-cyan-600" />;
      case 'hazard': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'evacuation': return <Navigation className="w-4 h-4 text-purple-600" />;
      case 'comms': return <Radio className="w-4 h-4 text-pink-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl text-slate-900 shadow-2xl overflow-hidden my-6 relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white">Offline Emergency Safe Zone Map</h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  Vector Radar
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Cached regional shelters, field trauma clinics, potable water depots, and hazard perimeters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: Vector Radar Canvas & Filters */}
          <div className="lg:col-span-7 p-4 flex flex-col gap-3 bg-slate-950">
            {/* Category Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold">
              {[
                { id: 'all', label: 'All Safe Points' },
                { id: 'shelter', label: '🛡️ Shelters' },
                { id: 'medical', label: '🏥 Medical' },
                { id: 'water', label: '💧 Water' },
                { id: 'hazard', label: '⚠️ Hazards' },
                { id: 'evacuation', label: '🏃 Evac' },
                { id: 'comms', label: '📻 Comms' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Canvas Vector Map */}
            <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 min-h-[260px]">
              <canvas ref={canvasRef} width={500} height={320} className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-blue-400" />
                <span>GPS: {userLoc.latitude.toFixed(3)}, {userLoc.longitude.toFixed(3)} (±{userLoc.accuracy}m)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pin List & Details / Creation */}
          <div className="lg:col-span-5 p-4 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col gap-3 overflow-y-auto max-h-[500px]">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 mr-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search safe points..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden"
                />
              </div>
              <button
                onClick={() => setIsCreatingPin(!isCreatingPin)}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreatingPin ? 'Cancel' : 'Drop Pin'}</span>
              </button>
            </div>

            {/* New Pin Form Drawer */}
            {isCreatingPin && (
              <form onSubmit={handleCreatePin} className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2.5 text-xs animate-fade-in">
                <h4 className="font-bold text-blue-900">Drop New Safe Zone / Resource Pin</h4>
                <input
                  type="text"
                  placeholder="Resource Title (e.g. Clean Spring Depot)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-blue-200"
                  required
                />
                <textarea
                  placeholder="Details, entry requirements, capacity..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-white rounded-lg border border-blue-200"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as SafeZoneCategory)}
                    className="p-2 bg-white rounded-lg border border-blue-200"
                  >
                    <option value="shelter">🛡️ Refuge Shelter</option>
                    <option value="medical">🏥 Medical Aid</option>
                    <option value="water">💧 Clean Water</option>
                    <option value="hazard">⚠️ Hazard Area</option>
                    <option value="evacuation">🏃 Evac Corridor</option>
                    <option value="comms">📻 Radio / LoRa</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Radio freq (e.g. 146.52MHz)"
                    value={newContactFreq}
                    onChange={(e) => setNewContactFreq(e.target.value)}
                    className="p-2 bg-white rounded-lg border border-blue-200"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Broadcast Safe Pin
                </button>
              </form>
            )}

            {/* List of Safe Zone Pins */}
            <div className="space-y-2 overflow-y-auto">
              {filteredPins.map((pin) => {
                const dist = emergencyMapService.calculateDistanceKm(
                  userLoc.latitude,
                  userLoc.longitude,
                  pin.latitude,
                  pin.longitude
                );
                const bearing = emergencyMapService.calculateBearing(
                  userLoc.latitude,
                  userLoc.longitude,
                  pin.latitude,
                  pin.longitude
                );

                return (
                  <div
                    key={pin.id}
                    onClick={() => setSelectedPin(pin)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                      selectedPin?.id === pin.id
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        {getCategoryIcon(pin.category)}
                        <span className="truncate">{pin.title}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-700 shrink-0">
                        {dist} km • {Math.round(bearing)}°
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{pin.description}</p>

                    <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>By {pin.authorPetname}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          emergencyMapService.verifyPin(pin.id);
                        }}
                        className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{pin.verifiedByCount} Verifications</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer"
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
};
