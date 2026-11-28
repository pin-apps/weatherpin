// The drift game's course: a new one every day, the same for everyone (made
// from the UTC date, as the daily quiz is): a winding loop or a figure 8
// around pylons, with 4–6 gates across the racing line, either direction.
// Tried and tuned in the drift lab (2026-11-28).

import { HEIGHT, WIDTH, seededRandom, type Point } from './physics';

export interface Gate {
  a: Point;
  b: Point;
}

export interface Course {
  gates: Gate[];
  pylons: Point[];
  start: Point & { heading: number };
  /** Puddles on the racing line, for a wet road. */
  puddles: Point[];
  eight: boolean;
}

// Gates and the line keep this far from the walls.
const MARGIN = 48;
const GATE_HALF = 36;

/** Today's date (UTC), as the course's name: "2026-11-28". */
export function courseDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function hash(text: string): number {
  let h = 2166136261;
  for (const c of text) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const inside = (p: Point): Point => ({
  x: Math.min(WIDTH - MARGIN, Math.max(MARGIN, p.x)),
  y: Math.min(HEIGHT - MARGIN, Math.max(MARGIN, p.y)),
});

export function makeCourse(day: string): Course {
  const r = seededRandom(hash(`course:${day}`));
  const eight = r() < 0.45;
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const a = 120 + r() * 25;
  const b = eight ? 140 + r() * 25 : 125 + r() * 30;
  const k1 = (r() * 2 - 1) * 0.18;
  const k2 = (r() * 2 - 1) * 0.12;
  const p1 = r() * Math.PI * 2;
  const p2 = r() * Math.PI * 2;
  const direction = r() < 0.5 ? 1 : -1;

  // The racing line, at t in [0, 2π).
  const at = (t: number): Point => {
    t *= direction;
    if (eight) {
      return {
        x: cx + a * 0.78 * Math.sin(2 * t) * (1 + k2 * Math.sin(t + p2)),
        y: cy + b * Math.sin(t),
      };
    }
    const wobble = 1 + k1 * Math.sin(2 * t + p1) + k2 * Math.sin(3 * t + p2);
    return { x: cx + a * Math.cos(t) * wobble, y: cy + b * Math.sin(t) * wobble };
  };

  const count = 4 + Math.floor(r() * 3);
  const shift = r() * Math.PI * 2;
  const along: number[] = [];
  const gates: Gate[] = [];
  for (let i = 0; i < count; i++) {
    let t = shift + (i / count) * Math.PI * 2;
    // On a figure 8, gates keep off the crossing (t near 0 and π).
    if (eight) {
      const m = ((t % Math.PI) + Math.PI) % Math.PI;
      if (m < 0.45) t += 0.45 - m;
      if (m > Math.PI - 0.45) t -= m - (Math.PI - 0.45);
    }
    along.push(t);
    const p = inside(at(t));
    const q = inside(at(t + 0.02));
    const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const nx = -(q.y - p.y) / length;
    const ny = (q.x - p.x) / length;
    gates.push({
      a: inside({ x: p.x + nx * GATE_HALF, y: p.y + ny * GATE_HALF }),
      b: inside({ x: p.x - nx * GATE_HALF, y: p.y - ny * GATE_HALF }),
    });
  }

  const pylons = eight
    ? [
        { x: cx, y: cy - b * 0.5 },
        { x: cx, y: cy + b * 0.5 },
        { x: cx - 8, y: cy - b * 0.5 + 16 },
        { x: cx + 8, y: cy + b * 0.5 - 16 },
      ]
    : [
        { x: cx, y: cy - 45 },
        { x: cx, y: cy },
        { x: cx, y: cy + 45 },
      ];

  // Start a little before the first gate, on the line, heading along it.
  const s0 = inside(at(along[0] - 0.55));
  const s1 = inside(at(along[0] - 0.5));
  // Puddles half-way between gates, where they hurt.
  const puddles = along.slice(0, 3).map((t, i) => inside(at((t + (along[i + 1] ?? t + 1)) / 2)));
  return {
    gates,
    pylons,
    start: { ...s0, heading: Math.atan2(s1.y - s0.y, s1.x - s0.x) },
    puddles,
    eight,
  };
}
