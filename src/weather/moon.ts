// The moon's phase, worked out from the date: no request needed. The phase
// is the same everywhere on Earth at a given moment; only its look differs
// (the lit side is mirrored south of the equator).
//
// This uses the average length of a lunar month, so a named phase can be
// up to about a day early or late. That's fine for "Waxing crescent", not
// for astronomy.

import { msg, t } from '../i18n';

/** Average days from one new moon to the next. */
const LUNAR_MONTH_DAYS = 29.530588853;
/** A known new moon: 6 January 2000, 18:14 UTC. */
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 24 * 60 * 60 * 1000;

// Eight phases, in order from new moon. Emoji as seen from the north.
const PHASES = [
  { name: msg('New moon'), north: '🌑', south: '🌑' },
  { name: msg('Waxing crescent'), north: '🌒', south: '🌘' },
  { name: msg('First quarter'), north: '🌓', south: '🌗' },
  { name: msg('Waxing gibbous'), north: '🌔', south: '🌖' },
  { name: msg('Full moon'), north: '🌕', south: '🌕' },
  { name: msg('Waning gibbous'), north: '🌖', south: '🌔' },
  { name: msg('Last quarter'), north: '🌗', south: '🌓' },
  { name: msg('Waning crescent'), north: '🌘', south: '🌒' },
] as const;

export interface MoonPhase {
  /** Translated, e.g. "Waxing crescent". */
  name: string;
  emoji: string;
  /** How much of the disc is lit, 0–100. */
  litPercent: number;
}

// New moon, the quarters and full moon are moments: they get a day either
// side; the names in between (crescent, gibbous) cover the rest.
const PRINCIPAL_WINDOW = 1 / LUNAR_MONTH_DAYS;

/** Index in PHASES for a point in the month (0 = new moon, 0.5 = full). */
function phaseIndex(cycle: number): number {
  const quarters = cycle * 4;
  const nearest = Math.round(quarters);
  if (Math.abs(quarters - nearest) / 4 <= PRINCIPAL_WINDOW) return (nearest % 4) * 2;
  return Math.floor(quarters) * 2 + 1;
}

export function moonPhase(time: number, latitude: number): MoonPhase {
  const days = (time - KNOWN_NEW_MOON) / DAY_MS;
  // 0 at new moon, 0.5 at full moon.
  const cycle = (((days / LUNAR_MONTH_DAYS) % 1) + 1) % 1;
  const phase = PHASES[phaseIndex(cycle)];
  return {
    name: t(phase.name),
    emoji: latitude < 0 ? phase.south : phase.north,
    litPercent: ((1 - Math.cos(2 * Math.PI * cycle)) / 2) * 100,
  };
}
