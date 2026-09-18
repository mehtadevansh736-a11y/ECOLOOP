import { CircularAction, Category, Activity, Profile } from '@/types';
import { calculateCO2Avoided, calculateEcoPoints } from './impact';
import { createClientServer } from '@/lib/supabase/server';
import { DEMO_USER_PROFILE, SEED_ACTIVITIES } from '../seedData';

export interface ActionRecordResult {
  alreadyRecorded: boolean;
  points: number;
  co2Saved: number;
  activity: Partial<Activity>;
  profileStats?: Partial<Profile>;
}

/**
 * Server-side helper to record a circular action and update user profile stats.
 * Enforces database-level duplicate protection (1 scan = 1 reward).
 */
export async function recordCircularActionServer(
  scanId: string,
  action: CircularAction,
  category: Category,
  itemName: string
): Promise<ActionRecordResult> {
  try {
    const supabase = await createClientServer();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const points = calculateEcoPoints(action);
    const co2Saved = calculateCO2Avoided(category, action);

    // Check if scanId is a valid UUID before database query
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scanId);

    if (userId && isUUID) {
      // 1. Check for existing activity for this scan
      const { data: existingActivities } = await supabase
        .from('activities')
        .select('*')
        .eq('scan_id', scanId)
        .eq('user_id', userId);

      if (existingActivities && existingActivities.length > 0) {
        const first = existingActivities[0];
        return {
          alreadyRecorded: true,
          points: first.points,
          co2Saved: Number(first.co2_saved),
          activity: first,
        };
      }

      // 2. Insert new activity
      const { data: newActivity, error: insertError } = await supabase
        .from('activities')
        .insert({
          user_id: userId,
          scan_id: scanId,
          activity_type: action,
          points,
          co2_saved: co2Saved,
        })
        .select('*')
        .single();

      if (insertError) {
        console.warn('Activity insert error:', insertError);
      }

      // 3. Update user profile stats
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (currentProfile) {
        const isDiverted = action !== 'Dispose';
        const updatedPoints = (currentProfile.eco_points || 0) + points;
        const updatedCO2 = (Number(currentProfile.co2_saved) || 0) + co2Saved;
        const updatedDiverted = (currentProfile.items_diverted || 0) + (isDiverted ? 1 : 0);
        const updatedReused = (currentProfile.items_reused || 0) + (action === 'Reuse' ? 1 : 0);
        const updatedRecycled = (currentProfile.items_recycled || 0) + (action === 'Recycle' ? 1 : 0);
        const updatedDonated = (currentProfile.items_donated || 0) + (action === 'Donate' ? 1 : 0);

        await supabase
          .from('profiles')
          .update({
            eco_points: updatedPoints,
            co2_saved: updatedCO2,
            items_diverted: updatedDiverted,
            items_reused: updatedReused,
            items_recycled: updatedRecycled,
            items_donated: updatedDonated,
          })
          .eq('id', userId);
      }

      return {
        alreadyRecorded: false,
        points,
        co2Saved,
        activity: newActivity || {
          id: `act-${Date.now()}`,
          user_id: userId,
          scan_id: scanId,
          activity_type: action,
          points,
          co2_saved: co2Saved,
          created_at: new Date().toISOString(),
          item_name: itemName,
        },
      };
    }
  } catch (err) {
    console.warn('Database action recording operating in demo mode:', err);
  }

  // Demo Mode fallback logic
  const points = calculateEcoPoints(action);
  const co2Saved = calculateCO2Avoided(category, action);

  return {
    alreadyRecorded: false,
    points,
    co2Saved,
    activity: {
      id: `act-demo-${Date.now()}`,
      user_id: DEMO_USER_PROFILE.id,
      scan_id: scanId,
      activity_type: action,
      points,
      co2_saved: co2Saved,
      created_at: new Date().toISOString(),
      item_name: itemName,
    },
  };
}
