// The weather levels' shared facts: what's saved, the levels' points and
// the events that earn them. Used by the chip (start-up) and award.ts and
// card.ts (on demand).

import { readStored } from '../storage';

export const JOURNEY_KEY = 'journey';

/**
 * Points and days of use (not in a row: a missed day costs nothing) each
 * level needs, so the higher ones take time however hard one explores.
 * texts.ts has the names.
 */
export const LEVELS = [
  { emoji: '🌬️', points: 0, days: 0 },
  { emoji: '☁️', points: 30, days: 0 },
  { emoji: '⛈️', points: 150, days: 7 },
  { emoji: '🌌', points: 600, days: 30 },
  { emoji: '💎', points: 2000, days: 100 },
] as const;
/** The top level also needs this many weather badges. */
export const TOP_LEVEL_BADGES = 5;

/** What the chip and the card read from the saved journey. */
export interface JourneyTotals {
  points: number;
  badges: string[];
  /** Days the app has been used. */
  daysUsed: number;
  /** The highest level reached: kept when the rules get stricter. */
  reached: number;
}

export type JourneyEvent =
  | { kind: 'day' | 'share' | 'aurora' }
  | { kind: 'quiz'; day: string }
  | { kind: 'country'; code: string }
  /** An easter egg found (secret badges: sauna, santa, record). */
  | { kind: 'secret'; id: string }
  | {
      kind: 'place';
      lat: number;
      lng: number;
      timezone: string;
      temperature: number;
      weatherCode: number;
      daylightSeconds: number | null;
      elevation?: number;
    };

const count = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

export function savedTotals(): JourneyTotals {
  const saved = readStored(JOURNEY_KEY) as Partial<JourneyTotals> | undefined;
  const totals = {
    points: count(saved?.points),
    badges: Array.isArray(saved?.badges) ? saved.badges : [],
    daysUsed: count(saved?.daysUsed),
    reached: count(saved?.reached),
  };
  // Saved before levels needed days of use: whatever was reached stays.
  if (saved && saved.daysUsed === undefined) totals.reached = levelIndex(totals, true);
  return totals;
}

/** What the points, days and badges reach now (`anyDays`: as before days counted). */
function earnedLevel(totals: JourneyTotals, anyDays = false): number {
  let index = 0;
  LEVELS.forEach((level, i) => {
    const top = i === LEVELS.length - 1;
    if (
      totals.points >= level.points &&
      (anyDays || totals.daysUsed >= level.days) &&
      (!top || totals.badges.length >= TOP_LEVEL_BADGES)
    ) {
      index = i;
    }
  });
  return index;
}

/** The level: what's earned now, never below what was reached before. */
export function levelIndex(totals: JourneyTotals, anyDays = false): number {
  return Math.max(Math.min(totals.reached, LEVELS.length - 1), earnedLevel(totals, anyDays));
}

/** Towards the next level, 0–1: the requirement further behind decides. */
export function progressToNext(totals: JourneyTotals): number {
  const index = levelIndex(totals);
  const level = LEVELS[index];
  const next = LEVELS[index + 1] as (typeof LEVELS)[number] | undefined;
  if (!next) return 1;
  const part = (value: number, from: number, to: number) =>
    to <= from ? 1 : Math.max(0, Math.min(1, (value - from) / (to - from)));
  return Math.min(
    part(totals.points, level.points, next.points),
    part(totals.daysUsed, level.days, next.days),
  );
}
