// The drift game's world (drift.ts draws it): a car on a walled track, the
// day's gate course (course.ts), puddles in the rain, and the weather's grip
// and wind. Pure (no page, no clock): drift.ts steps it at a fixed 60 steps
// a second, so a 120 Hz screen plays as a 60 Hz one does. What happens in a
// step comes back as events (drift.ts turns them into words and sounds).
// Numbers tuned with the user in the drift lab (2026-11-28).

import type { Course } from './course';

export type Surface = 'dry' | 'rain' | 'snow' | 'ice' | 'glare';
export type Steer = -1 | 0 | 1;

/** How much of the sideways slide each step takes away. */
export const GRIP: Record<Surface, number> = {
  dry: 0.2,
  rain: 0.1,
  snow: 0.05,
  ice: 0.02,
  glare: 0.008,
};

export const WIDTH = 380;
export const HEIGHT = 420;
export const STEPS_PER_SECOND = 60;
export const RUN_STEPS = 30 * STEPS_PER_SECOND;

const ACCEL = 0.08;
const MAX_SPEED = 3.5;
const DRAG = 0.985;
const STEER_RATE = 0.06;
// Steps for the steering to reach full lock (and back to straight).
const STEER_RAMP = 8;
// Below this speed, steering turns less: no turning on the spot.
const FULL_STEER_SPEED = 1.6;
const WALL_BOUNCE = 0.4;
const DRIFT_SPEED = MAX_SPEED * 0.37;
const DRIFT_ANGLE = (12 * Math.PI) / 180;
const SCORE_RATE = 0.03;
const COMBO_STEPS = 45;
const MAX_COMBO = 5;
// A drift ends after this many steps without sliding: its points are banked.
const DRIFT_ENDS_AFTER = 20;
// A clean drift this long buys a second.
const LONG_DRIFT_STEPS = 120;
const GATE_POINTS = 150;
const LAP_POINTS = 300;
const CONE_PENALTY = 50;
// Hits cost 2 s; a clean lap and a long drift give time back.
const HIT_STEPS = 2 * STEPS_PER_SECOND;
const LAP_STEPS = 2 * STEPS_PER_SECOND;
const LONG_DRIFT_BONUS = STEPS_PER_SECOND;
// A knocked cone lies down this long (one hit, one penalty).
const CONE_DOWN_STEPS = 60;
export const CONE_RADIUS = 7;
const PUDDLE_RADIUS = 30;
const PUDDLE_GRIP = 0.4;
export const CAR_RADIUS = 10;
export const MAX_SKIDS = 600;
// A strong gale, and no more: the car must stay drivable.
const MAX_WIND_PUSH = 0.045;

export interface Point {
  x: number;
  y: number;
}

export interface Cone extends Point {
  /** The step it was knocked over at. */
  hitAt: number;
}

export type GameEvent =
  | { type: 'gate'; points: number; drifting: boolean }
  | { type: 'lap'; clean: boolean; points: number }
  | { type: 'cone' }
  | { type: 'wall' }
  | { type: 'banked'; points: number; long: boolean }
  | { type: 'wiped'; points: number }
  | { type: 'combo'; level: number };

export interface World {
  surface: Surface;
  /** Added to the car's velocity every step (the wind). */
  wind: Point;
  course: Course;
  x: number;
  y: number;
  /** Radians; 0 points right, −π/2 up. */
  heading: number;
  /** −1…1: the steering, building up towards what's held. */
  steer: number;
  vx: number;
  vy: number;
  steps: number;
  /** The run ends at this step (hits bring it closer, bonuses push it on). */
  endAt: number;
  score: number;
  /** Points of the drift going on, banked when it ends cleanly. */
  pending: number;
  combo: number;
  drifting: boolean;
  driftSteps: number;
  calmSteps: number;
  gate: number;
  laps: number;
  cleanLap: boolean;
  cones: Cone[];
  puddles: Point[];
  /** Rear-wheel points while drifting, oldest first; null breaks a mark. */
  skids: (Point | null)[];
  /** Steps since the last cone or wall hit (for the red flash). */
  sinceHit: number;
  /** What happened in the last steps, for words and sounds. */
  events: GameEvent[];
}

/** A small seeded random number generator (mulberry32). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The wind's push on the car: m/s and the direction it blows from (0 =
 * north, as Open-Meteo gives it), north up on the track.
 */
