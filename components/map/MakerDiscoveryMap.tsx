'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  Layers, 
  Send, 
  Navigation, 
  Clock, 
  CheckCircle,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import { NearbyMaker } from '@/types/database';
import { geocodeLocation, getNearbyMakers } from '@/app/actions/makers';

export const MakerDiscoveryMap: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('Milano');
  const [selectedCityName, setSelectedCityName] = useState<string>('Milano (MI)');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 45.4642, lng: 9.1900 });
  const [makers, setMakers] = useState<NearbyMaker[]>([]);
  const [selectedMaker, setSelectedMaker] = useState<NearbyMaker | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(11);

  // Fetch makers on coordinate change
  useEffect(() => {
    let isCancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const results = await getNearbyMakers(coords.lat, coords.lng, 30000);
        if (!isCancelled) {
          setMakers(results);
          if (results.length > 0) {
            setSelectedMaker(results[0]);
          } else {
            setSelectedMaker(null);
          }
        }
      } catch (err) {
        console.error('Error fetching makers:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }
    load();
    return () => { isCancelled = true; };
  }, [coords]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const geo = await geocodeLocation(searchQuery);
      if (geo) {
        setCoords({ lat: geo.lat, lng: geo.lng });
        setSelectedCityName(geo.displayName);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMakers = makers.filter(m => {
    if (selectedMaterialFilter === 'ALL') return true;
    return m.materials.some(mat => mat.toLowerCase().includes(selectedMaterialFilter.toLowerCase()));
  });

  return (
    <div className="relative w-full h-[650px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Search & Filter Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-xl">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Inserisci CAP o città (es. Milano, 20121, Roma, Torino)..."
              className="w-full bg-slate-800 text-white pl-9 pr-4 py-2 rounded-lg text-xs placeholder-slate-400 border border-slate-700 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            Cerca
          </button>
        </form>

        {/* Quick Material Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
          {['ALL', 'PLA', 'PETG', 'Resina', 'TPU', 'ABS'].map((mat) => (
            <button
              key={mat}
              onClick={() => setSelectedMaterialFilter(mat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                selectedMaterialFilter === mat
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {mat === 'ALL' ? 'Tutti i materiali' : mat}
            </button>
          ))}
        </div>
      </div>

      {/* Map Graphic Canvas / Simulated PostGIS 30km Discovery Canvas */}
      <div className="flex-1 w-full h-full relative bg-slate-900 overflow-hidden select-none">
        {/* Cartographic Vector Grid Background with Radar Sweep */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(#334155 1px, transparent 1px), linear-gradient(to right, rgba(51, 65, 85, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(51, 65, 85, 0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px, 120px 120px, 120px 120px',
          }}
        />

        {/* 30 km Radius Visual Geofence Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-[480px] h-[480px] rounded-full border border-emerald-500/20 bg-emerald-500/5 animate-pulse" />
          <div className="absolute inset-0 w-[300px] h-[300px] m-auto rounded-full border border-dashed border-cyan-500/30" />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-emerald-500/40 text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded-full">
            Raggio di ricerca PostGIS: 30 km
          </div>
        </div>

        {/* Client Pin (Center) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <div className="relative">
            <div className="w-5 h-5 rounded-full bg-cyan-500 ring-4 ring-cyan-500/30 animate-ping absolute" />
            <div className="w-5 h-5 rounded-full bg-cyan-400 border-2 border-white shadow-lg relative flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            </div>
          </div>
          <span className="mt-1 bg-slate-950/90 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded shadow border border-cyan-500/30">
            La tua posizione ({selectedCityName})
          </span>
        </div>

        {/* Dynamic Maker Pins with PostGIS offsets */}
        {filteredMakers.map((maker, idx) => {
          // Compute cartesian pixel offset relative to center for visual representation
          const deltaLat = maker.lat - coords.lat;
          const deltaLng = maker.lng - coords.lng;
          const pixelX = deltaLng * 3200;
          const pixelY = -deltaLat * 3200;

          const isSelected = selectedMaker?.id === maker.id;

          return (
            <div
              key={maker.id}
              onClick={() => setSelectedMaker(maker)}
              style={{
                transform: `translate(calc(-50% + ${pixelX}px), calc(-50% + ${pixelY}px))`,
              }}
              className="absolute top-1/2 left-1/2 z-15 cursor-pointer transition-all duration-300 hover:scale-110"
            >
              <div className="relative group flex flex-col items-center">
                {/* Cluster or Individual Pin */}
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full shadow-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 border-white ring-4 ring-emerald-500/40 scale-105'
                      : 'bg-slate-900/95 text-white border-emerald-500/60 hover:border-emerald-400'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`} />
                  <span className="text-xs font-semibold">{maker.full_name.split(' ')[0]}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                    {(maker.distance_meters / 1000).toFixed(1)}km
                  </span>
                </div>

                {/* Rating Badge */}
                <div className="mt-0.5 flex items-center gap-0.5 bg-slate-950/90 border border-slate-800 px-1.5 py-0.2 rounded-full text-[9px] text-amber-400 font-semibold shadow">
                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                  {maker.rating_average.toFixed(1)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Mapbox Branding / PostGIS Telemetry info at bottom right */}
        <div className="absolute bottom-4 right-4 z-10 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg p-2 text-[10px] font-mono text-slate-400 flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Supabase PostGIS Spatial Engine</span>
          </div>
          <span className="text-slate-500">
            Makers trovati nel raggio di 30km: <strong className="text-white">{filteredMakers.length}</strong>
          </span>
        </div>
      </div>

      {/* Overlay Card on Maker Selection (Prompt requirement) */}
      {selectedMaker && (
        <div className="absolute bottom-4 left-4 z-20 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                <img
                  src={selectedMaker.avatar_url}
                  alt={selectedMaker.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  {selectedMaker.full_name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  {selectedMaker.city} • <strong className="text-emerald-400 font-mono">{(selectedMaker.distance_meters / 1000).toFixed(1)} km</strong> da te
                </p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg text-amber-400 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {selectedMaker.rating_average.toFixed(1)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {selectedMaker.rating_count} recensioni
              </span>
            </div>
          </div>

          {/* Maker Performance Stats */}
          <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Tasso di completamento</span>
              <span className="font-semibold text-emerald-400 font-mono">{selectedMaker.completion_rate}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Tariffa Macchina</span>
              <span className="font-semibold text-white font-mono">€{selectedMaker.hourly_machine_rate.toFixed(2)}/ora</span>
            </div>
          </div>

          {/* Available Material Badges */}
          <div className="mb-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Materiali Disponibili:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedMaker.materials.map((mat) => (
                <span
                  key={mat}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-200 border border-slate-700"
                >
                  {mat}
                </span>
              ))}
            </div>
          </div>

          {/* CTA: Richiedi Preventivo */}
          <button
            onClick={() => {
              alert(`Preventivo richiesto con successo a ${selectedMaker.full_name}! L'algoritmo avvierà la transazione di Escrow.`);
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Richiedi Preventivo a questo Maker
          </button>
        </div>
      )}
    </div>
  );
};
