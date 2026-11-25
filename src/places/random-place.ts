// "Random place": a random point on land, anywhere from 75° N to 60° S,
// with no request. Each spot of the Earth's surface is as likely as any
// other (so the far north, stretched on the map, isn't favoured). Land is
// a rough 0.5° map (land-mask.ts); a point right at a coast may still be
// just offshore.
//
// Loaded only when the button is pressed (main.ts imports it on demand), so
// the land map isn't part of everyone's first download.

import { LAND_ROWS, NORTH, SOUTH, STEP } from './land-mask';

/** Per row (north to south): land from-to columns, as pairs. */
let landRuns: number[][] | undefined;

function decode(): number[][] {
  return LAND_ROWS.split(';').map((row) => {
    const pairs: number[] = [];
    let column = 0;
    row.split(',').forEach((hex, i) => {
      const length = parseInt(hex, 16);
      // Runs alternate sea, land, sea, …: odd ones are land.
      if (i % 2 === 1) pairs.push(column, column + length);
      column += length;
    });
    return pairs;
  });
}

/** Whether the land map has land at this point. */
export function isLand(lat: number, lng: number): boolean {
  landRuns ??= decode();
  const row = landRuns[Math.floor((NORTH - lat) / STEP)];
  if (!row) return false;
  const column = Math.floor((lng + 180) / STEP);
  for (let i = 0; i < row.length; i += 2) {
    if (column >= row[i] && column < row[i + 1]) return true;
  }
  return false;
}

/** A random point on land. `random` is Math.random unless a test needs otherwise. */
export function randomLandPoint(random: () => number = Math.random): {
  lat: number;
  lng: number;
} {
  // Equal area: the sine of the latitude is spread evenly (a band near the
  // equator holds more of the Earth than one near the poles).
  const low = Math.sin((SOUTH * Math.PI) / 180);
  const high = Math.sin((NORTH * Math.PI) / 180);
  // About a third of the Earth here is land: a few tries on average. The
  // limit only guards against a broken land map.
  for (let attempt = 0; attempt < 1000; attempt++) {
    const lat = (Math.asin(low + random() * (high - low)) * 180) / Math.PI;
    const lng = random() * 360 - 180;
    if (isLand(lat, lng)) return { lat, lng };
  }
  // Helsinki, should the land map ever be empty.
  return { lat: 60.17, lng: 24.94 };
}
