// The chance of seeing the aurora right now (the next 30–90 minutes), from
// NOAA's Space Weather Prediction Center: the OVATION model's world grid,
// 1° by 1°, updated every few minutes. Public domain, no key, open to
// browsers. ~150 KB, so the Sky section asks only for dark, clear places
// far north or south.
// https://www.swpc.noaa.gov/products/aurora-30-minute-forecast

const OVATION_URL = 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json';
const CACHE_MS = 10 * 60 * 1000;

/** How far poleward to look: aurora there shows low on the horizon. */
const HORIZON_DEGREES = 5;
/** That far, it counts only when clearly more likely than overhead. */
const HORIZON_MARGIN = 10;

/** The chance at a place, 0–100, and whether it's low on the horizon. */
export interface AuroraChance {
  percent: number;
  lowOnHorizon: boolean;
}

/** Chances by "longitude,latitude" (longitude 0–359). */
type Grid = Map<string, number>;

let cached: { grid: Promise<Grid>; until: number } | undefined;

function loadGrid(): Promise<Grid> {
  if (cached && cached.until > Date.now()) return cached.grid;
  const grid = fetch(OVATION_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<{ coordinates?: [number, number, number][] }>;
    })
    .then((body) => {
      if (!Array.isArray(body.coordinates)) throw new Error('unexpected');
      return new Map(body.coordinates.map(([lng, lat, value]) => [`${lng},${lat}`, value]));
    });
  cached = { grid, until: Date.now() + CACHE_MS };
  // A failure is not kept: the next place tries again.
  grid.catch(() => (cached = undefined));
  return grid;
}

export async function auroraChance(lat: number, lng: number): Promise<AuroraChance> {
  const grid = await loadGrid();
  const column = ((Math.round(lng) % 360) + 360) % 360;
  const chanceAt = (latitude: number) =>
    grid.get(`${column},${Math.max(-90, Math.min(90, latitude))}`) ?? 0;
  const row = Math.round(lat);
  const overhead = chanceAt(row);
  // Towards the pole: north in the north, south in the south.
  const poleward = Math.sign(lat) || 1;
  let horizon = 0;
  for (let step = 1; step <= HORIZON_DEGREES; step++) {
    horizon = Math.max(horizon, chanceAt(row + poleward * step));
  }
  return horizon >= overhead + HORIZON_MARGIN
    ? { percent: horizon, lowOnHorizon: true }
    : { percent: overhead, lowOnHorizon: false };
}
