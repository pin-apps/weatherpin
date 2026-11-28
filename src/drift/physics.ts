// The drift game's world (drift.ts draws it): a car on a walled track,
// cones, puddles in the rain, and the weather's grip and wind. Pure (no
// page, no clock): drift.ts steps it at a fixed 60 steps a second, so a
// 120 Hz screen plays as a 60 Hz one does. The numbers follow the drift
// spec (2026-11-28), made calmer: top speed 3.5 instead of 5.5.

export type Surface = 'dry' | 'rain' | 'snow' | 'ice';
export type Steer = -1 | 0 | 1;

/** How much of the sideways slide each step takes away. */
export const GRIP: Record<Surface, number> = { dry: 0.2, rain: 0.1, snow: 0.06, ice: 0.032 };

export const WIDTH = 380;
export const HEIGHT = 420;
export const STEPS_PER_SECOND = 60;
export const RUN_STEPS = 20 * STEPS_PER_SECOND;

const ACCEL = 0.08;
const MAX_SPEED = 3.5;
const DRAG = 0.985;
const STEER_RATE = 0.06;
// Below this speed, steering turns less: no turning on the spot.
const FULL_STEER_SPEED = 1.6;
const WALL_BOUNCE = 0.4;
const DRIFT_SPEED = 1.3;
const DRIFT_ANGLE = (12 * Math.PI) / 180;
const SCORE_RATE = 0.03;
const COMBO_STEPS = 45;
const COMBO_GRACE = 30;
const MAX_COMBO = 5;
const CONE_COUNT = 9;
const CONE_PENALTY = 100;
const CONE_RADIUS = 7;
const PUDDLE_COUNT = 3;
const PUDDLE_RADIUS = 30;
const PUDDLE_GRIP = 0.4;
export const CAR_RADIUS = 8;
const START = { x: WIDTH / 2, y: HEIGHT - 60 };
// Cones and puddles keep clear of the start and of the walls.
const CLEAR_OF_START = 80;
const EDGE = 24;
export const MAX_SKIDS = 600;
// A strong gale, and no more: the car must stay drivable.
const MAX_WIND_PUSH = 0.045;

export interface Point {
  x: number;
  y: number;
}

export interface World {
  surface: Surface;
  /** Added to the car's velocity every step (the wind). */
  wind: Point;
  x: number;
  y: number;
  /** Radians; 0 points right, −π/2 up. */
  heading: number;
  vx: number;
  vy: number;
  steps: number;
  score: number;
  combo: number;
  drifting: boolean;
  driftSteps: number;
  calmSteps: number;
  cones: Point[];
  puddles: Point[];
  /** Rear-wheel points while drifting, oldest first; null breaks a mark. */
  skids: (Point | null)[];
  /** Steps since the last cone or wall hit (for the red flash). */
  sinceHit: number;
  random: () => number;
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

export function newWorld(surface: Surface, wind: Point, seed: number): World {
  const random = seededRandom(seed);
  const world: World = {
    surface,
    wind,
    x: START.x,
    y: START.y,
    heading: -Math.PI / 2,
    vx: 0,
    vy: 0,
    steps: 0,
    score: 0,
    combo: 1,
    drifting: false,
    driftSteps: 0,
    calmSteps: 0,
    cones: [],
    puddles: [],
    skids: [],
    sinceHit: Infinity,
    random,
  };
  if (surface === 'rain') {
    for (let i = 0; i < PUDDLE_COUNT; i++) world.puddles.push(freeSpot(world, PUDDLE_RADIUS));
  }
  for (let i = 0; i < CONE_COUNT; i++) world.cones.push(freeSpot(world, CONE_RADIUS));
  return world;
}

/** A random spot away from the walls and the start (and, if it can, the car). */
function freeSpot(world: World, radius: number): Point {
  const margin = EDGE + radius;
  let spot: Point = { x: margin, y: margin };
  for (let tries = 0; tries < 40; tries++) {
    spot = {
      x: margin + world.random() * (WIDTH - 2 * margin),
      y: margin + world.random() * (HEIGHT - 2 * margin),
    };
    if (distance(spot, START) > CLEAR_OF_START && distance(spot, world) > CLEAR_OF_START / 2) {
      break;
    }
  }
  return spot;
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export const speedOf = (world: World) => Math.hypot(world.vx, world.vy);
export const finished = (world: World) => world.steps >= RUN_STEPS;
export const secondsLeft = (world: World) =>
  Math.max(0, Math.ceil((RUN_STEPS - world.steps) / STEPS_PER_SECOND));

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

/** One step (1/60 s) of the run. */
export function step(world: World, steer: Steer): void {
  if (finished(world)) return;
  world.steps++;
  world.sinceHit++;

  const speed = speedOf(world);
  world.heading += steer * STEER_RATE * Math.min(1, speed / FULL_STEER_SPEED);
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
}

function bounceOffWalls(world: World) {
  let hit = false;
  if (world.x < CAR_RADIUS || world.x > WIDTH - CAR_RADIUS) {
    world.x = Math.min(Math.max(world.x, CAR_RADIUS), WIDTH - CAR_RADIUS);
    world.vx = -world.vx * WALL_BOUNCE;
    world.vy *= WALL_BOUNCE;
    hit = true;
  }
  if (world.y < CAR_RADIUS || world.y > HEIGHT - CAR_RADIUS) {
    world.y = Math.min(Math.max(world.y, CAR_RADIUS), HEIGHT - CAR_RADIUS);
    world.vy = -world.vy * WALL_BOUNCE;
    world.vx *= WALL_BOUNCE;
    hit = true;
  }
  if (hit) breakCombo(world);
}

function score(world: World) {
  const angle = driftAngle(world);
  const speed = speedOf(world);
  const drifting = speed > DRIFT_SPEED && angle > DRIFT_ANGLE;
  if (drifting) {
    world.driftSteps++;
    world.calmSteps = 0;
    world.combo = Math.min(MAX_COMBO, 1 + Math.floor(world.driftSteps / COMBO_STEPS));
    world.score += ((angle * 180) / Math.PI) * speed * SCORE_RATE * world.combo;
    // A mark from the rear of the car.
    world.skids.push({
      x: world.x - Math.cos(world.heading) * CAR_RADIUS,
      y: world.y - Math.sin(world.heading) * CAR_RADIUS,
    });
  } else {
    if (world.drifting) world.skids.push(null);
    world.calmSteps++;
    if (world.calmSteps >= COMBO_GRACE) {
      world.driftSteps = 0;
      world.combo = 1;
    }
  }
  world.drifting = drifting;
  if (world.skids.length > MAX_SKIDS) world.skids.splice(0, world.skids.length - MAX_SKIDS);
}

function hitCones(world: World) {
  world.cones.forEach((cone, i) => {
    if (distance(cone, world) >= CONE_RADIUS + CAR_RADIUS) return;
    world.score = Math.max(0, world.score - CONE_PENALTY);
    world.vx /= 2;
    world.vy /= 2;
    breakCombo(world);
    world.cones[i] = freeSpot(world, CONE_RADIUS);
  });
}

function breakCombo(world: World) {
  world.driftSteps = 0;
  world.calmSteps = 0;
  world.combo = 1;
  world.sinceHit = 0;
}