export function windPush(speed: number, fromDegrees: number): Point {
  const push = Math.min(Math.max(speed, 0) * 0.0025, MAX_WIND_PUSH);
  const towards = ((fromDegrees + 180) * Math.PI) / 180;
  return { x: Math.sin(towards) * push, y: -Math.cos(towards) * push };
}

export function newWorld(surface: Surface, wind: Point, course: Course): World {
  const cones: Cone[] = [];
  for (const gate of course.gates) {
    cones.push({ ...gate.a, hitAt: -Infinity }, { ...gate.b, hitAt: -Infinity });
  }
  for (const pylon of course.pylons) cones.push({ ...pylon, hitAt: -Infinity });
  return {
    surface,
    wind,
    course,
    x: course.start.x,
    y: course.start.y,
    heading: course.start.heading,
    steer: 0,
    vx: 0,
    vy: 0,
    steps: 0,
    endAt: RUN_STEPS,
    score: 0,
    pending: 0,
    combo: 1,
    drifting: false,
    driftSteps: 0,
    calmSteps: 0,
    gate: 0,
    laps: 0,
    cleanLap: true,
    cones,
    puddles: surface === 'rain' ? course.puddles : [],
    skids: [],
    sinceHit: Infinity,
    events: [],
  };
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export const speedOf = (world: World) => Math.hypot(world.vx, world.vy);
export const finished = (world: World) => world.steps >= world.endAt;
export const secondsLeft = (world: World) =>
  Math.max(0, Math.ceil((world.endAt - world.steps) / STEPS_PER_SECOND));

const STEP_MS = 1000 / STEPS_PER_SECOND;
// After a hitch (a slow frame, a tab coming back), catch up at most this many.
const MAX_STEPS_PER_FRAME = 5;

/**
 * How many fixed steps a frame `elapsedMs` after the last one runs, and the
 * time left over for the next frame: 60 steps a second whatever the screen.
 */
export function stepsDue(spare: number, elapsedMs: number): { steps: number; spare: number } {
  const time = spare + Math.max(0, elapsedMs);
  const steps = Math.floor(time / STEP_MS + 1e-9);
  if (steps >= MAX_STEPS_PER_FRAME) return { steps: MAX_STEPS_PER_FRAME, spare: 0 };
  return { steps, spare: Math.max(0, time - steps * STEP_MS) };
}

/** The angle between where the car points and where it goes, in radians. */
export function driftAngle(world: World): number {
  const speed = speedOf(world);
  if (speed === 0) return 0;
  const along = (world.vx * Math.cos(world.heading) + world.vy * Math.sin(world.heading)) / speed;
  return Math.acos(Math.min(1, Math.max(-1, along)));
}

/** Did the move from p to q cross the line a–b? */
export function crosses(p: Point, q: Point, a: Point, b: Point): boolean {
  const side = (u: Point, v: Point, w: Point) =>
    (v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x);
  return side(a, b, p) * side(a, b, q) < 0 && side(p, q, a) * side(p, q, b) < 0;
}

/** One step (1/60 s) of the run. */
export function step(world: World, steer: Steer): void {
  if (finished(world)) return;
  world.steps++;
  world.sinceHit++;
  const before = { x: world.x, y: world.y };

  const ramp = 1 / STEER_RAMP;
  world.steer += Math.max(-ramp, Math.min(ramp, steer - world.steer));
  const speed = speedOf(world);
  world.heading += world.steer * STEER_RATE * Math.min(1, speed / FULL_STEER_SPEED);
  const fx = Math.cos(world.heading);
  const fy = Math.sin(world.heading);
  let vx = world.vx + fx * ACCEL;
  let vy = world.vy + fy * ACCEL;

  // Split into forward and sideways: grip eats the slide, drag the speed.
  const inPuddle = world.puddles.some((p) => distance(p, world) < PUDDLE_RADIUS);
  const grip = GRIP[world.surface] * (inPuddle ? PUDDLE_GRIP : 1);
  const forward = (vx * fx + vy * fy) * DRAG;
  const sideways = (-vx * fy + vy * fx) * (1 - grip);
  vx = forward * fx - sideways * fy + world.wind.x;
  vy = forward * fy + sideways * fx + world.wind.y;
  const newSpeed = Math.hypot(vx, vy);
  if (newSpeed > MAX_SPEED) {
    vx *= MAX_SPEED / newSpeed;
    vy *= MAX_SPEED / newSpeed;
  }
  world.vx = vx;
  world.vy = vy;
  world.x += vx;
  world.y += vy;

  bounceOffWalls(world);
  score(world);
  hitCones(world);
  passGates(world, before);
}

function hit(world: World, type: 'cone' | 'wall') {
  wipe(world);
  world.driftSteps = 0;
  world.calmSteps = 0;
  world.combo = 1;
  world.sinceHit = 0;
  world.endAt -= HIT_STEPS;
  world.cleanLap = false;
  world.events.push({ type });
}

/** A hit mid-drift: the drift's points are lost. */
function wipe(world: World) {
  if (world.pending <= 0) return;
  world.events.push({ type: 'wiped', points: Math.round(world.pending) });
  world.pending = 0;
}

function bank(world: World) {
  const points = Math.round(world.pending);
  world.pending = 0;
  if (points <= 0) return;
  const long = world.driftSteps >= LONG_DRIFT_STEPS;
  world.score += points;
  if (long) world.endAt += LONG_DRIFT_BONUS;
  world.events.push({ type: 'banked', points, long });
}

/** When the time is up: a drift still going counts. */
export function finish(world: World): void {
  if (world.pending > 0) bank(world);
}

function bounceOffWalls(world: World) {
  let bounced = false;
  if (world.x < CAR_RADIUS || world.x > WIDTH - CAR_RADIUS) {
    world.x = Math.min(Math.max(world.x, CAR_RADIUS), WIDTH - CAR_RADIUS);
    world.vx = -world.vx * WALL_BOUNCE;
    world.vy *= WALL_BOUNCE;
    bounced = true;
  }
  if (world.y < CAR_RADIUS || world.y > HEIGHT - CAR_RADIUS) {
    world.y = Math.min(Math.max(world.y, CAR_RADIUS), HEIGHT - CAR_RADIUS);
    world.vy = -world.vy * WALL_BOUNCE;
    world.vx *= WALL_BOUNCE;
    bounced = true;
  }
  // Scraping along a wall costs once, not every step.
  if (bounced && world.sinceHit > 30) hit(world, 'wall');
}

function score(world: World) {
  const angle = driftAngle(world);
  const speed = speedOf(world);
  const drifting = speed > DRIFT_SPEED && angle > DRIFT_ANGLE;
  if (drifting) {
    world.driftSteps++;
    world.calmSteps = 0;
    const combo = Math.min(MAX_COMBO, 1 + Math.floor(world.driftSteps / COMBO_STEPS));
    if (combo > world.combo) world.events.push({ type: 'combo', level: combo });
    world.combo = combo;
    world.pending += ((angle * 180) / Math.PI) * speed * SCORE_RATE * world.combo;
    world.skids.push({
      x: world.x - Math.cos(world.heading) * CAR_RADIUS,
      y: world.y - Math.sin(world.heading) * CAR_RADIUS,
    });
  } else {
    if (world.drifting) world.skids.push(null);
    world.calmSteps++;
    if (world.calmSteps >= DRIFT_ENDS_AFTER) {
      if (world.pending > 0) bank(world);
      world.driftSteps = 0;
      world.combo = 1;
    }
  }
  world.drifting = drifting;
  if (world.skids.length > MAX_SKIDS) world.skids.splice(0, world.skids.length - MAX_SKIDS);
}

function hitCones(world: World) {
  for (const cone of world.cones) {
    if (coneDown(world, cone)) continue;
    if (distance(cone, world) >= CONE_RADIUS + CAR_RADIUS) continue;
    world.score = Math.max(0, world.score - CONE_PENALTY);
    world.vx /= 2;
    world.vy /= 2;
    cone.hitAt = world.steps;
    hit(world, 'cone');
  }
}

/** A knocked cone lies down for a moment (drawn so, and not hit again). */
export const coneDown = (world: World, cone: Cone) => world.steps - cone.hitAt < CONE_DOWN_STEPS;

/** The gates, in order: drifting through one doubles it; a lap gives a bonus. */
function passGates(world: World, before: Point) {
  const gates = world.course.gates;
  const gate = gates[world.gate];
  if (!crosses(before, world, gate.a, gate.b)) return;
  const points = GATE_POINTS * (world.drifting ? 2 : 1);
  world.score += points;
  world.events.push({ type: 'gate', points, drifting: world.drifting });
  world.gate = (world.gate + 1) % gates.length;
  if (world.gate !== 0) return;
  world.laps++;
  const clean = world.cleanLap;
  if (clean) {
    world.score += LAP_POINTS;
    world.endAt += LAP_STEPS;
  }
  world.events.push({ type: 'lap', clean, points: clean ? LAP_POINTS : 0 });
  world.cleanLap = true;
}
