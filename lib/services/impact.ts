import { Category, CircularAction } from '@/types';

/**
 * Transparent lifecycle carbon calculation reference dataset (kg CO2e saved per kg of material/action)
 */
export interface MaterialImpactFactor {
  avgWeightKg: number; // typical unit mass in kg
  co2PerKgReuse: number;
  co2PerKgRepair: number;
  co2PerKgDonate: number;
  co2PerKgResell: number;
  co2PerKgRecycle: number;
  co2PerKgDispose: number;
}

export const MATERIAL_IMPACT_DATABASE: Record<Category, MaterialImpactFactor> = {
  Plastic: {
    avgWeightKg: 0.05, // 50g water bottle
    co2PerKgReuse: 2.5,
    co2PerKgRepair: 2.0,
    co2PerKgDonate: 2.5,
    co2PerKgResell: 2.5,
    co2PerKgRecycle: 1.4,
    co2PerKgDispose: 0.05,
  },
  Paper: {
    avgWeightKg: 0.25, // cardboard box / book page
    co2PerKgReuse: 1.8,
    co2PerKgRepair: 1.5,
    co2PerKgDonate: 1.8,
    co2PerKgResell: 1.8,
    co2PerKgRecycle: 0.9,
    co2PerKgDispose: 0.02,
  },
  Glass: {
    avgWeightKg: 0.40, // glass bottle / jar
    co2PerKgReuse: 0.9,
    co2PerKgRepair: 0.8,
    co2PerKgDonate: 0.9,
    co2PerKgResell: 0.9,
    co2PerKgRecycle: 0.5,
    co2PerKgDispose: 0.01,
  },
  Metal: {
    avgWeightKg: 0.15, // aluminum can / small metal fitting
    co2PerKgReuse: 8.5,
    co2PerKgRepair: 7.0,
    co2PerKgDonate: 8.5,
    co2PerKgResell: 8.5,
    co2PerKgRecycle: 5.2,
    co2PerKgDispose: 0.0,
  },
  Textile: {
    avgWeightKg: 0.60, // jeans / jacket / sweater
    co2PerKgReuse: 14.2,
    co2PerKgRepair: 12.0,
    co2PerKgDonate: 14.2,
    co2PerKgResell: 14.2,
    co2PerKgRecycle: 3.5,
    co2PerKgDispose: 0.1,
  },
  Electronics: {
    avgWeightKg: 1.20, // phone / small laptop / gadget
    co2PerKgReuse: 45.0,
    co2PerKgRepair: 38.0,
    co2PerKgDonate: 45.0,
    co2PerKgResell: 45.0,
    co2PerKgRecycle: 12.5,
    co2PerKgDispose: 0.0,
  },
  Furniture: {
    avgWeightKg: 8.50, // chair / table / shelf
    co2PerKgReuse: 3.8,
    co2PerKgRepair: 3.2,
    co2PerKgDonate: 3.8,
    co2PerKgResell: 3.8,
    co2PerKgRecycle: 1.1,
    co2PerKgDispose: 0.05,
  },
  Organic: {
    avgWeightKg: 1.00,
    co2PerKgReuse: 0.5,
    co2PerKgRepair: 0.3,
    co2PerKgDonate: 0.5,
    co2PerKgResell: 0.5,
    co2PerKgRecycle: 0.4, // composting
    co2PerKgDispose: -0.2, // methane in landfill
  },
  Mixed: {
    avgWeightKg: 1.50,
    co2PerKgReuse: 3.0,
    co2PerKgRepair: 2.5,
    co2PerKgDonate: 3.0,
    co2PerKgResell: 3.0,
    co2PerKgRecycle: 1.0,
    co2PerKgDispose: 0.0,
  },
  Other: {
    avgWeightKg: 1.00,
    co2PerKgReuse: 2.0,
    co2PerKgRepair: 1.8,
    co2PerKgDonate: 2.0,
    co2PerKgResell: 2.0,
    co2PerKgRecycle: 0.8,
    co2PerKgDispose: 0.0,
  }
};

/**
 * Calculates estimated CO2 avoided in kg based on item category and chosen action.
 */
export function calculateCO2Avoided(category: Category, action: CircularAction, customWeightKg?: number): number {
  const factor = MATERIAL_IMPACT_DATABASE[category] || MATERIAL_IMPACT_DATABASE['Other'];
  const weight = customWeightKg && customWeightKg > 0 ? customWeightKg : factor.avgWeightKg;

  let multiplier = 0;
  switch (action) {
    case 'Reuse':
      multiplier = factor.co2PerKgReuse;
      break;
    case 'Repair':
      multiplier = factor.co2PerKgRepair;
      break;
    case 'Donate':
      multiplier = factor.co2PerKgDonate;
      break;
    case 'Resell':
      multiplier = factor.co2PerKgResell;
      break;
    case 'Recycle':
      multiplier = factor.co2PerKgRecycle;
      break;
    case 'Dispose':
      multiplier = factor.co2PerKgDispose;
      break;
  }

  const result = weight * multiplier;
  return Math.round(result * 100) / 100;
}

/**
 * Centralized Eco Point calculation for gamification rewards:
 * Scan Item = +5
 * Reuse = +25
 * Repair = +30
 * Donate = +40
 * Resell = +20
 * Recycle = +20
 * Dispose = +0
 */
export function calculateEcoPoints(action: CircularAction | 'Scan' | 'scan'): number {
  const normalized = action.toLowerCase();
  switch (normalized) {
    case 'scan':
      return 5;
    case 'repair':
      return 30;
    case 'reuse':
      return 25;
    case 'donate':
      return 40;
    case 'resell':
      return 20;
    case 'recycle':
      return 20;
    case 'dispose':
      return 0;
    default:
      return 10;
  }
}
