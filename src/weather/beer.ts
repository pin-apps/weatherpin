// "Beer outside": roughly how long a cold beer stays cold here right now.
// Just for fun, from the weather now: a 0.5 l glass of lager poured at
// 4 °C warms (or cools) towards the air, faster in wind, and the sun
// warms it more. Newton's law of cooling: T(t) = Ta + (T0 − Ta)·e^(−t/τ).

/** Poured from the fridge. */
const POURED = 4;
/** Lager tastes warm from here on. */
const TOO_WARM = 12;
/** Beer starts to freeze at about −2 °C (its alcohol lowers the point). */
const FREEZES = -2;
/**
 * Minutes for the gap to the air to shrink to 1/e in still shade: from 4
 * to 12 °C in about 40 minutes at 22 °C; sun and a breeze halve that.
 */
const STILL_AIR_MINUTES = 70;
/** Strong sunshine on the glass counts as up to this much warmer air. */
const SUN_WARMTH = 6;

export interface BeerWeather {
  /** Air temperature now, °C. */
  air: number;
  /** Wind now, m/s. */
  wind: number;
  /** The sun's height now, in degrees (below 0 at night). */
  sunElevation: number;
  /** Clear or partly cloudy now (WMO code 0–2). */
  sunny: boolean;
}

export type BeerOutside =
  | { kind: 'warms'; minutes: number; sun: boolean; wind: 'breezy' | 'windy' | null }
  | { kind: 'freezes'; minutes: number }
  | { kind: 'stays-cold' };

export function beerOutside(weather: BeerWeather): BeerOutside {
  const sun = weather.sunny && weather.sunElevation > 0;
  // Sunshine heats the glass like warmer air would.
  const air =
    weather.air + (sun ? SUN_WARMTH * Math.sin((weather.sunElevation * Math.PI) / 180) : 0);
  // Wind carries away the layer of cool air round the glass: up to twice
  // as fast.
  const tau = Math.max(STILL_AIR_MINUTES / 2, STILL_AIR_MINUTES / (1 + 0.15 * weather.wind));
  const minutesTo = (limit: number) => tau * Math.log((POURED - air) / (limit - air));

  if (air > TOO_WARM) {
    const wind = weather.wind >= 8 ? 'windy' : weather.wind >= 3 ? 'breezy' : null;
    return { kind: 'warms', minutes: minutesTo(TOO_WARM), sun, wind };
  }
  if (air < FREEZES) return { kind: 'freezes', minutes: minutesTo(FREEZES) };
  return { kind: 'stays-cold' };
}
