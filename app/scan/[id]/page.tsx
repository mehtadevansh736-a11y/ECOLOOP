'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Wrench, 
  Repeat, 
  HeartHandshake, 
  Coins, 
  Recycle, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Leaf, 
  MapPin, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SEED_DEMO_ITEMS } from '@/lib/seedData';
import { AIScanResult, CircularAction } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { calculateCO2Avoided, calculateEcoPoints } from '@/lib/services/impact';

export default function ScanResultPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.id as string;

  const [scanResult, setScanResult] = useState<(AIScanResult & { id?: string; image_url: string; isDemoFallback?: boolean }) | null>(null);
  
  // Recorded Action State
  const [recordedAction, setRecordedAction] = useState<string | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [co2SavedEst, setCo2SavedEst] = useState<number>(0);
  const [alreadyRecorded, setAlreadyRecorded] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function loadScanData() {
      // Check if action was already recorded for this scan in sessionStorage
      if (typeof window !== 'undefined') {
        const recordedLocal = sessionStorage.getItem(`action-${scanId}`);
        if (recordedLocal) {
          try {
            const parsedAction = JSON.parse(recordedLocal);
            if (isMounted) {
              setRecordedAction(parsedAction.action);
              setPointsEarned(parsedAction.points);
              setCo2SavedEst(parsedAction.co2Saved);
              setAlreadyRecorded(true);
            }
          } catch (e) {
            console.warn('Action storage error:', e);
          }
        }
      }

      // 1. Try local sessionStorage for scan result
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(scanId);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (isMounted) {
              setScanResult(parsed);
              return;
            }
          } catch (e) {
            console.warn('Could not parse sessionStorage scan data');
          }
        }
      }

      // 2. Query Supabase database for persistent scan record if UUID
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('scans')
          .select('*')
          .eq('id', scanId)
          .single();

        if (data && !error && isMounted) {
          setScanResult({
            item_name: data.item_name,
            category: data.category,
            material: data.material,
            condition: data.condition,
            reusable: data.reusable,
            repairable: data.repairable,
            recyclable: data.recyclable,
            recommended_action: data.recommended_action,
            circularity_score: data.circularity_score,
            confidence: Number(data.confidence),
            reason: data.reason,
            co2_estimate: Number(data.co2_estimate),
            image_url: data.image_url,
            id: data.id,
            isDemoFallback: false,
          });

          // Check if activity already exists in DB for this scan
          const { data: existingAct } = await supabase
            .from('activities')
            .select('*')
            .eq('scan_id', scanId);

          if (existingAct && existingAct.length > 0 && isMounted) {
            const act = existingAct[0];
            setRecordedAction(act.activity_type);
            setPointsEarned(act.points);
            setCo2SavedEst(Number(act.co2_saved));
            setAlreadyRecorded(true);
          }
          return;
        }
      } catch (err) {
        console.warn('Supabase fetch scan error:', err);
      }

      // 3. Fallback to demo item
      if (isMounted) {
        const seedIndex = Math.abs(hashCode(scanId)) % SEED_DEMO_ITEMS.length;
        const seed = SEED_DEMO_ITEMS[seedIndex];
        setScanResult({
          ...seed,
          id: scanId,
          isDemoFallback: true,
        });
      }
    }

    loadScanData();
    return () => {
      isMounted = false;
    };
  }, [scanId]);

  function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  const handleChooseAction = async (action: CircularAction) => {
    if (!scanResult || isSubmitting || recordedAction) return;

    setIsSubmitting(true);
    setSubmitError('');

    const points = calculateEcoPoints(action);
    const co2Val = calculateCO2Avoided(scanResult.category, action);

    try {
      // Send action to API
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId,
          action,
          category: scanResult.category,
          itemName: scanResult.item_name,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to record circular action.');
      }

      const finalPoints = json.points || points;
      const finalCO2 = json.co2Saved ?? co2Val;

      setRecordedAction(action);
      setPointsEarned(finalPoints);
      setCo2SavedEst(finalCO2);
      setAlreadyRecorded(json.alreadyRecorded || false);

      // Save to sessionStorage to prevent duplicate points on page reload
      const actionPayload = {
        action,
        points: finalPoints,
        co2Saved: finalCO2,
        timestamp: new Date().toISOString(),
      };
      sessionStorage.setItem(`action-${scanId}`, JSON.stringify(actionPayload));

      // Update local storage demo profile & activity list for real-time dashboard updates
      updateClientSessionActivity(scanResult.item_name, action, finalPoints, finalCO2);
    } catch (err: any) {
      console.error('Action submission error:', err);
      // Fallback local update for offline / demo mode
      setRecordedAction(action);
      setPointsEarned(points);
      setCo2SavedEst(co2Val);
      setAlreadyRecorded(false);

      sessionStorage.setItem(`action-${scanId}`, JSON.stringify({
        action,
        points,
        co2Saved: co2Val,
        timestamp: new Date().toISOString(),
      }));

      updateClientSessionActivity(scanResult.item_name, action, points, co2Val);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to maintain sync between scan actions, dashboard, and profile
  const updateClientSessionActivity = (itemName: string, action: CircularAction, points: number, co2: number) => {
    if (typeof window === 'undefined') return;
    try {
      // 1. Get existing demo activity store
      const storedActs = sessionStorage.getItem('user_activities');
      const acts = storedActs ? JSON.parse(storedActs) : [];
      const newAct = {
        id: `act-${Date.now()}`,
        item_name: itemName,
        activity_type: action,
        points,
        co2_saved: co2,
        created_at: new Date().toISOString(),
      };
      acts.unshift(newAct);
      sessionStorage.setItem('user_activities', JSON.stringify(acts));

      // 2. Get existing demo profile store
      const storedProf = sessionStorage.getItem('user_profile');
      const prof = storedProf ? JSON.parse(storedProf) : {
        eco_points: 430,
        co2_saved: 68.4,
        items_diverted: 6,
        items_reused: 3,
        items_recycled: 2,
        items_donated: 1,
      };

      prof.eco_points += points;
      prof.co2_saved = Math.round((prof.co2_saved + co2) * 100) / 100;
      if (action !== 'Dispose') prof.items_diverted += 1;
      if (action === 'Reuse') prof.items_reused += 1;
      if (action === 'Recycle') prof.items_recycled += 1;
      if (action === 'Donate') prof.items_donated += 1;

      sessionStorage.setItem('user_profile', JSON.stringify(prof));
    } catch (e) {
      console.warn('Session activity update error:', e);
    }
  };

  if (!scanResult) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Loading AI scan result...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Back button */}
      <Link href="/scanner" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Scan another item</span>
      </Link>

      {/* Low Confidence Warning Notice */}
      {scanResult.confidence < 70 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Low Confidence ({scanResult.confidence}%):</strong> Visual evidence was ambiguous. Consider retaking the photo with better lighting and the item centered.
            </span>
          </div>
        </div>
      )}

      {/* Demo Banner Notification if Fallback */}
      {scanResult.isDemoFallback && (
        <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
            <span><strong>Demo Mode Active:</strong> Analysis rendered using EcoLoop lifecycle dataset.</span>
          </div>
        </div>
      )}

      {/* Submit Error Banner */}
      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{submitError}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => handleChooseAction(scanResult.recommended_action as CircularAction)}>
            Try Again
          </Button>
        </div>
      )}

      {/* Action Recorded Success / Duplicate Notice Banner */}
      {recordedAction && (
        <div className="p-6 rounded-3xl bg-emerald-600 text-white shadow-xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">
                  {alreadyRecorded ? 'Action Already Recorded' : '✓ Action Recorded!'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase">
                  +{pointsEarned} Eco Points
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                You committed to <strong>{recordedAction}</strong> for {scanResult.item_name}. Estimated impact: <strong>~{co2SavedEst} kg CO₂e avoided</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm" className="bg-white text-emerald-900 hover:bg-emerald-50 border-0 font-bold">
                Go to Dashboard
              </Button>
            </Link>
            <Link href={`/centers?type=${recordedAction || 'All'}`}>
              <Button variant="outline" size="sm" className="border-white/40 text-white hover:bg-white/10 font-bold">
                <MapPin className="w-4 h-4" />
                Find Nearby {recordedAction ? `${recordedAction} Centers` : 'Centers'}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Result Card Grid */}
      <div className="grid md:grid-cols-12 gap-8">
        {/* Left Column: Image preview */}
        <div className="md:col-span-5 space-y-4">
          <Card className="p-3 bg-slate-900 overflow-hidden shadow-lg border-slate-800">
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
              <img src={scanResult.image_url} alt={scanResult.item_name} className="w-full h-full object-cover" />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-b border-slate-100 pb-2">
              <span>AI CONFIDENCE</span>
              <span className="text-brand-600 font-bold">{scanResult.confidence}%</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
              <span>ESTIMATED CO₂ SAVED</span>
              <span className="text-emerald-600 font-bold">~{scanResult.co2_estimate} kg</span>
            </div>
          </Card>
        </div>

        {/* Right Column: AI Analysis & Action Buttons */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>ITEM IDENTIFIED</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">{scanResult.item_name}</h1>
          </div>

          {/* Key Traits Grid */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Category</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scanResult.category}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Material</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">{scanResult.material}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Condition</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">{scanResult.condition}</span>
            </div>
          </div>

          {/* Circularity Score Card */}
          <Card className="p-5 bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">EcoLoop Circularity Score</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  An AI-assisted estimate of the item's potential for continued use or recovery.
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                {scanResult.circularity_score}
              </div>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${scanResult.circularity_score}%` }} />
            </div>
          </Card>

          {/* Recommended Action Card */}
          <div className="p-5 rounded-2xl bg-brand-600 text-white space-y-2 shadow-md">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-200">Recommended Action</span>
            <div className="flex items-center gap-2 text-xl font-bold">
              <Wrench className="w-6 h-6 text-brand-200" />
              <span>{scanResult.recommended_action.toUpperCase()}</span>
            </div>
            <p className="text-xs text-brand-100 leading-relaxed pt-1">
              "{scanResult.reason}"
            </p>

            {/* Contextual Action & Center Finder CTAs */}
            <div className="flex flex-col gap-2 pt-2">
              {['Resell', 'Reuse', 'Donate'].includes(scanResult.recommended_action) && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('prefill_listing', JSON.stringify(scanResult));
                      router.push('/create-listing');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all"
                >
                  <Repeat className="w-4 h-4 text-white" />
                  <span>List This Item on Circular Marketplace →</span>
                </button>
              )}

              {scanResult.recommended_action === 'Recycle' && (
                <Link
                  href="/centers?type=Recycling"
                  className="w-full py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all"
                >
                  <MapPin className="w-4 h-4 text-white" />
                  <span>Find Recycling Centers →</span>
                </Link>
              )}

              {scanResult.recommended_action === 'Repair' && (
                <Link
                  href="/centers?type=Repair"
                  className="w-full py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all"
                >
                  <MapPin className="w-4 h-4 text-white" />
                  <span>Find Repair Centers →</span>
                </Link>
              )}

              {scanResult.recommended_action === 'Donate' && (
                <Link
                  href="/centers?type=Donation"
                  className="w-full py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all"
                >
                  <MapPin className="w-4 h-4 text-white" />
                  <span>Find Donation Centers →</span>
                </Link>
              )}

              {scanResult.category === 'Electronics' && (
                <Link
                  href="/centers?type=E-waste"
                  className="w-full py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all"
                >
                  <MapPin className="w-4 h-4 text-white" />
                  <span>Find E-Waste Centers →</span>
                </Link>
              )}
            </div>
          </div>

          {/* Action Choice Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Your Destination Action</h3>
              {recordedAction && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Primary Reward Claimed
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { action: 'Repair' as CircularAction, icon: Wrench, pts: 30, color: 'hover:border-amber-500 hover:bg-amber-50' },
                { action: 'Reuse' as CircularAction, icon: Repeat, pts: 25, color: 'hover:border-emerald-500 hover:bg-emerald-50' },
                { action: 'Donate' as CircularAction, icon: HeartHandshake, pts: 40, color: 'hover:border-rose-500 hover:bg-rose-50' },
                { action: 'Resell' as CircularAction, icon: Coins, pts: 20, color: 'hover:border-indigo-500 hover:bg-indigo-50' },
                { action: 'Recycle' as CircularAction, icon: Recycle, pts: 20, color: 'hover:border-blue-500 hover:bg-blue-50' },
                { action: 'Dispose' as CircularAction, icon: Trash2, pts: 0, color: 'hover:border-slate-500 hover:bg-slate-100' },
              ].map((btn) => {
                const Icon = btn.icon;
                const isSelected = recordedAction === btn.action;
                const isDisabled = isSubmitting || (recordedAction !== null && !isSelected);

                return (
                  <button
                    key={btn.action}
                    disabled={isDisabled || (recordedAction !== null)}
                    onClick={() => handleChooseAction(btn.action)}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all shadow-xs relative ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400'
                        : recordedAction !== null
                        ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                        : `bg-white text-slate-800 border-slate-200 ${btn.color} active:scale-95`
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4" />
                      <span>{btn.action}</span>
                    </div>
                    <span className={`text-[10px] font-semibold ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                      +{btn.pts} pts
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
