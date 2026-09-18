import { Profile } from '@/types';

export interface UserStats {
  ecoPoints: number;
  itemsDiverted: number;
  itemsReused: number;
  itemsRecycled: number;
  itemsDonated: number;
  itemsRepaired: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'action' | 'points';
  requirementText: string;
  targetValue: number;
  getValue: (stats: UserStats) => number;
}

export interface BadgeProgress {
  badge: Badge;
  isUnlocked: boolean;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
}

export const COMMUNITY_BADGES: Badge[] = [
  {
    id: 'first-step',
    name: 'First Step',
    description: 'Complete your first circular action.',
    icon: '🌱',
    category: 'action',
    requirementText: '1 action completed',
    targetValue: 1,
    getValue: (stats) => stats.itemsDiverted,
  },
  {
    id: 'recycler',
    name: 'Recycler',
    description: 'Recycle 5 items.',
    icon: '♻️',
    category: 'action',
    requirementText: '5 recycled items',
    targetValue: 5,
    getValue: (stats) => stats.itemsRecycled,
  },
  {
    id: 'repair-champion',
    name: 'Repair Champion',
    description: 'Repair 5 items.',
    icon: '🔧',
    category: 'action',
    requirementText: '5 repaired items',
    targetValue: 5,
    getValue: (stats) => stats.itemsRepaired,
  },
  {
    id: 'community-helper',
    name: 'Community Helper',
    description: 'Donate 5 items.',
    icon: '💚',
    category: 'action',
    requirementText: '5 donated items',
    targetValue: 5,
    getValue: (stats) => stats.itemsDonated,
  },
  {
    id: 'circular-thinker',
    name: 'Circular Thinker',
    description: 'Complete 10 circular actions.',
    icon: '🔄',
    category: 'action',
    requirementText: '10 actions completed',
    targetValue: 10,
    getValue: (stats) => stats.itemsDiverted,
  },
  {
    id: 'eco-warrior',
    name: 'Eco Warrior',
    description: 'Earn 500 Eco Points.',
    icon: '🌍',
    category: 'points',
    requirementText: '500 Eco Points',
    targetValue: 500,
    getValue: (stats) => stats.ecoPoints,
  },
  {
    id: 'planet-protector',
    name: 'Planet Protector',
    description: 'Earn 1,000 Eco Points.',
    icon: '🌳',
    category: 'points',
    requirementText: '1,000 Eco Points',
    targetValue: 1000,
    getValue: (stats) => stats.ecoPoints,
  },
  {
    id: 'circular-legend',
    name: 'Circular Legend',
    description: 'Earn 2,500 Eco Points.',
    icon: '🏆',
    category: 'points',
    requirementText: '2,500 Eco Points',
    targetValue: 2500,
    getValue: (stats) => stats.ecoPoints,
  },
];

/**
 * Extract UserStats from a Profile object
 */
export function extractUserStats(profile: Profile, itemsRepaired = 0): UserStats {
  return {
    ecoPoints: profile.eco_points || 0,
    itemsDiverted: profile.items_diverted || 0,
    itemsReused: profile.items_reused || 0,
    itemsRecycled: profile.items_recycled || 0,
    itemsDonated: profile.items_donated || 0,
    itemsRepaired: itemsRepaired || Math.max(0, (profile.items_diverted || 0) - (profile.items_reused || 0) - (profile.items_recycled || 0) - (profile.items_donated || 0)),
  };
}

/**
 * Compute progress and unlock status for all community badges given user statistics
 */
export function getUserBadges(stats: UserStats): BadgeProgress[] {
  return COMMUNITY_BADGES.map((badge) => {
    const currentValue = badge.getValue(stats);
    const isUnlocked = currentValue >= badge.targetValue;
    const progressPercentage = Math.min(100, Math.round((currentValue / badge.targetValue) * 100));

    return {
      badge,
      isUnlocked,
      currentValue,
      targetValue: badge.targetValue,
      progressPercentage,
    };
  });
}

/**
 * Identify the next locked milestone badge closest to being unlocked
 */
export function getNextMilestoneBadge(stats: UserStats): BadgeProgress | null {
  const allBadges = getUserBadges(stats);
  const lockedBadges = allBadges.filter((b) => !b.isUnlocked);

  if (lockedBadges.length === 0) return null;

  // Sort locked badges by highest progress percentage
  lockedBadges.sort((a, b) => b.progressPercentage - a.progressPercentage);
  return lockedBadges[0];
}
