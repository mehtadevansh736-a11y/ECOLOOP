import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        isConfigured: false,
        places: [],
        message: 'Google Maps API key is not configured in .env.local.'
      });
    }

    const body = await req.json();
    const { lat, lng, radius = 10000, category = 'All', query = '', material = '' } = body;

    const userLat = Number(lat) || 37.7749;
    const userLng = Number(lng) || -122.4194;

    // Construct search query based on category, material, and user search text
    let searchQuery = '';

    if (query && query.trim() !== '') {
      searchQuery = query.trim();
    } else if (material && material !== 'All Materials') {
      const catText = category !== 'All' ? category : 'recycling donation';
      searchQuery = `${material} ${catText} center near me`;
    } else {
      switch (category) {
        case 'Recycling':
          searchQuery = 'recycling center facility';
          break;
        case 'E-waste':
          searchQuery = 'e-waste electronics recycling center';
          break;
        case 'Repair':
          searchQuery = 'repair shop computer appliance fixing center';
          break;
        case 'Donation':
          searchQuery = 'donation center charity clothing drop off';
          break;
        default:
          searchQuery = 'recycling center or repair shop or donation center';
          break;
      }
    }

    // Call Google Places API (New) Text Search
    const endpoint = 'https://places.googleapis.com/v1/places:searchText';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey.trim(),
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.businessStatus,places.googleMapsUri',
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        locationBias: {
          circle: {
            center: {
              latitude: userLat,
              longitude: userLng,
            },
            radius: Math.min(50000, Math.max(1000, Number(radius))),
          },
        },
        maxResultCount: 20,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[Places API Error]:', response.status, errText);
      return NextResponse.json(
        {
          isConfigured: true,
          error: `Google Places API returned status ${response.status}. Please check Places API (New) enablement in Google Cloud Console.`,
          places: [],
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawPlaces = data.places || [];

    // Map raw Google Places to EcoLoop CircularCenter structure
    const places = rawPlaces.map((place: any) => {
      let mappedType: 'Recycling' | 'Repair' | 'Donation' | 'E-waste' = 'Recycling';
      const typesStr = (place.types || []).join(' ').toLowerCase() + ' ' + (place.primaryType || '').toLowerCase();

      if (typesStr.includes('repair') || typesStr.includes('fix')) {
        mappedType = 'Repair';
      } else if (typesStr.includes('donation') || typesStr.includes('charity') || typesStr.includes('thrift')) {
        mappedType = 'Donation';
      } else if (typesStr.includes('electron') || typesStr.includes('computer') || typesStr.includes('waste')) {
        mappedType = 'E-waste';
      } else if (category === 'Repair' || category === 'Donation' || category === 'E-waste') {
        mappedType = category;
      }

      // Material claims based on text query if material selected
      const acceptedMaterials: string[] = [];
      if (material && material !== 'All Materials') {
        acceptedMaterials.push(`${material} (Query Match)`);
      }

      return {
        id: place.id || `place-${Math.random().toString(36).slice(2)}`,
        name: place.displayName?.text || 'Circular Infrastructure Center',
        type: mappedType,
        address: place.formattedAddress || 'Information unavailable',
        latitude: place.location?.latitude || userLat,
        longitude: place.location?.longitude || userLng,
        accepted_materials: acceptedMaterials.length > 0 ? acceptedMaterials : ['Verified Location'],
        business_status: place.businessStatus || undefined,
        googleMapsUri: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text || 'Center')}`,
        isRealGooglePlace: true,
      };
    });

    return NextResponse.json({
      isConfigured: true,
      places,
      count: places.length,
    });
  } catch (error: any) {
    console.error('Places API route error:', error);
    return NextResponse.json(
      { isConfigured: true, error: error.message || 'Failed to fetch places from Google Places API.', places: [] },
      { status: 500 }
    );
  }
}
