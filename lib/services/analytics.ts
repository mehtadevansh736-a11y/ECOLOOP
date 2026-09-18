import { Activity, Category, CircularAction, Profile, ScanItem } from '@/types';
import { createClientServer } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/client';
import { SEED_ACTIVITIES, SEED_DEMO_ITEMS, DEMO_USER_PROFILE } from '../seedData';

export type TimeRange = '7d' | '30d' | 'all';

export interface TrendPoint {
  date: string;       // e.g. "Sep 12" or "Mon"
  fullDate: string;   // YYYY-MM-DD
  co2Saved: number;   // estimated kg CO2e
  actionCount: number;
}

export interface ActionDistributionItem {
  name: CircularAction;
  count: number;
  percentage: number;
  color: string;
}

export interface MaterialDistributionItem {
  category: Category;
  count: number;
  percentage: number;
  color: string;
}

export interface AnalyticsSummary {
  topStats: {
    ecoPoints: number;
    itemsDiverted: number;
    co2Avoided: number; // estimated
    itemsReused: number;
    totalActions: number;
    secondLifeRate: number;
  };
  circularityStats: {
    avgCircularityScore: number;
    avgConfidence: number;
    totalScanned: number;
    itemsDiverted: number;
  };
  trendData: TrendPoint[];
  actionDistribution: ActionDistributionItem[];
  materialDistribution: MaterialDistributionItem[];
  hasData: boolean;
}

const ACTION_COLORS: Record<string, string> = {
  Reuse: '#10b981',   // emerald-500
  Repair: '#f59e0b',  // amber-500
  Donate: '#f43f5e',  // rose-500
  Resell: '#6366f1',  // indigo-500
  Recycle: '#3b82f6', // blue-500
  Dispose: '#64748b', // slate-500
};

const CATEGORY_COLORS: Record<string, string> = {
  Plastic: '#3b82f6',
  Paper: '#f59e0b',
  Glass: '#10b981',
  Metal: '#6366f1',
  Textile: '#ec4899',
  Electronics: '#8b5cf6',
  Furniture: '#14b8a6',
  Organic: '#84cc16',
  Mixed: '#64748b',
  Other: '#94a3b8',
};

/**
 * Calculates analytics data for the specified time range.
 * Supports Supabase database queries with fallback to client storage & seed data.
 */
