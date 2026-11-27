// The weather levels' shared facts: what's saved, the levels' points and
// the events that earn them. Used by the chip (start-up) and award.ts and
// card.ts (on demand).

import { readStored } from '../storage';

export const JOURNEY_KEY = 'journey';

/**
 * The ladder, small steps first: Breeze on day one, then a level every 1–3
 * days of use up to Storm (2, 3, 5, 7, 10), longer after (20, 45, 100).
 * Days of use count in total, not in a row (a missed day costs nothing);
 * points come with them, and the top three need weather badges too.
 * texts.ts has the names, by id.
 */
export const LEVELS = [
  { id: 'dewdrop', emoji: '💧', points: 0, days: 0, badges: 0 },
  { id: 'breeze', emoji: '🌬️', points: 10, days: 0, badges: 0 },
  { id: 'cloud', emoji: '☁️', points: 30, days: 2, badges: 0 },
  { id: 'shower', emoji: '🌦️', points: 50, days: 3, badges: 0 },
  { id: 'rainbow', emoji: '🌈', points: 80, days: 5, badges: 0 },
  { id: 'snowflake', emoji: '❄️', points: 120, days: 7, badges: 0 },
  { id: 'storm', emoji: '⛈️', points: 180, days: 10, badges: 0 },
  { id: 'whirlwind', emoji: '🌪️', points: 300, days: 20, badges: 2 },
  { id: 'aurora', emoji: '🌌', points: 600, days: 45, badges: 3 },
  { id: 'diamond', emoji: '💎', points: 2000, days: 100, badges: 5 },
] as const;
export type Level = (typeof LEVELS)[number];

/** What the chip and the card read from the saved journey. */
export interface JourneyTotals {
  points: number;
  badges: string[];
  /** Days the app has been used. */
  daysUsed: number;
  /** The highest level reached (an index in LEVELS): kept when the rules change. */
  reached: number;
}

export type JourneyEvent =
  | { kind: 'day' | 'share' | 'aurora' }
  | { kind: 'quiz'; day: string }
  | { kind: 'country'; code: string }
  /** An easter egg found (secret badges: sauna, santa, record). */
  | { kind: 'secret'; id: string }
  /** A first step done (award.ts lists them). */
  | { kind: 'task'; id: string }
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

const indexOf = (id: string) => LEVELS.findIndex((level) => level.id === id);

export function savedTotals(): JourneyTotals {
  const saved = readStored(JOURNEY_KEY) as
    (Partial<JourneyTotals> & { reachedId?: unknown }) | undefined;
  const totals: JourneyTotals = {
    points: count(saved?.points),
    badges: Array.isArray(saved?.badges) ? saved.badges : [],
    // Never fewer days of use than days in a row: saves from before days
    // were counted had a streak but no days (the day already seen).
    daysUsed: Math.max(count(saved?.daysUsed), count((saved as { streak?: unknown })?.streak)),
    reached: 0,
  };
  if (!saved) return totals;
  // The level reached, saved by name (award.ts moves older saves over).
  if (typeof saved.reachedId === 'string') totals.reached = Math.max(0, indexOf(saved.reachedId));
  return totals;
}

/** What the points, days and badges reach now. */
function earnedLevel(totals: JourneyTotals): number {
  let index = 0;
  LEVELS.forEach((level, i) => {
    if (
      totals.points >= level.points &&
      totals.daysUsed >= level.days &&
      totals.badges.length >= level.badges
    ) {
      index = i;
    }
  });
  return index;
}

/** The level: what's earned now, never below what was reached before. */
export function levelIndex(totals: JourneyTotals): number {
  return Math.max(Math.min(totals.reached, LEVELS.length - 1), earnedLevel(totals));
}

/** Towards the next level, 0–1: the requirement further behind decides. */
export function progressToNext(totals: JourneyTotals): number {
  const index = levelIndex(totals);
  const level = LEVELS[index];
  const next = LEVELS[index + 1] as Level | undefined;
  if (!next) return 1;
  const part = (value: number, from: number, to: number) =>
    to <= from ? 1 : Math.max(0, Math.min(1, (value - from) / (to - from)));
  return Math.min(
    part(totals.points, level.points, next.points),
    part(totals.daysUsed, level.days, next.days),
    part(totals.badges.length, level.badges, next.badges),
  );
}
