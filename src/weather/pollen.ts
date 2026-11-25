// Pollen levels and the pollen forecast per day (Europe only, in season).
//
// Levels from grains per m³ of air, in the bands pollen services in the
// Nordics use (e.g. the Aerobiology Unit in Turku): trees release far more
// pollen than grasses and herbs, so the same count means less for a tree.
//   Trees (birch, alder, olive):        low 1–10, moderate 11–100, high > 100
//   Grass, mugwort, ragweed:            low 1–10, moderate 11–30,  high > 30

import { worstPerDay } from './air-quality-days';
import { POLLEN_TYPES, type AirQuality, type PollenVariable } from './air-quality';
import { msg } from '../i18n';

export type PollenLevel = 'low' | 'moderate' | 'high';

export const POLLEN_LEVEL_NAMES: Record<PollenLevel, string> = {
  low: msg('pollen|Low'),
  moderate: msg('pollen|Moderate'),
  high: msg('pollen|High'),
};

const TREES = new Set<PollenVariable>(['birch_pollen', 'alder_pollen', 'olive_pollen']);
const LEVEL_ORDER: PollenLevel[] = ['high', 'moderate', 'low'];

/** The level for a count, or null under 1 grain/m³ (none in the air). */
export function pollenLevel(variable: PollenVariable, grains: number): PollenLevel | null {
  if (grains < 1) return null;
  const highFrom = TREES.has(variable) ? 101 : 31;
  if (grains >= highFrom) return 'high';
  return grains >= 11 ? 'moderate' : 'low';
}

export interface PollenDay {
  /** Local date, e.g. "2026-11-16". */
  date: string;
  /** Types in the air that day at their worst, highest level first. */
  types: { name: string; level: PollenLevel }[];
}

/**
 * Each day's worst hour per pollen type, as far as the forecast reaches;
 * today from now on. Empty when no type is forecast anywhere (outside
 * Europe, or out of season), so the app then shows nothing.
 */
export function pollenByDay(airQuality: AirQuality): PollenDay[] {
  const hourly = airQuality.hourly;
  if (!hourly) return [];
  const days = new Map<string, PollenDay>();
  let any = false;
  for (const [variable, name] of POLLEN_TYPES) {
    for (const day of worstPerDay(hourly.time, hourly[variable], airQuality.current.time)) {
      const entry = days.get(day.date) ?? { date: day.date, types: [] };
      days.set(day.date, entry);
      const level = pollenLevel(variable, day.worst);
      if (!level) continue;
      entry.types.push({ name, level });
      any = true;
    }
  }
  if (!any) return [];
  return [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => ({
      ...day,
      // Stable sort: same level keeps the POLLEN_TYPES order.
      types: day.types.sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)),
    }));
}
