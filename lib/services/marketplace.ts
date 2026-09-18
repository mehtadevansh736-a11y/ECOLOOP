import { Listing, Category, ListingType, ListingStatus, ListingRequest } from '@/types';
import { createClientServer } from '@/lib/supabase/server';
import { SEED_DEMO_LISTINGS, DEMO_USER_PROFILE } from '../seedData';

export interface MarketplaceFilterOptions {
  search?: string;
  category?: string;
  condition?: string;
  listingType?: string;
  priceRange?: string; // 'free' | 'under_500' | '500_2000' | '2000_plus'
  sortBy?: 'newest' | 'price_low' | 'price_high';
}

/**
 * Server-side marketplace query helper supporting search, multi-filter, sorting, and user profile joins.
 */
export async function fetchMarketplaceListingsServer(filters: MarketplaceFilterOptions = {}): Promise<Listing[]> {
  try {
    const supabase = await createClientServer();
    let query = supabase
      .from('listings')
      .select('*, user_profile:profiles(id, full_name, avatar_url, email)');

    // Apply category filter
    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }

    // Apply condition filter
    if (filters.condition && filters.condition !== 'All') {
      query = query.eq('condition', filters.condition);
    }

    // Apply listing type filter
    if (filters.listingType && filters.listingType !== 'All') {
      query = query.eq('listing_type', filters.listingType);
    }

    // Apply price range filter
    if (filters.priceRange && filters.priceRange !== 'all') {
      if (filters.priceRange === 'free') {
        query = query.eq('price', 0);
      } else if (filters.priceRange === 'under_500') {
        query = query.gt('price', 0).lte('price', 500);
      } else if (filters.priceRange === '500_2000') {
        query = query.gt('price', 500).lte('price', 2000);
      } else if (filters.priceRange === '2000_plus') {
        query = query.gt('price', 2000);
      }
    }

    // Apply sorting
    if (filters.sortBy === 'price_low') {
      query = query.order('price', { ascending: true });
    } else if (filters.sortBy === 'price_high') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      let results: Listing[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        description: item.description,
        category: item.category as Category,
        condition: item.condition,
        material: item.material || 'Mixed',
        price: Number(item.price),
        image_url: item.image_url,
        location: item.location,
        listing_type: item.listing_type || (item.price === 0 ? 'Donate' : 'Sell'),
        status: (item.status || 'active') as ListingStatus,
        created_at: item.created_at,
        user_profile: item.user_profile || { full_name: 'Eco Pioneer' },
      }));

      // Apply search term filter on server results if search present
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        results = results.filter((item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.material && item.material.toLowerCase().includes(q))
        );
      }

      return results;
    }
  } catch (err) {
    console.warn('Database marketplace query operating in demo mode fallback:', err);
  }

  // Fallback demo listings filtering
  let demoResults = [...SEED_DEMO_LISTINGS];

  if (filters.category && filters.category !== 'All') {
    demoResults = demoResults.filter((l) => l.category === filters.category);
  }

  if (filters.condition && filters.condition !== 'All') {
    demoResults = demoResults.filter((l) => l.condition === filters.condition);
  }

  if (filters.listingType && filters.listingType !== 'All') {
    demoResults = demoResults.filter((l) => (l.listing_type || (l.price === 0 ? 'Donate' : 'Sell')) === filters.listingType);
  }

  if (filters.priceRange && filters.priceRange !== 'all') {
    if (filters.priceRange === 'free') {
      demoResults = demoResults.filter((l) => l.price === 0);
    } else if (filters.priceRange === 'under_500') {
      demoResults = demoResults.filter((l) => l.price > 0 && l.price <= 500);
    } else if (filters.priceRange === '500_2000') {
      demoResults = demoResults.filter((l) => l.price > 500 && l.price <= 2000);
    } else if (filters.priceRange === '2000_plus') {
      demoResults = demoResults.filter((l) => l.price > 2000);
    }
  }

  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    demoResults = demoResults.filter((l) =>
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q)
    );
  }

  if (filters.sortBy === 'price_low') {
    demoResults.sort((a, b) => a.price - b.price);
  } else if (filters.sortBy === 'price_high') {
    demoResults.sort((a, b) => b.price - a.price);
  } else {
    demoResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return demoResults;
}
