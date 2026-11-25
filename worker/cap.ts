// FMI's warnings come as CAP (Common Alerting Protocol) XML files, one per
// warning, each with an <info> block per language and the areas' exact
// outlines. This turns one file into the small FmiWarning the app needs.
// Written for speed: Cloudflare's free plan allows 10 ms of CPU per call,
// and FMI's biggest files are ~0.8 MB of coordinates, so the outlines are
// scanned once, character by character, and snapped to a 0.005° grid.

import { GRID, type Box, type FmiLanguage, type FmiWarning, type FmiWarningText } from './types.ts';

const LANGUAGES: Record<string, FmiLanguage> = {
  'en-GB': 'en',
  'fi-FI': 'fi',
  'sv-FI': 'sv',
};

const LEVELS: Record<string, FmiWarning['level']> = {
  yellow: 'yellow',
  orange: 'orange',
  red: 'red',
};
// Without an awareness level, CAP's severity decides.
const SEVERITY_LEVELS: Record<string, FmiWarning['level']> = {
  Minor: 'yellow',
  Moderate: 'yellow',
  Severe: 'orange',
  Extreme: 'red',
};

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decode(text: string): string {
  return text
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
      if (name[0] === '#') {
        const code = name[1] === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
      }
      return ENTITIES[name] ?? whole;
    })
    .trim();
}

/** The text of the first <name> in `xml`, decoded, or undefined. */
function tag(xml: string, name: string): string | undefined {
  const match = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml);
  if (!match) return undefined;
  const text = decode(match[1].replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1'));
  return text || undefined;
}

function infoBlocks(xml: string): string[] {
  return [...xml.matchAll(/<info>([\s\S]*?)<\/info>/g)].map((match) => match[1]);
}

/**
 * The outlines in one <info> block, snapped to the grid, consecutive
 * repeats dropped. CAP polygons are "lat,lng lat,lng …".
 */
export function polygonsOf(block: string): number[][] {
  const polygons: number[][] = [];
  let from = 0;
  for (;;) {
    const start = block.indexOf('<polygon>', from);
    if (start < 0) break;
    const end = block.indexOf('</polygon>', start);
    if (end < 0) break;
    const ring: number[] = [];
    let i = start + 9;
    let previousLat = NaN;
    let previousLng = NaN;
    while (i < end) {
      const c = block.charCodeAt(i);
      if (c === 32 || c === 10 || c === 13 || c === 9) {
        i++;
        continue;
      }
      const [lat, afterLat] = number(block, i, end);
      const [lng, afterLng] = number(block, afterLat + 1, end);
      i = afterLng;
      if (Number.isNaN(lat) || Number.isNaN(lng)) break;
      const a = Math.round(lat * GRID);
      const b = Math.round(lng * GRID);
      if (a !== previousLat || b !== previousLng) {
        ring.push(a, b);
        previousLat = a;
        previousLng = b;
      }
    }
    // A ring needs three corners.
    if (ring.length >= 6) polygons.push(ring);
    from = end;
  }
  return polygons;
}

/** The decimal number at s[i…] (before `end`), and the index after it. */
function number(s: string, i: number, end: number): [number, number] {
  let sign = 1;
  let value = 0;
  let scale = 0;
  let digits = 0;
  if (s.charCodeAt(i) === 45) {
    sign = -1;
    i++;
  }
  for (; i < end; i++) {
    const c = s.charCodeAt(i);
    if (c === 46 && !scale) {
      scale = 1;
      continue;
    }
    if (c < 48 || c > 57) break;
    value = value * 10 + (c - 48);
    digits++;
    if (scale) scale *= 10;
  }
  if (!digits) return [NaN, i];
  return [sign * (scale ? value / scale : value), i];
}

function levelOf(block: string): FmiWarning['level'] {
  // FMI: <valueName>color</valueName><value>yellow</value>; MeteoAlarm's
  // profile: awareness_level "2; yellow; Moderate".
  for (const match of block.matchAll(/<parameter>([\s\S]*?)<\/parameter>/g)) {
    const name = tag(match[1], 'valueName');
    const value = tag(match[1], 'value') ?? '';
    const colour = (name === 'awareness_level' ? value.split(';')[1] : value)?.trim().toLowerCase();
    if ((name === 'color' || name === 'awareness_level') && colour && LEVELS[colour]) {
      return LEVELS[colour];
    }
  }
  return SEVERITY_LEVELS[tag(block, 'severity') ?? ''] ?? 'yellow';
}

function textOf(block: string): FmiWarningText {
  const areas = [...block.matchAll(/<areaDesc>([\s\S]*?)<\/areaDesc>/g)]
    .map((match) => decode(match[1]))
    .filter(Boolean);
  return {
    event: tag(block, 'event') ?? '',
    headline: tag(block, 'headline'),
    description: tag(block, 'description') ?? '',
    instruction: tag(block, 'instruction'),
    areas: [...new Set(areas)],
  };
}

/**
 * One FMI CAP file as an FmiWarning, or null when it isn't a warning to
 * show (a test, an update that cancels, no outlines).
 */
export function compactCap(id: string, xml: string): FmiWarning | null {
  const infoAt = xml.indexOf('<info>');
  const head = infoAt >= 0 ? xml.slice(0, infoAt) : xml;
  if (tag(head, 'status') !== 'Actual' || tag(head, 'msgType') === 'Cancel') return null;
  const blocks = infoBlocks(xml);
  if (blocks.length === 0) return null;

  const texts: FmiWarning['texts'] = {};
  for (const block of blocks) {
    const language = LANGUAGES[tag(block, 'language') ?? ''];
    if (language && !texts[language]) texts[language] = textOf(block);
  }
  // The outlines are the same in every language: one block is enough.
  const polygons = polygonsOf(blocks[0]);
  if (polygons.length === 0) return null;

  return {
    id,
    box: boxOf(polygons),
    level: levelOf(blocks[0]),
    onset: tag(blocks[0], 'onset') ?? tag(blocks[0], 'effective'),
    expires: tag(blocks[0], 'expires'),
    texts,
    polygons,
  };
}

/** The box around flat [lat, lng, …] rings. */
export function boxOf(polygons: number[][]): Box {
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;
  for (const ring of polygons) {
    for (let i = 0; i < ring.length; i += 2) {
      south = Math.min(south, ring[i]);
      north = Math.max(north, ring[i]);
      west = Math.min(west, ring[i + 1]);
      east = Math.max(east, ring[i + 1]);
    }
  }
  return [south, west, north, east];
}

/** The CAP file ids in FMI's RSS list, in order, each once. */
export function capIdsOf(rss: string): string[] {
  const ids: string[] = [];
  for (const match of rss.matchAll(
    /<link>\s*https:\/\/alerts\.fmi\.fi\/cap\/([^<\s]+)\s*<\/link>/g,
  )) {
    if (isCapId(match[1]) && !ids.includes(match[1])) ids.push(match[1]);
  }
  return ids;
}

// E.g. 2026/11-21/09-52-15Z/2.49.0.1.246.0.0.2026.28029135.3397….xml
const CAP_ID = /^\d{4}\/\d{2}-\d{2}\/\d{2}-\d{2}-\d{2}Z\/[0-9.]{10,200}\.xml$/;

/** Only FMI's own CAP file paths: never anything else. */
export function isCapId(id: string): boolean {
  return CAP_ID.test(id);
}
