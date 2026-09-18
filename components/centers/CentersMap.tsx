'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, ExternalLink, Phone, Clock, Layers } from 'lucide-react';
import { CircularCenter } from '@/types';
import { getDirectionsUrl, formatDistance } from '@/lib/services/centers';

interface CentersMapProps {
  centers: CircularCenter[];
  selectedCenterId: string | null;
  onSelectCenter: (id: string | null) => void;
  userLocation: { lat: number; lng: number } | null;
}

export function CentersMap({
  centers,
  selectedCenterId,
  onSelectCenter,
  userLocation,
}: CentersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [googleMapLoaded, setGoogleMapLoaded] = useState<boolean>(false);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  // Load Google Maps JavaScript API script
  useEffect(() => {
    if (!googleMapsApiKey) return;

    if ((window as any).google?.maps) {
      setGoogleMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleMapLoaded(true);
      script.onerror = () => console.warn('Failed to load Google Maps JavaScript API script.');
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setGoogleMapLoaded(true));
    }
  }, [googleMapsApiKey]);

  // Render/update Google Map instance
  useEffect(() => {
    if (!googleMapLoaded || !mapRef.current || !(window as any).google?.maps) return;

    const google = (window as any).google;

    // Determine map center coordinates
    const defaultCenter = userLocation || (centers.length > 0 
      ? { lat: centers[0].latitude, lng: centers[0].longitude } 
      : { lat: 37.7749, lng: -122.4194 });

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: userLocation ? 13 : 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
          { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#38bdf8' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#090d16' }] },
        ],
      });
    } else {
      mapInstanceRef.current.setCenter(defaultCenter);
    }

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Add User Location Marker
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: userLocation,
        map: mapInstanceRef.current,
        title: 'You Are Here',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });
      markersRef.current.push(userMarker);
    }

    // Add Place Markers
    centers.forEach((center) => {
      if (!center.latitude || !center.longitude) return;

      const isSelected = center.id === selectedCenterId;
      const markerColor = 
        center.type === 'Repair' ? '#f59e0b' :
        center.type === 'Donation' ? '#f43f5e' :
        center.type === 'E-waste' ? '#6366f1' : '#10b981';

      const marker = new google.maps.Marker({
        position: { lat: center.latitude, lng: center.longitude },
        map: mapInstanceRef.current,
        title: center.name,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: isSelected ? 7 : 5,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        onSelectCenter(center.id);
      });

      markersRef.current.push(marker);
    });
  }, [googleMapLoaded, centers, userLocation, selectedCenterId, onSelectCenter]);

  const selectedCenter = centers.find((c) => c.id === selectedCenterId);

  // Fallback vector coordinates calculation if Google Maps key not present
  const lats = centers.map((c) => c.latitude).concat(userLocation ? [userLocation.lat] : []);
  const lngs = centers.map((c) => c.longitude).concat(userLocation ? [userLocation.lng] : []);

  const minLat = Math.min(...(lats.length ? lats : [37.73]));
  const maxLat = Math.max(...(lats.length ? lats : [37.80]));
  const minLng = Math.min(...(lngs.length ? lngs : [-122.44]));
  const maxLng = Math.max(...(lngs.length ? lngs : [-122.40]));

  const latSpan = maxLat - minLat || 0.05;
  const lngSpan = maxLng - minLng || 0.05;

  const getCoords = (lat: number, lng: number) => {
    const y = 85 - ((lat - minLat) / latSpan) * 70;
    const x = 15 + ((lng - minLng) / lngSpan) * 70;
    return { x, y };
  };

  const getTypeColor = (type: CircularCenter['type']) => {
    switch (type) {
      case 'Repair':
        return 'bg-amber-500 text-white border-amber-300 ring-amber-400';
      case 'Donation':
        return 'bg-rose-500 text-white border-rose-300 ring-rose-400';
      case 'E-waste':
        return 'bg-indigo-500 text-white border-indigo-300 ring-indigo-400';
      case 'Recycling':
      default:
        return 'bg-emerald-500 text-white border-emerald-300 ring-emerald-400';
    }
  };

  return (
    <div className="relative w-full h-[460px] rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between">
      {/* Top Map Header Controls */}
      <div className="relative z-10 p-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>{googleMapsApiKey ? 'Live Google Maps' : 'Interactive Map'}</span>
          {googleMapsApiKey ? (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
              Google Maps API Active
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
              Demo Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold hidden sm:flex">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Recycling</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />E-Waste</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Repair</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />Donation</span>
        </div>
      </div>

      {/* Render Real Google Map container when key is present */}
      {googleMapsApiKey ? (
        <div className="relative flex-1 w-full h-full">
          <div ref={mapRef} className="w-full h-full" />

          {/* Selected Center Info Window Overlay */}
          {selectedCenter && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-30 p-4 rounded-2xl bg-slate-900/95 border border-slate-700 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                    selectedCenter.type === 'Repair' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    selectedCenter.type === 'Donation' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    selectedCenter.type === 'E-waste' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {selectedCenter.type}
                  </span>
                  <h4 className="font-bold text-sm text-slate-100 mt-1.5">{selectedCenter.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{selectedCenter.address}</span>
                  </p>
                </div>
                <button
                  onClick={() => onSelectCenter(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                {selectedCenter.distance_km !== undefined ? (
                  <span className="text-[11px] font-bold text-emerald-400">
                    {formatDistance(selectedCenter.distance_km)}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">Google Place</span>
                )}

                <a
                  href={getDirectionsUrl(selectedCenter)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Fallback Vector Map UI when API key is not configured */
        <div className="relative flex-1 w-full h-full p-4">
          <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <path d="M 10 20 Q 50 80 90 30" stroke="#475569" strokeWidth="2" fill="none" strokeDasharray="4,4" />
            <path d="M 20 90 Q 60 10 80 70" stroke="#334155" strokeWidth="1.5" fill="none" />
          </svg>

          {userLocation && (() => {
            const { x, y } = getCoords(userLocation.lat, userLocation.lng);
            return (
              <div
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                title="Your Location"
              >
                <span className="absolute -inset-2 rounded-full bg-blue-500/40 animate-ping" />
                <div className="relative w-6 h-6 rounded-full bg-blue-600 text-white border-2 border-white flex items-center justify-center">
                  <Navigation className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
            );
          })()}

          {centers.map((center) => {
            const { x, y } = getCoords(center.latitude, center.longitude);
            const isSelected = selectedCenterId === center.id;
            const colorClass = getTypeColor(center.type);

            return (
              <button
                key={center.id}
                onClick={() => onSelectCenter(isSelected ? null : center.id)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all ${
                  isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                }`}
              >
                <div className={`relative px-2.5 py-1 rounded-full text-[11px] font-black border-2 flex items-center gap-1.5 ${colorClass}`}>
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[110px]">{center.name.split(' ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

