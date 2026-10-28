'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { NearbyMaker } from '@/types/database';

// Sample mock makers for Italian cities in case database is freshly launched
const MOCK_ITALIAN_MAKERS: NearbyMaker[] = [
  {
    id: 'm1-milano',
    full_name: 'Marco Rossi (Milano 3D Hub)',
    city: 'Milano',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    distance_meters: 3200,
    rating_average: 4.95,
    rating_count: 84,
    completion_rate: 98.5,
    active_orders_count: 1,
    max_active_orders: 4,
    materials: ['PLA', 'PETG', 'Resina', 'TPU'],
    hourly_machine_rate: 3.80,
    lat: 45.4642,
    lng: 9.1900,
  },
  {
    id: 'm2-sesto',
    full_name: 'Studio Lab Maker Sesto',
    city: 'Sesto San Giovanni',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    distance_meters: 8400,
    rating_average: 4.88,
    rating_count: 42,
    completion_rate: 100.0,
    active_orders_count: 2,
    max_active_orders: 3,
    materials: ['PLA', 'ABS', 'Carbon Fiber PLA'],
    hourly_machine_rate: 4.20,
    lat: 45.5328,
    lng: 9.2294,
  },
  {
    id: 'm3-monza',
    full_name: 'Brianza Rapid Prototyping',
    city: 'Monza',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    distance_meters: 14200,
    rating_average: 4.90,
    rating_count: 61,
    completion_rate: 97.0,
    active_orders_count: 1,
    max_active_orders: 5,
    materials: ['Resina 8K', 'PLA', 'PETG'],
    hourly_machine_rate: 5.00,
    lat: 45.5845,
    lng: 9.2744,
  },
  {
    id: 'm4-roma',
    full_name: 'FabLab Roma Tiburtina',
    city: 'Roma',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    distance_meters: 4100,
    rating_average: 4.92,
    rating_count: 110,
    completion_rate: 99.0,
    active_orders_count: 2,
    max_active_orders: 6,
    materials: ['PLA', 'PETG', 'Nylon', 'Resina'],
    hourly_machine_rate: 3.50,
    lat: 41.9028,
    lng: 12.4964,
  },
  {
    id: 'm5-torino',
    full_name: 'Officina 3D Torino',
    city: 'Torino',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    distance_meters: 2900,
    rating_average: 4.82,
    rating_count: 38,
    completion_rate: 96.0,
    active_orders_count: 0,
    max_active_orders: 3,
    materials: ['PLA', 'PETG', 'ASA'],
    hourly_machine_rate: 3.20,
    lat: 45.0703,
    lng: 7.6869,
  }
];

// Geocoding helper for Italian cities or ZIP codes
export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const normalized = query.trim().toLowerCase();
  
  const knownLocations: Record<string, { lat: number; lng: number; displayName: string }> = {
    'milano': { lat: 45.4642, lng: 9.1900, displayName: 'Milano (MI)' },
    '20121': { lat: 45.4719, lng: 9.1881, displayName: '20121 Milano Centro' },
    'roma': { lat: 41.9028, lng: 12.4964, displayName: 'Roma (RM)' },
    '00185': { lat: 41.8955, lng: 12.5085, displayName: '00185 Roma Termini' },
    'torino': { lat: 45.0703, lng: 7.6869, displayName: 'Torino (TO)' },
    '10121': { lat: 45.0689, lng: 7.6756, displayName: '10121 Torino Centro' },
    'bologna': { lat: 44.4949, lng: 11.3426, displayName: 'Bologna (BO)' },
    'firenze': { lat: 43.7696, lng: 11.2558, displayName: 'Firenze (FI)' },
    'napoli': { lat: 40.8518, lng: 14.2681, displayName: 'Napoli (NA)' },
  };

  if (knownLocations[normalized]) {
    return knownLocations[normalized];
  }

  // OpenStreetMap Nominatim Geocoding API as public service
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Italy')}&limit=1`, {
      headers: { 'User-Agent': 'PrintForge-Marketplace/1.0' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
  } catch (err) {
    console.warn('Geocoding fetch failed, using default Milano coords', err);
  }

  return { lat: 45.4642, lng: 9.1900, displayName: `${query} (Default IT)` };
}

// PostGIS spatial query for makers within radius (default 30km)
export async function getNearbyMakers(lat: number, lng: number, radiusMeters = 30000): Promise<NearbyMaker[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_makers_within_radius', {
      p_lat: lat,
      p_lng: lng,
      p_radius_meters: radiusMeters,
    });

    if (!error && data && data.length > 0) {
      return data as NearbyMaker[];
    }
  } catch (err) {
    console.warn('PostGIS RPC call skipped or not yet migrated, filtering fallback dataset', err);
  }

  // Fallback calculation using Haversine distance formula if PostGIS database is offline
  return MOCK_ITALIAN_MAKERS.map((maker) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat * Math.PI) / 180;
    const phi2 = (maker.lat * Math.PI) / 180;
    const deltaPhi = ((maker.lat - lat) * Math.PI) / 180;
    const deltaLambda = ((maker.lng - lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    return {
      ...maker,
      distance_meters: Math.round(dist),
    };
  })
  .filter((m) => m.distance_meters <= radiusMeters)
  .sort((a, b) => a.distance_meters - b.distance_meters);
}
