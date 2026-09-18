'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera, 
  Sparkles, 
  Plus, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  HeartHandshake, 
  Coins, 
  X, 
  Tag, 
  MapPin, 
  ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Category } from '@/types';

function CreateListingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<Category>('Furniture');
  const [condition, setCondition] = useState<string>('Good');
  const [material, setMaterial] = useState<string>('Wood & Metal');
  const [listingType, setListingType] = useState<'Sell' | 'Donate'>('Sell');
  const [price, setPrice] = useState<string>('0');
  const [location, setLocation] = useState<string>('Downtown Metro Area');

  // UI state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Prefill from scanner if came from /scan/[id] -> List This Item
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const scanPrefillStr = sessionStorage.getItem('prefill_listing');
      if (scanPrefillStr) {
        try {
          const scan = JSON.parse(scanPrefillStr);
          if (scan.image_url) setImagePreview(scan.image_url);
          if (scan.item_name) setTitle(`${scan.item_name} – Pre-owned`);
          if (scan.category) setCategory(scan.category);
          if (scan.condition) setCondition(scan.condition);
          if (scan.material) setMaterial(scan.material);
          if (scan.reason) setDescription(`Pre-owned ${scan.item_name} in ${scan.condition} condition. ${scan.reason}`);
          if (scan.recommended_action === 'Donate') {
            setListingType('Donate');
            setPrice('0');
          }
          sessionStorage.removeItem('prefill_listing');
        } catch (e) {
          console.warn('Prefill parse error:', e);
        }
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Image size exceeds 10 MB limit. Please select a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIGenerate = async () => {
    if (!imagePreview || isGenerating) return;
    setIsGenerating(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/create-listing-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI Listing Generator failed.');
      }

      const listing = data.listing;
      if (listing.title) setTitle(listing.title);
      if (listing.description) setDescription(listing.description);
      if (listing.category) setCategory(listing.category as Category);
      if (listing.condition) setCondition(listing.condition);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI generation failed. Please fill in details manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleListingTypeChange = (type: 'Sell' | 'Donate') => {
    setListingType(type);
    if (type === 'Donate') {
      setPrice('0');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      setErrorMsg('Please upload or select an item image before publishing.');
      return;
    }

    setIsPublishing(true);
    setErrorMsg('');

    try {
      const payload = {
        title,
        description,
        category,
        condition,
        material,
        price: listingType === 'Donate' ? 0 : Number(price),
        image_url: imagePreview,
        location,
        listing_type: listingType,
      };

      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish listing.');
      }

      if (typeof window !== 'undefined') {
        try {
          const localListingsStr = sessionStorage.getItem('user_listings');
          const localListings = localListingsStr ? JSON.parse(localListingsStr) : [];
          localListings.unshift(data.listing);
          sessionStorage.setItem('user_listings', JSON.stringify(localListings));
        } catch (e) {
          console.warn('Local listings cache error:', e);
        }
      }

      router.push(`/marketplace/${data.listing.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error publishing listing. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Marketplace</span>
      </Link>

      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Earn +15 Eco Points on Publish</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">List an Item for Second Life</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload a photo or let AI auto-generate your title, description & material details.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button type="button" onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Listing Type Toggle: Sell vs Donate */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Listing Destination Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleListingTypeChange('Sell')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                listingType === 'Sell'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Sell Item</span>
            </button>

            <button
              type="button"
              onClick={() => handleListingTypeChange('Donate')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                listingType === 'Donate'
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-brand-200" />
              <span>Donate (Free to Neighbor)</span>
            </button>
          </div>
        </div>

        {/* Photo Upload Zone */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Item Photo</label>
          {!imagePreview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-brand-50/20 transition-all space-y-2"
            >
              <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-800">Upload Photo or Drop Image Here</p>
              <p className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP (Max 10 MB)</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm">
                <img src={imagePreview} alt="Listing Preview" className="w-full h-full object-contain" />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAIGenerate}
                  disabled={isGenerating}
                  className="flex-1 border-brand-200 text-brand-700 hover:bg-brand-50"
                >
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>{isGenerating ? 'AI Generating Title & Details...' : '✨ Generate Listing with AI'}</span>
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setImagePreview(null)}
                  disabled={isGenerating}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solid Oak Study Chair – Refinished Good Condition"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item condition, pickup details, and origin story..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {['Furniture', 'Electronics', 'Textile', 'Paper', 'Glass', 'Metal', 'Plastic', 'Organic', 'Other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {['New', 'Like New', 'Good', 'Fair', 'Needs Repair'].map((cond) => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Material Composition</label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Solid Wood, Cotton Denim, Glass"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price ($0 for Donation)</label>
              <input
                type="number"
                min="0"
                disabled={listingType === 'Donate'}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm disabled:bg-slate-100 disabled:text-slate-400 font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Location</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Downtown Eco District / Westside"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <Button type="submit" size="lg" className="w-full shadow-md shadow-brand-600/20" disabled={isPublishing}>
            <Plus className="w-5 h-5" />
            <span>{isPublishing ? 'Publishing Listing...' : 'Publish Marketplace Listing (+15 Eco Pts)'}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function CreateListingPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Loading listing editor...</p>
      </div>
    }>
      <CreateListingForm />
    </Suspense>
  );
}
