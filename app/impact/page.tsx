'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sprout, 
  Leaf, 
  HelpCircle, 
  Camera, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  Recycle, 
  Award, 
  Activity as ActivityIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { SEED_ACTIVITIES, SEED_DEMO_ITEMS, DEMO_USER_PROFILE } from '@/lib/seedData';
import { Activity, Profile, ScanItem } from '@/types';
import { 
  calculateAnalytics, 
  TimeRange, 
  AnalyticsSummary 
} from '@/lib/services/analytics';
import ImpactTrendChart from '@/components/charts/ImpactTrendChart';
import ActionDistributionChart from '@/components/charts/ActionDistributionChart';
import MaterialDistributionChart from '@/components/charts/MaterialDistributionChart';

export default function ImpactPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState<boolean>(true);

  // Raw data stores
  const [profile, setProfile] = useState<Partial<Profile>>(DEMO_USER_PROFILE);
  const [activities, setActivities] = useState<Activity[]>(SEED_ACTIVITIES);
  const [scans, setScans] = useState<Partial<ScanItem>[]>(SEED_DEMO_ITEMS);

  useEffect(() => {
    let isMounted = true;

    async function loadImpactData() {
      setLoading(true);

      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();

        if (userData?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.user.id)
            .single();

          if (profileData && isMounted) {
            setProfile(profileData);
          }

          const { data: actData } = await supabase
            .from('activities')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: true });

          if (actData && isMounted) {
            setActivities(actData);
          }

          const { data: scanData } = await supabase
            .from('scans')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: true });

          if (scanData && isMounted) {
            setScans(scanData);
          }
        }
      } catch (err) {
        console.warn('Impact page Supabase fetch operating in demo mode:', err);
      }

      // Read local session storage overrides for live demo mode
      if (typeof window !== 'undefined' && isMounted) {
        try {
          const storedProf = sessionStorage.getItem('user_profile');
          if (storedProf) {
            setProfile((prev) => ({ ...prev, ...JSON.parse(storedProf) }));
          }

          const storedActs = sessionStorage.getItem('user_activities');
          if (storedActs) {
            const parsedActs: Activity[] = JSON.parse(storedActs);
            if (parsedActs.length > 0) {
              setActivities([...parsedActs, ...SEED_ACTIVITIES]);
            }
          }
        } catch (e) {
          console.warn('Session parse error:', e);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    loadImpactData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute analytics dynamically based on selected timeRange
  const analytics: AnalyticsSummary = calculateAnalytics(activities, scans, profile, timeRange);

  return (
    <div className="space-y-8 py-4">
      {/* Page Header with Time Range Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            <span>Environmental Impact Analytics</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Carbon & Circular Impact</h1>
          <p className="text-slate-500 text-sm mt-1">
            Verified lifecycle carbon savings calculated from your circular actions.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
          <Calendar className="w-4 h-4 text-slate-400 ml-2 mr-1" />
          {[
            { label: '7 Days', value: '7d' as TimeRange },
            { label: '30 Days', value: '30d' as TimeRange },
            { label: 'All Time', value: 'all' as TimeRange },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                timeRange === range.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        /* Loading Skeleton */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-28 animate-pulse bg-slate-100 border-slate-200" />
            ))}
          </div>
          <Card className="h-80 animate-pulse bg-slate-100 border-slate-200" />
        </div>
      ) : !analytics.hasData && activities.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center space-y-4 bg-slate-50 border-dashed border-slate-300">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
            <Sprout className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Your impact journey starts with your first scan.</h3>
            <p className="text-xs text-slate-500">
              Audit unwanted household items to calculate avoided lifecycle greenhouse emissions.
            </p>
          </div>
          <Link href="/scanner" className="inline-block pt-2">
            <Button size="lg" className="shadow-md shadow-brand-600/20">
              <Camera className="w-5 h-5" />
              <span>Scan an Item Now</span>
            </Button>
          </Link>
        </Card>
      ) : (
        /* Active Analytics View */
        <>
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border-emerald-100 space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Estimated CO₂ Avoided</span>
              <h2 className="text-3xl font-black text-slate-900">
                {analytics.topStats.co2Avoided} <span className="text-sm font-semibold text-slate-500">kg</span>
              </h2>
              <p className="text-[11px] text-emerald-700 font-medium">Verified lifecycle factor est.</p>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-teal-50 via-white to-teal-50/30 border-teal-100 space-y-1">
              <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">Landfill Waste Diverted</span>
              <h2 className="text-3xl font-black text-slate-900">
                {analytics.topStats.itemsDiverted} <span className="text-sm font-semibold text-slate-500">items</span>
              </h2>
              <p className="text-[11px] text-teal-700 font-medium">Saved from landfill disposal</p>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-sky-50 via-white to-sky-50/30 border-sky-100 space-y-1">
              <span className="text-[10px] font-extrabold text-sky-800 uppercase tracking-wider block">Community Eco Points</span>
              <h2 className="text-3xl font-black text-slate-900">
                {analytics.topStats.ecoPoints} <span className="text-sm font-semibold text-slate-500">pts</span>
              </h2>
              <p className="text-[11px] text-sky-700 font-medium">Accumulated circular rewards</p>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border-amber-100 space-y-1">
              <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">Second Life Rate</span>
              <h2 className="text-3xl font-black text-slate-900">
                {analytics.topStats.secondLifeRate}%
              </h2>
              <p className="text-[11px] text-amber-700 font-medium">{analytics.topStats.itemsReused} items reused</p>
            </Card>
          </div>

          {/* CO₂ Impact Trend Chart Section */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Estimated CO₂ Avoided Over Time</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily greenhouse gas emissions prevented by choosing circular paths.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Trend Mode: {timeRange === '7d' ? '7 Days' : timeRange === '30d' ? '30 Days' : 'All Time'}
              </span>
            </div>

            <ImpactTrendChart data={analytics.trendData} height={280} />
          </Card>

          {/* Charts Grid: Action Distribution & Material Distribution */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Action Breakdown Chart */}
            <Card className="p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">Circular Action Distribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Breakdown of completed actions across 6 circular destinations.
                </p>
              </div>

              <ActionDistributionChart data={analytics.actionDistribution} height={220} />
            </Card>

            {/* Material Category Chart */}
            <Card className="p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">Scanned Material Categories</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Waste and material streams audited by EcoLoop AI.
                </p>
              </div>

              <MaterialDistributionChart data={analytics.materialDistribution} height={220} />
            </Card>
          </div>

          {/* Circularity & AI Performance Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 space-y-1 bg-slate-900 text-white">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Avg. Circularity Score</span>
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-3xl font-black text-brand-400">{analytics.circularityStats.avgCircularityScore} <span className="text-xs font-normal text-slate-400">/ 100</span></h3>
                <Sparkles className="w-6 h-6 text-brand-400" />
              </div>
              <p className="text-[11px] text-slate-400 pt-1">AI-assisted item reusability estimate.</p>
            </Card>

            <Card className="p-5 space-y-1 bg-slate-900 text-white">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Avg. AI Vision Confidence</span>
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-3xl font-black text-emerald-400">{analytics.circularityStats.avgConfidence}%</h3>
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 pt-1">Multimodal visual match confidence.</p>
            </Card>

            <Card className="p-5 space-y-1 bg-slate-900 text-white">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Items Audited</span>
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-3xl font-black text-sky-400">{analytics.circularityStats.totalScanned} <span className="text-xs font-normal text-slate-400">items</span></h3>
                <Recycle className="w-6 h-6 text-sky-400" />
              </div>
              <p className="text-[11px] text-slate-400 pt-1">Total items processed by EcoLoop AI.</p>
            </Card>
          </div>

          {/* Methodology Section */}
          <Card className="p-6 space-y-4 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-base text-slate-900">How is this impact calculated?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              EcoLoop uses transparent lifecycle assessment factors for primary materials (e.g. textile = 14.2 kg CO₂e/kg, electronics = 45.0 kg CO₂e/kg, solid wood = 3.8 kg CO₂e/kg). When an item is diverted from landfill through reuse, repair, donation, or recycling, avoided raw material extraction and manufacturing emissions are computed dynamically. All environmental values are clearly labeled as estimates.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