export function calculateAnalytics(
  activities: Activity[],
  scans: Partial<ScanItem>[],
  profile: Partial<Profile>,
  timeRange: TimeRange
): AnalyticsSummary {
  const now = new Date();
  let cutoffMs = 0;

  if (timeRange === '7d') {
    cutoffMs = now.getTime() - 7 * 24 * 3600 * 1000;
  } else if (timeRange === '30d') {
    cutoffMs = now.getTime() - 30 * 24 * 3600 * 1000;
  }

  // Filter activities by time range
  const filteredActivities = activities.filter((act) => {
    if (!act.created_at) return true;
    const actTime = new Date(act.created_at).getTime();
    return cutoffMs === 0 || actTime >= cutoffMs;
  });

  // Filter scans by time range
  const filteredScans = scans.filter((scan) => {
    if (!scan.created_at) return true;
    const scanTime = new Date(scan.created_at).getTime();
    return cutoffMs === 0 || scanTime >= cutoffMs;
  });

  const hasData = filteredActivities.length > 0 || filteredScans.length > 0;

  // 1. Top Stats
  const totalEcoPoints = filteredActivities.reduce((acc, a) => acc + (a.points || 0), 0);
  const totalCO2Avoided = Math.round(
    filteredActivities.reduce((acc, a) => acc + (Number(a.co2_saved) || 0), 0) * 100
  ) / 100;

  const divertedActivities = filteredActivities.filter((a) => a.activity_type !== 'Dispose');
  const itemsDivertedCount = divertedActivities.length;

  const itemsReusedCount = filteredActivities.filter((a) => a.activity_type === 'Reuse').length;
  const secondLifeRate = filteredActivities.length > 0
    ? Math.round((itemsDivertedCount / filteredActivities.length) * 100)
    : 100;

  // 2. Trend Data (Generate continuous daily buckets for 7d / 30d)
  const numDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
  const trendBuckets: Record<string, { dateLabel: string; co2Saved: number; count: number }> = {};

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const fullDate = d.toISOString().split('T')[0];
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    trendBuckets[fullDate] = { dateLabel, co2Saved: 0, count: 0 };
  }

  filteredActivities.forEach((act) => {
    if (!act.created_at) return;
    const fullDate = new Date(act.created_at).toISOString().split('T')[0];
    if (trendBuckets[fullDate]) {
      trendBuckets[fullDate].co2Saved += Number(act.co2_saved) || 0;
      trendBuckets[fullDate].count += 1;
    }
  });

  const trendData: TrendPoint[] = Object.entries(trendBuckets).map(([fullDate, bucket]) => ({
    date: bucket.dateLabel,
    fullDate,
    co2Saved: Math.round(bucket.co2Saved * 100) / 100,
    actionCount: bucket.count,
  }));

  // 3. Action Distribution
  const actionCounts: Record<string, number> = {
    Reuse: 0,
    Repair: 0,
    Donate: 0,
    Resell: 0,
    Recycle: 0,
    Dispose: 0,
  };

  filteredActivities.forEach((act) => {
    if (actionCounts[act.activity_type] !== undefined) {
      actionCounts[act.activity_type] += 1;
    }
  });

  const totalActCount = Math.max(1, filteredActivities.length);
  const actionDistribution: ActionDistributionItem[] = (
    ['Reuse', 'Repair', 'Donate', 'Resell', 'Recycle', 'Dispose'] as CircularAction[]
  ).map((actName) => ({
    name: actName,
    count: actionCounts[actName] || 0,
    percentage: Math.round(((actionCounts[actName] || 0) / totalActCount) * 100),
    color: ACTION_COLORS[actName] || '#64748b',
  }));

  // 4. Material Category Distribution
  const categoryCounts: Record<string, number> = {};
  filteredScans.forEach((scan) => {
    const cat = scan.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const totalScansCount = Math.max(1, filteredScans.length);
  const materialDistribution: MaterialDistributionItem[] = Object.entries(categoryCounts).map(
    ([cat, count]) => ({
      category: cat as Category,
      count,
      percentage: Math.round((count / totalScansCount) * 100),
      color: CATEGORY_COLORS[cat] || '#94a3b8',
    })
  );

  // 5. Circularity Statistics
  const validScores = filteredScans.map((s) => s.circularity_score).filter((s): s is number => typeof s === 'number');
  const validConf = filteredScans.map((s) => s.confidence).filter((c): c is number => typeof c === 'number');

  const avgCircularityScore = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 85;

  const avgConfidence = validConf.length > 0
    ? Math.round(validConf.reduce((a, b) => a + b, 0) / validConf.length)
    : 94;

  return {
    topStats: {
      ecoPoints: totalEcoPoints || (profile.eco_points ?? DEMO_USER_PROFILE.eco_points),
      itemsDiverted: itemsDivertedCount || (profile.items_diverted ?? DEMO_USER_PROFILE.items_diverted),
      co2Avoided: totalCO2Avoided || (profile.co2_saved ?? DEMO_USER_PROFILE.co2_saved),
      itemsReused: itemsReusedCount || (profile.items_reused ?? DEMO_USER_PROFILE.items_reused),
      totalActions: filteredActivities.length,
      secondLifeRate,
    },
    circularityStats: {
      avgCircularityScore,
      avgConfidence,
      totalScanned: filteredScans.length || SEED_DEMO_ITEMS.length,
      itemsDiverted: itemsDivertedCount || DEMO_USER_PROFILE.items_diverted,
    },
    trendData,
    actionDistribution,
    materialDistribution,
    hasData,
  };
}
