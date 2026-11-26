// The weather levels' shared facts: what's saved, the levels' points and
// the events that earn them. Used by the chip (start-up) and award.ts and
// card.ts (on demand).

import { readStored } from '../storage';

export const JOURNEY_KEY = 'journey';

/** Points needed for each level (texts.ts has the names). */
export const LEVELS = [
  { emoji: '🌬️', points: 0 },
  { emoji: '☁️', points: 30 },
  { emoji: '⛈️', points: 150 },
  { emoji: '🌌', points: 600 },
  { emoji: '💎', points: 2000 },
] as const;
/** The top level also needs this many weather badges. */
export const TOP_LEVEL_BADGES = 5;

/** What the chip and the card read from the saved journey. */
export interface JourneyTotals {
  points: number;
  badges: string[];
}

export type JourneyEvent =
  | { kind: 'day' | 'share' | 'aurora' }
  | { kind: 'quiz'; day: string }
  | { kind: 'country'; code: string }
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

export function savedTotals(): JourneyTotals {
  const saved = readStored(JOURNEY_KEY) as Partial<JourneyTotals> | undefined;
  return {
    points: typeof saved?.points === 'number' ? saved.points : 0,
    badges: Array.isArray(saved?.badges) ? saved.badges : [],
  };
}

export function levelIndex({ points, badges }: JourneyTotals): number {
  let index = 0;
  LEVELS.forEach((level, i) => {
    const top = i === LEVELS.length - 1;
    if (points >= level.points && (!top || badges.length >= TOP_LEVEL_BADGES)) index = i;
  });
  return index;
}
