'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Repeat, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Tag, 
  ArrowUpRight, 
  Coins, 
  HeartHandshake, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SEED_LISTINGS } from '@/lib/seedData';
import { Listing, Category } from '@/types';
import { createClient } from '@/lib/supabase/client';

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>(SEED_LISTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  const [showFiltersMobile, setShowFiltersMobile] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadListings() {
      setLoading(true);

      try {
        const queryParams = new URLSearchParams({
          search: searchTerm,
          category: selectedCategory,
          condition: selectedCondition,
          listingType: selectedType,
          priceRange: selectedPriceRange,
          sortBy,
        });

        const res = await fetch(`/api/marketplace?${queryParams.toString()}`);
        const data = await res.json();

        if (res.ok && data.success && data.listings && isMounted) {
          // Merge local session storage listings created in demo mode
          let combinedListings: Listing[] = data.listings;
          if (typeof window !== 'undefined') {
            try {
              const localListingsStr = sessionStorage.getItem('user_listings');
              if (localListingsStr) {
                const localListings: Listing[] = JSON.parse(localListingsStr);
                combinedListings = [...localListings, ...data.listings];
              }
            } catch (e) {
              console.warn('Local listings error:', e);
            }
          }
          setListings(combinedListings);
        }
      } catch (err) {
        console.warn('Marketplace fetch operating in demo mode fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadListings();
    }, 250);

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [searchTerm, selectedCategory, selectedCondition, selectedType, selectedPriceRange, sortBy]);

  // Client-side filtering pass on combined listings
  const filteredListings = listings.filter((item) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query || 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.material && item.material.toLowerCase().includes(query));

    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesCond = selectedCondition === 'All' || item.condition === selectedCondition;
    const matchesType = selectedType === 'All' || (item.listing_type || (item.price === 0 ? 'Donate' : 'Sell')) === selectedType;

    let matchesPrice = true;
    if (selectedPriceRange === 'free') matchesPrice = item.price === 0;
    else if (selectedPriceRange === 'under_500') matchesPrice = item.price > 0 && item.price <= 500;
    else if (selectedPriceRange === '500_2000') matchesPrice = item.price > 500 && item.price <= 2000;
    else if (selectedPriceRange === '2000_plus') matchesPrice = item.price > 2000;

    return matchesSearch && matchesCat && matchesCond && matchesType && matchesPrice;
  });

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Repeat className="w-3.5 h-3.5 text-brand-600" />
            <span>Peer-to-Peer Circular Network</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Give It a Second Life.</h1>
          <p className="text-slate-500 text-sm mt-1">Browse usable unwanted items listed for reuse and donation by your community.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link href="/centers">
            <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold">
              <MapPin className="w-5 h-5 text-brand-600" />
              <span>Find Nearby Centers</span>
            </Button>
          </Link>
          <Link href="/create-listing">
            <Button size="lg" className="shadow-md shadow-brand-600/20 font-bold">
              <Plus className="w-5 h-5" />
              <span>List an Item (+15 Pts)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar Container */}
      <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search items, furniture, electronics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters & Sorting Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-slate-50"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter & Sort</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Badges Row (Desktop & Toggleable Mobile) */}
        <div className={`space-y-3 pt-3 border-t border-slate-100 ${showFiltersMobile ? 'block' : 'hidden md:block'}`}>
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
            {['All', 'Furniture', 'Electronics', 'Textile', 'Paper', 'Glass', 'Metal', 'Plastic', 'Other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Type & Condition Pills */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Type:</span>
              {['All', 'Sell', 'Donate'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedType === t
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Condition:</span>
              {['All', 'New', 'Like New', 'Good', 'Fair', 'Needs Repair'].map((cond) => (
                <button
                  key={cond}
                  onClick={() => setSelectedCondition(cond)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedCondition === cond
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-72 animate-pulse bg-slate-100 border-slate-200" />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="p-12 text-center space-y-4 bg-slate-50 border-dashed border-slate-300">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
            <Repeat className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Give something useful a second life.</h3>
            <p className="text-xs text-slate-500">
              No active marketplace items matched your filter query. Be the first to list an unwanted item for reuse or donation!
            </p>
          </div>
          <Link href="/create-listing" className="inline-block pt-2">
            <Button size="lg" className="shadow-md shadow-brand-600/20">
              <Plus className="w-5 h-5" />
              <span>Create Listing</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => {
            const isDonate = item.price === 0 || item.listing_type === 'Donate';
            return (
              <Card key={item.id} className="p-0 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                      isDonate 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-900 text-white'
                    }`}>
                      {isDonate ? 'FREE / DONATION' : `$${item.price}`}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="text-slate-700">{item.category}</span>
                      <span>•</span>
                      <span>{item.condition}</span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 mt-1 line-clamp-1 group-hover:text-brand-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-[150px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {item.location}
                    </span>

                    <Link href={`/marketplace/${item.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        <span>View Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
