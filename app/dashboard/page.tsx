'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Camera, 
  Repeat, 
  MapPin, 
  Sparkles, 
  TrendingUp, 
  Leaf, 
  ArrowUpRight, 
  Award, 
  Clock, 
  ChevronRight,
  Recycle,
  Wrench,
  HeartHandshake,
  Trophy,
  Flame,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SEED_ACTIVITIES, SEED_DEMO_ITEMS, DEMO_USER_PROFILE } from '@/lib/seedData';
import { Activity, Profile, ScanItem } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { calculateAnalytics } from '@/lib/services/analytics';
import ImpactTrendChart from '@/components/charts/ImpactTrendChart';
import { getUserBadges, getNextMilestoneBadge, extractUserStats } from '@/lib/services/badges';
import { getLeaderboardData, calculateStreak } from '@/lib/services/leaderboard';

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile>(DEMO_USER_PROFILE);
  const [activities, setActivities] = useState<Activity[]>(SEED_ACTIVITIES);
  const [scans, setScans] = useState<Partial<ScanItem>[]>(SEED_DEMO_ITEMS);
  const [userRank, setUserRank] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      let currentProf = DEMO_USER_PROFILE;
      let currentActs = SEED_ACTIVITIES;

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
            currentProf = {
              id: profileData.id,
              full_name: profileData.full_name || 'Eco Pioneer',
              email: profileData.email,
              avatar_url: profileData.avatar_url,
              eco_points: profileData.eco_points || 0,
              co2_saved: Number(profileData.co2_saved) || 0,
              items_diverted: profileData.items_diverted || 0,
              items_reused: profileData.items_reused || 0,
              items_recycled: profileData.items_recycled || 0,
              items_donated: profileData.items_donated || 0,
              created_at: profileData.created_at,
            };
            setProfile(currentProf);
          }

          const { data: activityData } = await supabase
            .from('activities')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false });

          if (activityData && activityData.length > 0 && isMounted) {
            currentActs = activityData.map((act) => ({
              id: act.id,
              user_id: act.user_id,
              scan_id: act.scan_id,
              activity_type: act.activity_type,
              points: act.points,
              co2_saved: Number(act.co2_saved),
              created_at: act.created_at,
              item_name: act.item_name || `${act.activity_type} Action`,
            }));
            setActivities(currentActs);
          }

          const { data: scanData } = await supabase
            .from('scans')
            .select('*')
            .eq('user_id', userData.user.id);

          if (scanData && scanData.length > 0 && isMounted) {
            setScans(scanData);
          }
        }
      } catch (err) {
        console.warn('Dashboard Supabase fetch operating in demo mode fallback:', err);
      }

      // Read local sessionStorage overrides
      if (typeof window !== 'undefined' && isMounted) {
        try {
          const storedProf = sessionStorage.getItem('user_profile');
          if (storedProf) {
            const parsedProf = JSON.parse(storedProf);
            currentProf = { ...currentProf, ...parsedProf };
            setProfile(currentProf);
          }

          const storedActs = sessionStorage.getItem('user_activities');
          if (storedActs) {
            const parsedActs: Activity[] = JSON.parse(storedActs);
            if (parsedActs.length > 0) {
              currentActs = [...parsedActs, ...SEED_ACTIVITIES];
              setActivities(currentActs);
            }
          }
        } catch (e) {
          console.warn('Session data parse error:', e);
        }
      }

      // Compute rank
      const { currentUserRank } = await getLeaderboardData('global', currentProf);
      if (currentUserRank && isMounted) {
        setUserRank(currentUserRank.rank);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const analytics = calculateAnalytics(activities, scans, profile, '7d');
  const userStats = extractUserStats(profile);
  const nextMilestone = getNextMilestoneBadge(userStats);
  const streakInfo = calculateStreak(activities);

  return (
    <div className="space-y-8 py-4">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Good afternoon, <span className="text-brand-600">{profile.full_name.split(' ')[0]}</span> 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wider">
              Eco Pioneer
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Every item you audit and divert creates real environmental impact. Keep looping!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/scanner">
            <Button size="lg" className="shadow-sm font-bold">
              <Camera className="w-5 h-5" />
              <span>Scan Item</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Eco Points</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">{profile.eco_points}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +120 this week
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between bg-gradient-to-br from-teal-50 to-white border-teal-100">
          <div>
            <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Items Diverted</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">{profile.items_diverted}</h3>
            <p className="text-[11px] text-teal-600 font-medium mt-1">Saved from landfill</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
            <Recycle className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between bg-gradient-to-br from-sky-50 to-white border-sky-100">
          <div>
            <p className="text-xs font-semibold text-sky-800 uppercase tracking-wider">Estimated CO₂ Avoided</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">{profile.co2_saved} <span className="text-sm font-normal text-slate-500">kg</span></h3>
            <p className="text-[11px] text-sky-600 font-medium mt-1 flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5" /> Verified lifecycle est.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Leaf className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <div>
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Community Rank</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">#{userRank}</h3>
            <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> {streakInfo.streakDays} Day Streak
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Gamification Eco Journey & Next Badge Milestone Card */}
      <Card className="p-6 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-400/30 text-brand-400 text-3xl flex items-center justify-center shrink-0">
            {nextMilestone ? nextMilestone.badge.icon : '🏆'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-white">Your Eco Journey: {profile.eco_points} Eco Points</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/30 text-brand-300 font-bold">
                #{userRank} Rank
              </span>
            </div>
            {nextMilestone ? (
              <p className="text-xs text-slate-400 mt-1">
                Next badge: <strong className="text-brand-300">{nextMilestone.badge.name}</strong> ({nextMilestone.currentValue} / {nextMilestone.targetValue})
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-1">You've unlocked all current community badges! Keep diverting waste.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {nextMilestone && (
            <div className="w-full sm:w-48 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">{nextMilestone.currentValue}</span>
                <span className="text-brand-400">Target: {nextMilestone.targetValue}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${nextMilestone.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          <Link href="/leaderboard" className="w-full sm:w-auto shrink-0">
            <Button variant="secondary" size="sm" className="bg-white text-slate-950 hover:bg-slate-100 font-bold w-full sm:w-auto border-0">
              View Leaderboard →
            </Button>
          </Link>
        </div>
      </Card>

      {/* Compact Impact Analytics Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">7-Day Impact Trend</h2>
            <p className="text-xs text-slate-500 mt-0.5">Estimated CO₂ avoided from recent circular actions</p>
          </div>
          <Link href="/impact" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            Full Impact Analytics <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ImpactTrendChart data={analytics.trendData} height={200} />
      </Card>

      {/* Quick Actions Bar */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/scanner">
            <Card className="p-5 hover:border-brand-300 hover:shadow-md transition-all group flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">📷 Scan Item</h3>
                  <p className="text-xs text-slate-500">AI analysis & instant circular recommendation</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
            </Card>
          </Link>

          <Link href="/create-listing">
            <Card className="p-5 hover:border-brand-300 hover:shadow-md transition-all group flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Repeat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">🔄 List Item</h3>
                  <p className="text-xs text-slate-500">Give unwanted items to neighbors for free or sell</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
            </Card>
          </Link>

          <Link href="/centers">
            <Card className="p-5 hover:border-brand-300 hover:shadow-md transition-all group flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">📍 Find Center</h3>
                  <p className="text-xs text-slate-500">Locate nearby repair cafes, recycling & e-waste drop-offs</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Recent Activities List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Circular Activity</h2>
            <Link href="/profile" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {activities.map((act) => (
              <Card key={act.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                    act.activity_type === 'Repair' ? 'bg-amber-100 text-amber-700' :
                    act.activity_type === 'Reuse' ? 'bg-emerald-100 text-emerald-700' :
                    act.activity_type === 'Donate' ? 'bg-rose-100 text-rose-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {act.activity_type === 'Repair' ? <Wrench className="w-5 h-5" /> :
                     act.activity_type === 'Donate' ? <HeartHandshake className="w-5 h-5" /> :
                     <Recycle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{act.item_name || `${act.activity_type} Action`}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Action: {act.activity_type}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">+{act.co2_saved} kg CO₂ saved</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    +{act.points} pts
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" /> {new Date(act.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Distribution Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Action Distribution</h2>
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Impact Breakdown</h3>
            <div className="space-y-3">
              {analytics.actionDistribution.slice(0, 4).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="text-slate-500">{item.count} items ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <Link href="/impact" className="text-xs font-bold text-brand-600 hover:underline">
                Explore Detailed CO₂ Analytics →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
