'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Sparkles, 
  Leaf, 
  Award, 
  Recycle, 
  Wrench, 
  HeartHandshake, 
  LogOut, 
  ShieldCheck,
  Trophy,
  Flame,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DEMO_USER_PROFILE, SEED_ACTIVITIES } from '@/lib/seedData';
import { createClient } from '@/lib/supabase/client';
import { Activity, Profile } from '@/types';
import { getUserBadges, getNextMilestoneBadge, extractUserStats } from '@/lib/services/badges';
import { getLeaderboardData, calculateStreak } from '@/lib/services/leaderboard';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(DEMO_USER_PROFILE);
  const [activities, setActivities] = useState<Activity[]>(SEED_ACTIVITIES);
  const [userRank, setUserRank] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;

    async function loadProfileData() {
      let currentProf = DEMO_USER_PROFILE;
      let currentActs = SEED_ACTIVITIES;

      // 1. Try Supabase first
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
              avatar_url: profileData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
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
        }
      } catch (err) {
        console.warn('Profile Supabase fetch operating in demo mode:', err);
      }

      // 2. Read local sessionStorage overrides
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

      // 3. Compute current community rank
      const { currentUserRank } = await getLeaderboardData('global', currentProf);
      if (currentUserRank && isMounted) {
        setUserRank(currentUserRank.rank);
      }
    }

    loadProfileData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out:', err);
    }
    router.push('/login');
  };

  const userStats = extractUserStats(profile);
  const badgeProgresses = getUserBadges(userStats);
  const nextMilestone = getNextMilestoneBadge(userStats);
  const streakInfo = calculateStreak(activities);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Profile Card Header */}
      <Card className="p-6 sm:p-8 bg-white space-y-6 flex flex-col md:flex-row items-center justify-between gap-6 border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <img 
            src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
            alt={profile.full_name} 
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-brand-100 shadow-md shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{profile.full_name}</h1>
              <span className="px-3 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-extrabold uppercase">
                Eco Pioneer
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{profile.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Trophy className="w-4 h-4" /> Rank #{userRank}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-orange-600 font-bold">
                <Flame className="w-4 h-4" /> {streakInfo.streakDays} Day Streak
              </span>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout} className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </Card>

      {/* Your Eco Journey Stats */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900">Your Eco Journey</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 text-center bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Eco Points</span>
            <span className="text-2xl sm:text-3xl font-black text-brand-600 block mt-1">{profile.eco_points}</span>
          </Card>

          <Card className="p-5 text-center bg-gradient-to-br from-teal-50 to-white border-teal-100 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. CO₂ Avoided</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-1">{profile.co2_saved} <span className="text-xs font-normal text-slate-500">kg</span></span>
          </Card>

          <Card className="p-5 text-center bg-gradient-to-br from-sky-50 to-white border-sky-100 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Items Diverted</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-1">{profile.items_diverted}</span>
          </Card>

          <Card className="p-5 text-center bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Community Rank</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 block mt-1">#{userRank}</span>
          </Card>
        </div>
      </div>

      {/* Next Milestone Card */}
      {nextMilestone && (
        <Card className="p-6 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-400/30 text-brand-400 text-3xl flex items-center justify-center shrink-0">
              {nextMilestone.badge.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Next Milestone</span>
                <h3 className="font-extrabold text-lg text-white">{nextMilestone.badge.name}</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {nextMilestone.targetValue - nextMilestone.currentValue} {nextMilestone.badge.category === 'points' ? 'points' : 'actions'} away from unlocking <strong>{nextMilestone.badge.name}</strong>.
              </p>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">{nextMilestone.currentValue}</span>
              <span className="text-brand-400">Target: {nextMilestone.targetValue}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${nextMilestone.progressPercentage}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Your Badges Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Your Badges</h2>
            <p className="text-xs text-slate-500 mt-0.5">Badges unlocked through recorded circular actions.</p>
          </div>
          <Link href="/leaderboard" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            Leaderboard Rankings <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {badgeProgresses.map(({ badge, isUnlocked, currentValue, targetValue, progressPercentage }) => (
            <Card
              key={badge.id}
              className={`p-4 text-center space-y-2 border transition-all ${
                isUnlocked
                  ? 'bg-white border-emerald-300 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 opacity-80'
              }`}
            >
              <div className="relative inline-block">
                <span className={`text-3xl block ${!isUnlocked ? 'grayscale opacity-60' : ''}`}>
                  {badge.icon}
                </span>
                {isUnlocked ? (
                  <span className="absolute -top-1 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-2 w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[10px]">
                    🔒
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-xs text-slate-900">{badge.name}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{badge.description}</p>
              </div>

              <div className="pt-1 space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>{isUnlocked ? 'Unlocked' : 'Progress'}</span>
                  <span>{currentValue} / {targetValue}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked ? 'bg-emerald-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Your Activity History</h2>
        <div className="space-y-3">
          {activities.map((act) => (
            <div key={act.id} className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between hover:bg-slate-100/80 transition-colors border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
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
                  <p className="text-xs text-slate-500">
                    Action: <strong>{act.activity_type}</strong> • Estimated impact: <strong>{act.co2_saved} kg CO₂e avoided</strong>
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                +{act.points} pts
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
