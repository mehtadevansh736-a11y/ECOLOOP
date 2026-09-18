'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Medal, 
  ShieldCheck, 
  Flame, 
  TrendingUp, 
  CheckCircle2, 
  Leaf, 
  Users, 
  Target, 
  Lock, 
  Check, 
  ChevronRight,
  Info,
  ArrowUpRight,
  Recycle,
  Wrench,
  HeartHandshake
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DEMO_USER_PROFILE, SEED_ACTIVITIES } from '@/lib/seedData';
import { Activity, Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { 
  getLeaderboardData, 
  calculateStreak, 
  getWeeklyChallenges, 
  getCommunityImpactTotals, 
  LeaderboardUser 
} from '@/lib/services/leaderboard';
import { getUserBadges, extractUserStats } from '@/lib/services/badges';

export default function LeaderboardPage() {
  const [profile, setProfile] = useState<Profile>(DEMO_USER_PROFILE);
  const [activities, setActivities] = useState<Activity[]>(SEED_ACTIVITIES);
  const [activeTab, setActiveTab] = useState<'global' | 'weekly' | 'monthly'>('global');
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [myRankUser, setMyRankUser] = useState<LeaderboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      let currentProf = DEMO_USER_PROFILE;
      let currentActs = SEED_ACTIVITIES;

      // 1. Try Supabase for live authenticated user profile & activities
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
        console.warn('Leaderboard Supabase fetch operating in demo mode:', err);
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

      // 3. Fetch leaderboard data for selected tab
      const { users, currentUserRank } = await getLeaderboardData(activeTab, currentProf);
      if (isMounted) {
        setLeaderboardUsers(users);
        setMyRankUser(currentUserRank);
        setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const userStats = extractUserStats(profile);
  const badgeProgresses = getUserBadges(userStats);
  const streakInfo = calculateStreak(activities);
  const weeklyChallenges = getWeeklyChallenges(activities);
  const communityImpact = getCommunityImpactTotals(leaderboardUsers);

  // Top 3 Podium Users
  const firstPlace = leaderboardUsers[0];
  const secondPlace = leaderboardUsers[1];
  const thirdPlace = leaderboardUsers[2];

  return (
    <div className="space-y-8 py-4">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Community Impact Leaderboard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Small actions. Collective change.</h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Every audit, repair, donation, and recycling action earns Eco Points and moves our community closer to a zero-waste loop.
          </p>
        </div>

        {/* Current User Rank Card */}
        <div className="z-10 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700 space-y-3 shrink-0 sm:min-w-[240px]">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
              #{myRankUser?.rank || 1}
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Your Current Rank</span>
              <h3 className="font-bold text-white text-sm truncate max-w-[140px]">{profile.full_name}</h3>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">{profile.eco_points} Eco Points</span>
            <span className="text-emerald-400">{profile.items_diverted} Items Saved</span>
          </div>
        </div>
      </div>

      {/* Streak Counter & Weekly Challenges Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak Counter Card */}
        <Card className="p-6 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-lg space-y-3 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider">
              Gamification Active
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black">{streakInfo.streakDays} Day Eco Streak</h3>
            <p className="text-xs text-amber-100 mt-1">{streakInfo.message}</p>
          </div>

          <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs text-amber-100 font-medium">
            <span>Daily circular activity</span>
            <span className="font-bold text-white">+50 bonus pts weekly</span>
          </div>
        </Card>

        {/* Weekly Challenges Box */}
        <Card className="md:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-base">This Week's Community Challenges</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">Resets in 4 days</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {weeklyChallenges.map((ch) => (
              <div key={ch.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl">{ch.icon}</span>
                  <span className="text-[10px] font-bold bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">
                    +{ch.rewardPoints} pts
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{ch.title}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>Progress</span>
                    <span>{ch.current} / {ch.target}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${Math.min(100, (ch.current / ch.target) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top 3 Podium Showcase */}
      {!isLoading && leaderboardUsers.length >= 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Top Eco Pioneers</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500">Updated in real-time</span>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end pt-4">
            {/* 2nd Place */}
            {secondPlace && (
              <Card className="p-4 sm:p-6 text-center space-y-3 bg-gradient-to-b from-slate-50 to-white border-slate-200 hover:shadow-md transition-shadow relative">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-extrabold text-sm flex items-center justify-center mx-auto shadow-xs">
                  🥈
                </div>
                <div className="relative inline-block">
                  <img
                    src={secondPlace.avatar_url}
                    alt={secondPlace.full_name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-slate-200 mx-auto shadow-md"
                  />
                  {secondPlace.isCurrentUser && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-brand-600 text-white text-[9px] font-bold">
                      YOU
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-[120px] mx-auto">
                    {secondPlace.full_name}
                  </h3>
                  <p className="text-xs font-black text-slate-700 mt-1">{secondPlace.eco_points} pts</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{secondPlace.items_diverted} items diverted</p>
                </div>
              </Card>
            )}

            {/* 1st Place (Elevated Podium) */}
            {firstPlace && (
              <Card className="p-5 sm:p-7 text-center space-y-3 bg-gradient-to-b from-amber-50 via-white to-amber-50/30 border-2 border-amber-300 shadow-xl relative -top-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-black text-base flex items-center justify-center mx-auto shadow-lg ring-4 ring-amber-200">
                  🥇
                </div>
                <div className="relative inline-block">
                  <img
                    src={firstPlace.avatar_url}
                    alt={firstPlace.full_name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-amber-400 mx-auto shadow-lg"
                  />
                  {firstPlace.isCurrentUser && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-extrabold shadow">
                      YOU
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">Circular Leader</span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate max-w-[140px] mx-auto mt-0.5">
                    {firstPlace.full_name}
                  </h3>
                  <p className="text-sm sm:text-base font-black text-amber-600 mt-1">{firstPlace.eco_points} pts</p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{firstPlace.items_diverted} items diverted</p>
                </div>
              </Card>
            )}

            {/* 3rd Place */}
            {thirdPlace && (
              <Card className="p-4 sm:p-6 text-center space-y-3 bg-gradient-to-b from-amber-900/5 to-white border-amber-200/60 hover:shadow-md transition-shadow relative">
                <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-extrabold text-sm flex items-center justify-center mx-auto shadow-xs">
                  🥉
                </div>
                <div className="relative inline-block">
                  <img
                    src={thirdPlace.avatar_url}
                    alt={thirdPlace.full_name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-amber-700/30 mx-auto shadow-md"
                  />
                  {thirdPlace.isCurrentUser && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-brand-600 text-white text-[9px] font-bold">
                      YOU
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-[120px] mx-auto">
                    {thirdPlace.full_name}
                  </h3>
                  <p className="text-xs font-black text-amber-800 mt-1">{thirdPlace.eco_points} pts</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{thirdPlace.items_diverted} items diverted</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Main Leaderboard Table & Timeframe Tabs */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Community Eco Rankings</h2>
            <p className="text-xs text-slate-500 mt-0.5">Rankings calculated from verified circular actions and Eco Points.</p>
          </div>

          {/* Timeframe Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('global')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'global'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'weekly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'monthly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <span className="px-3 py-1.5 text-xs font-bold text-slate-400 flex items-center gap-1 cursor-not-allowed opacity-60">
              <Lock className="w-3 h-3" /> Friends
            </span>
          </div>
        </div>

        {/* Table Rows */}
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : leaderboardUsers.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-slate-500 text-sm">No community activity recorded for this timeframe yet.</p>
            <Link href="/scanner">
              <Button size="sm">Be the first to complete a circular action →</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboardUsers.map((user) => {
              const isMe = user.isCurrentUser;
              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
                    isMe
                      ? 'bg-brand-50/90 border-brand-300 shadow-xs ring-2 ring-brand-400/50'
                      : 'bg-white border-slate-200 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 font-black text-center text-sm sm:text-base text-slate-700">
                      {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                    </div>
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span>{user.full_name}</span>
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-black uppercase">
                            YOU
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {user.items_diverted} items diverted • ~{user.co2_saved} kg CO₂ avoided
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-brand-600 text-base sm:text-lg">{user.eco_points}</span>
                    <span className="text-xs font-semibold text-slate-400 block">Eco Points</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Gamification Badges Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Your Badges & Achievements</h2>
            <p className="text-xs text-slate-500 mt-0.5">Earn badges by taking circular actions and accumulating Eco Points.</p>
          </div>
          <Link href="/profile" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            View Profile Badges <ArrowUpRight className="w-3.5 h-3.5" />
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
                  <span className="absolute -top-1 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
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

              {/* Progress Bar */}
              <div className="pt-1 space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>{isUnlocked ? 'Completed' : 'Progress'}</span>
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

      {/* Community Impact Summary Card */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black">Together, We've Made an Impact</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Aggregated community metrics from all EcoLoop pioneers. <span className="text-emerald-400 font-semibold">Estimated impact</span>.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            {communityImpact.totalMembers} Active Members
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Items Diverted</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block mt-1">{communityImpact.totalItemsDiverted}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. CO₂ Avoided</span>
            <span className="text-2xl sm:text-3xl font-black text-teal-400 block mt-1">{communityImpact.totalCO2Saved} kg</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Items Recycled</span>
            <span className="text-2xl sm:text-3xl font-black text-sky-400 block mt-1">{communityImpact.totalRecycled}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Items Reused & Donated</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 block mt-1">{communityImpact.totalReused + communityImpact.totalDonated}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
