import { createClient } from '@/lib/supabase/client';
import { SEED_CENTERS } from '@/lib/seedData';
import { CircularCenter } from '@/types';

export interface FetchPlacesParams {
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  query?: string;
  material?: string;
}

/**
 * Fetch real Google Places from /api/places/search endpoint
 */
export async function fetchRealGooglePlaces(params: FetchPlacesParams): Promise<{
  isConfigured: boolean;
  places: CircularCenter[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/places/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        isConfigured: json.isConfigured !== false,
        places: [],
        error: json.error || `HTTP ${res.status}: Failed to fetch places from Google Places API.`,
      };
    }

    return {
      isConfigured: json.isConfigured !== false,
      places: json.places || [],
      error: json.error,
    };
  } catch (err: any) {
    console.warn('Error fetching Google Places:', err);
    return {
      isConfigured: true,
      places: [],
      error: err.message || 'Network error fetching Google Places.',
    };
  }
}

/**
 * Fetch all circular centers from Supabase or fallback to seed data
 */
export async function getCenters(): Promise<CircularCenter[]> {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (!isDemo) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as CircularCenter[];
      }
    } catch (err) {
      console.warn('Supabase fetch centers fallback to seed data:', err);
    }
  }

  return SEED_CENTERS;
}

/**
 * Haversine formula to compute geographical distance between two lat/lng points in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Format distance value for display (e.g. "850 m away" vs "1.8 km away")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Generate a Google Maps directions URL for a given center address or coordinates
 */
export function getDirectionsUrl(center: CircularCenter): string {
  if (center.googleMapsUri) {
    return center.googleMapsUri;
  }
  if (center.latitude && center.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(center.address)}`;
}

