'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Tag, 
  ShieldCheck, 
  HeartHandshake, 
  CheckCircle2, 
  Coins, 
  User, 
  Clock, 
  AlertCircle,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SEED_LISTINGS, DEMO_USER_PROFILE } from '@/lib/seedData';
import { Listing } from '@/types';
import { createClient } from '@/lib/supabase/client';

export default function MarketplaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [requested, setRequested] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function loadListingDetail() {
      // Get current logged in user ID
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user && isMounted) {
          setCurrentUserId(userData.user.id);
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      }

      // Check if user already requested this item in local session
      if (typeof window !== 'undefined') {
        const reqLocal = sessionStorage.getItem(`req-${listingId}`);
        if (reqLocal && isMounted) {
          setRequested(true);
        }
      }

      // 1. Try local session created listings first
      if (typeof window !== 'undefined') {
        try {
          const localListingsStr = sessionStorage.getItem('user_listings');
          if (localListingsStr) {
            const localListings: Listing[] = JSON.parse(localListingsStr);
            const foundLocal = localListings.find((l) => l.id === listingId);
            if (foundLocal && isMounted) {
              setListing(foundLocal);
              return;
            }
          }
        } catch (e) {
          console.warn('Local listing fetch error:', e);
        }
      }

      // 2. Query Supabase database by ID if UUID
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('listings')
          .select('*, user_profile:profiles(id, full_name, avatar_url, email)')
          .eq('id', listingId)
          .single();

        if (data && !error && isMounted) {
          setListing({
            id: data.id,
            user_id: data.user_id,
            title: data.title,
            description: data.description,
            category: data.category,
            condition: data.condition,
            material: data.material || 'Mixed',
            price: Number(data.price),
            image_url: data.image_url,
            location: data.location,
            listing_type: data.listing_type || (Number(data.price) === 0 ? 'Donate' : 'Sell'),
            status: data.status || 'active',
            created_at: data.created_at,
            user_profile: data.user_profile,
          });

          // Check if current user requested this item in DB
          if (currentUserId) {
            const { data: reqData } = await supabase
              .from('listing_requests')
              .select('id')
              .eq('listing_id', listingId)
              .eq('requester_id', currentUserId);

            if (reqData && reqData.length > 0 && isMounted) {
              setRequested(true);
            }
          }
          return;
        }
      } catch (err) {
        console.warn('Database listing detail fetch operating in demo mode:', err);
      }

      // 3. Fallback to seed listing match
      if (isMounted) {
        const seedMatch = SEED_LISTINGS.find((l) => l.id === listingId) || SEED_LISTINGS[0];
        setListing(seedMatch);
      }
    }

    loadListingDetail();
    return () => {
      isMounted = false;
    };
  }, [listingId, currentUserId]);

  const isOwner = listing && (
    (currentUserId && currentUserId === listing.user_id) || 
    listing.user_id === DEMO_USER_PROFILE.id
  );

  const handleRequestItem = async () => {
    if (!listing || requested || isSubmitting || isOwner) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/marketplace/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          sellerId: listing.user_id,
          message: `Interested in receiving ${listing.title} for second life reuse.`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not send request.');
      }

      setRequested(true);
      setStatusMessage('Request sent! The owner will be notified to arrange pickup.');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`req-${listingId}`, 'true');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Could not send request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkCompleted = async (newStatus: 'sold' | 'donated') => {
    if (!listing) return;
    try {
      const supabase = createClient();
      await supabase.from('listings').update({ status: newStatus }).eq('id', listing.id);
      setListing((prev) => prev ? { ...prev, status: newStatus } : null);
      setStatusMessage(`Listing updated to ${newStatus}.`);
    } catch (e) {
      console.warn('Status update error:', e);
    }
  };

  if (!listing) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Loading listing details...</p>
      </div>
    );
  }

  const isDonate = listing.price === 0 || listing.listing_type === 'Donate';

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Back button */}
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Marketplace</span>
      </Link>

      {/* Request Confirmation Banner */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-medium text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{statusMessage}</span>
          </div>
          <span className="font-bold uppercase tracking-wider text-[10px] bg-white/20 px-2.5 py-1 rounded-full">
            Status: {listing.status}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Detail Grid */}
      <div className="grid md:grid-cols-12 gap-8">
        {/* Left Column: Large Image */}
        <div className="md:col-span-6 space-y-4">
          <Card className="p-3 bg-slate-900 border-slate-800 overflow-hidden shadow-lg">
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
              <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
            </div>
          </Card>
        </div>

        {/* Right Column: Listing Details & Interactions */}
        <div className="md:col-span-6 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{listing.category}</span>
              <span>•</span>
              <span className="text-slate-600">Condition: {listing.condition}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">{listing.title}</h1>
            <p className="text-3xl font-black text-brand-600 mt-2">
              {isDonate ? 'FREE / DONATION' : `$${listing.price}`}
            </p>
          </div>

          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{listing.description}</p>
            {listing.material && (
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                <strong>Material:</strong> {listing.material}
              </p>
            )}
          </Card>

          {/* Seller Information */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <img 
                src={listing.user_profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                alt="Seller" 
                className="w-10 h-10 rounded-full object-cover border border-slate-300"
              />
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Listed By</span>
                <span className="font-bold text-slate-900 text-sm">{listing.user_profile?.full_name || 'Eco Pioneer'}</span>
              </div>
            </div>

            <div className="text-right text-slate-400">
              <span className="flex items-center gap-1 justify-end"><MapPin className="w-3.5 h-3.5" /> {listing.location}</span>
              <span className="flex items-center gap-1 justify-end text-[10px] mt-0.5"><Clock className="w-3 h-3" /> {new Date(listing.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action Buttons: Request Item / Owner Controls */}
          <div className="pt-2">
            {isOwner ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-900 text-white font-bold text-xs text-center">
                  ⭐ Your Listing
                </div>
                {listing.status === 'active' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" onClick={() => handleMarkCompleted('sold')}>
                      Mark as Sold
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleMarkCompleted('donated')}>
                      Mark as Donated
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button 
                size="lg" 
                className="w-full shadow-md shadow-brand-600/20"
                disabled={requested || isSubmitting}
                onClick={handleRequestItem}
              >
                {requested ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-200" />
                    <span>Request Sent</span>
                  </>
                ) : (
                  <>
                    <HeartHandshake className="w-5 h-5" />
                    <span>{isSubmitting ? 'Sending Request...' : 'Request Item for Second Life'}</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Contextual Circular Center Finder Box */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Looking for specialized drop-off or repair cafes near you?</span>
            </div>
            <Link href={`/centers?material=${listing.category}`}>
              <Button size="sm" variant="outline" className="text-xs bg-white border-slate-300 font-bold shrink-0">
                Find Centers →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
