'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  MapPin, 
  Search, 
  Phone, 
  Navigation, 
  Wrench, 
  Recycle, 
  HeartHandshake, 
  ShieldCheck, 
  ExternalLink,
  Clock,
  Compass,
  Map as MapIcon,
  List,
  RefreshCw,
  AlertCircle,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CircularCenter } from '@/types';
import { 
  fetchRealGooglePlaces, 
  getCenters, 
  calculateHaversineDistance, 
  formatDistance, 
  getDirectionsUrl 
} from '@/lib/services/centers';
import { CentersMap } from '@/components/centers/CentersMap';

const MATERIAL_OPTIONS = [
  'All Materials',
  'Plastic',
  'Paper',
  'Glass',
  'Metal',
  'Textile',
  'Electronics',
  'Furniture',
  'Organic'
];

function CentersPageContent() {
  const searchParams = useSearchParams();

  const [centers, setCenters] = useState<CircularCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isGooglePowered, setIsGooglePowered] = useState<boolean>(false);

  // Filters & View State
  const [filterType, setFilterType] = useState<string>('All');
  const [filterMaterial, setFilterMaterial] = useState<string>('All Materials');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Perform Google Places Search or Fallback
  const performSearch = useCallback(async (
    latLng?: { lat: number; lng: number } | null,
    category = filterType,
    mat = filterMaterial,
    query = searchTerm
  ) => {
    setIsLoading(true);
    setFetchError(null);

    const loc = latLng || userLocation || { lat: 37.7749, lng: -122.4194 };

    const response = await fetchRealGooglePlaces({
      lat: loc.lat,
      lng: loc.lng,
      radius: 15000,
      category,
      query,
      material: mat,
    });

    if (response.isConfigured && response.places && response.places.length > 0) {
      setIsGooglePowered(true);

      // Compute distances and sort by nearest
      const updated = response.places.map((place) => ({
        ...place,
        distance_km: calculateHaversineDistance(loc.lat, loc.lng, place.latitude, place.longitude),
      })).sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));

      setCenters(updated);
    } else {
      setIsGooglePowered(false);
      if (response.error) {
        setFetchError(response.error);
      }

      // Fallback to Supabase / Seed Centers
      const fallbackData = await getCenters();
      const updated = fallbackData.map((center) => ({
        ...center,
        distance_km: calculateHaversineDistance(loc.lat, loc.lng, center.latitude, center.longitude),
      })).sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));

      setCenters(updated);
    }

    setIsLoading(false);
  }, [userLocation, filterType, filterMaterial, searchTerm]);

  // Read URL search params on mount
  useEffect(() => {
    const paramType = searchParams.get('type');
    const paramMaterial = searchParams.get('material');
    const paramSearch = searchParams.get('search');

    let initialType = filterType;
    let initialMaterial = filterMaterial;
    let initialSearch = searchTerm;

    if (paramType) {
      const formattedType = paramType.charAt(0).toUpperCase() + paramType.slice(1).toLowerCase();
      if (['Recycling', 'Repair', 'Donation'].includes(formattedType)) {
        initialType = formattedType;
        setFilterType(formattedType);
      } else if (paramType.toLowerCase().includes('e-waste')) {
        initialType = 'E-waste';
        setFilterType('E-waste');
      }
    }

    if (paramMaterial) {
      const match = MATERIAL_OPTIONS.find(m => m.toLowerCase() === paramMaterial.toLowerCase());
      if (match) {
        initialMaterial = match;
        setFilterMaterial(match);
      }
    }

    if (paramSearch) {
      initialSearch = paramSearch;
      setSearchTerm(paramSearch);
    }

    performSearch(null, initialType, initialMaterial, initialSearch);
  }, [searchParams]);

  // Handle Category Filter Change
  const handleTypeChange = (newType: string) => {
    setFilterType(newType);
    performSearch(userLocation, newType, filterMaterial, searchTerm);
  };

  // Handle Material Filter Change
  const handleMaterialChange = (newMat: string) => {
    setFilterMaterial(newMat);
    performSearch(userLocation, filterType, newMat, searchTerm);
  };

  // Handle Search Input Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(userLocation, filterType, filterMaterial, searchTerm);
  };

  // Request user location when explicitly clicked
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const loc = { lat: userLat, lng: userLng };
        setUserLocation(loc);

        setIsLocating(false);
        setLocationNotice('Location updated! Finding nearby Google Places...');

        performSearch(loc, filterType, filterMaterial, searchTerm);
      },
      (error) => {
        console.warn('Location permission denied or unavailable:', error.message);
        setIsLocating(false);
        setLocationNotice('Location permission was denied. Searching around default metro area.');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const clearAllFilters = () => {
    setFilterType('All');
    setFilterMaterial('All Materials');
    setSearchTerm('');
    performSearch(userLocation, 'All', 'All Materials', '');
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-brand-400" />
            <span>Google Places Infrastructure Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Circular Centers</h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Locate nearby certified recycling facilities, community repair cafes, textile drop-offs, and e-waste collection points powered by Google Places.
          </p>
        </div>

        {/* Action Button: Use My Location */}
        <div className="mt-6 sm:mt-0 sm:absolute sm:right-6 sm:bottom-6 z-10 flex flex-col items-start sm:items-end gap-2">
          <Button
            onClick={handleUseLocation}
            disabled={isLocating}
            className="bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs py-2.5 px-4 shadow-lg flex items-center gap-2 border-0"
          >
            {isLocating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 fill-current" />
            )}
            <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
          </Button>

          {locationNotice && (
            <span className="text-[11px] font-semibold text-emerald-300 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-700">
              {locationNotice}
            </span>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        {/* Row 1: Search Form & View Switcher */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by center, place name, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    performSearch(userLocation, filterType, filterMaterial, '');
                  }}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            <Button type="submit" size="sm" className="shrink-0 text-xs font-bold">
              Search
            </Button>
          </form>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-stretch md:self-auto justify-center">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'split'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Only</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map Only</span>
            </button>
          </div>
        </div>

        {/* Row 2: Center Type Filter Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Type:</span>
            {[
              { label: 'All', type: 'All', icon: Compass },
              { label: '♻️ Recycling', type: 'Recycling', icon: Recycle },
              { label: '🔋 E-Waste', type: 'E-waste', icon: ShieldCheck },
              { label: '🔧 Repair', type: 'Repair', icon: Wrench },
              { label: '💚 Donation', type: 'Donation', icon: HeartHandshake },
            ].map((btn) => (
              <button
                key={btn.type}
                onClick={() => handleTypeChange(btn.type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === btn.type
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Material Query Select Filter (Option B) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Material Query:</span>
            <select
              value={filterMaterial}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-auto"
            >
              {MATERIAL_OPTIONS.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Live Status Badge */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {isGooglePowered ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Google Places Data</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Demo Locations</span>
            </span>
          )}

          {filterMaterial !== 'All Materials' && (
            <span className="text-xs text-slate-500 font-medium">
              • Material query: <strong className="text-slate-800">{filterMaterial}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Fetch Error Notice */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
        </div>
      )}

      {/* Polished Loading State */}
      {isLoading ? (
        <div className="py-16 text-center space-y-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-700 font-bold text-base">Finding nearby circular centers...</p>
          <p className="text-slate-400 text-xs">Querying Google Places API around coordinates</p>
        </div>
      ) : (
        /* Main View Layout */
        <div className="space-y-6">
          {/* Map View Section (Shown in Split & Map Modes) */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <CentersMap
              centers={centers}
              selectedCenterId={selectedCenterId}
              onSelectCenter={setSelectedCenterId}
              userLocation={userLocation}
            />
          )}

          {/* Cards List Section (Shown in Split & List Modes) */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg text-slate-900">
                  {centers.length} {centers.length === 1 ? 'Center' : 'Centers'} Found
                </h3>
                {(filterType !== 'All' || filterMaterial !== 'All Materials' || searchTerm) && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-bold text-brand-600 hover:underline"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>

              {centers.length === 0 ? (
                /* Empty State */
                <Card className="p-12 text-center space-y-4 border-dashed border-2 border-slate-300">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">No matching circular centers found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Try adjusting your search keywords, clearing material queries, or expanding your location search.
                    </p>
                  </div>
                  <Button onClick={clearAllFilters} size="sm" variant="outline" className="text-xs font-bold">
                    Clear Filters & Reset
                  </Button>
                </Card>
              ) : (
                /* Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {centers.map((center) => {
                    const isSelected = selectedCenterId === center.id;
                    return (
                      <Card
                        key={center.id}
                        className={`p-6 space-y-4 transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-brand-500 border-brand-300 shadow-md bg-brand-50/20'
                            : 'hover:shadow-md border-slate-200'
                        }`}
                        onClick={() => setSelectedCenterId(center.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  center.type === 'Repair'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : center.type === 'Donation'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : center.type === 'E-waste'
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {center.type} Center
                              </span>
                              {center.business_status && (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  {center.business_status}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mt-2 leading-snug">{center.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{center.address}</span>
                            </p>
                          </div>

                          {center.distance_km !== undefined && (
                            <span className="text-xs font-extrabold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-xl border border-brand-200 shrink-0">
                              {formatDistance(center.distance_km)}
                            </span>
                          )}
                        </div>

                        {/* Operating Hours & Phone (Only displayed if returned by Google API) */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{center.hours || 'Information unavailable'}</span>
                          </span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{center.phone || 'Information unavailable'}</span>
                          </span>
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                          {center.isRealGooglePlace ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                              <Globe className="w-3 h-3 text-emerald-600" />
                              <span>Google Verified Place</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                              Demo Location
                            </span>
                          )}

                          <a
                            href={getDirectionsUrl(center)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
                          >
                            <span>Open in Google Maps</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CentersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-bold">Loading Google Places Circular Infrastructure Directory...</p>
        </div>
      }
    >
      <CentersPageContent />
    </Suspense>
  );
}

