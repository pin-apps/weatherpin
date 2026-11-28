// The drift game's rules (src/drift/physics.ts) and its road from the
// weather (src/drift/surface.ts), without a browser page: steps, speeds,
// walls, drifting and scoring, cones, the wind, 60 Hz vs 120 Hz.

import { expect, test } from '@playwright/test';
import {
  GRIP,
  HEIGHT,
  RUN_STEPS,
  WIDTH,
  driftAngle,
  newWorld,
  seededRandom,
  speedOf,
  step,
  stepsDue,
  windPush,
  type Steer,
  type World,
} from '../src/drift/physics';
import { roadFor } from '../src/drift/surface';
import { forecastFixture } from './fixtures/forecast';
import type { Forecast } from '../src/weather/api';

const still = { x: 0, y: 0 };

/** A world with no cones in the way. */
function openTrack(surface: World['surface'] = 'dry', wind = still): World {
  const world = newWorld(surface, wind, 1);
  world.cones = [];
  world.puddles = [];
  return world;
}

function run(world: World, steps: number, steer: Steer = 0) {
  for (let i = 0; i < steps; i++) step(world, steer);
}

test.describe('drift physics', () => {
  test('60 Hz and 120 Hz screens run the same number of steps', () => {
    const count = (frameMs: number, frames: number) => {
      let spare = 0;
      let steps = 0;
      for (let i = 0; i < frames; i++) {
        const due = stepsDue(spare, frameMs);
        spare = due.spare;
        steps += due.steps;
      }
      return steps;
    };
    expect(count(1000 / 60, 120)).toBe(120);
    expect(count(1000 / 120, 240)).toBe(120);
    // A hitch catches up a little, never a burst.
    expect(stepsDue(0, 2000).steps).toBe(5);
  });

  test('no turning at a standstill; the car speeds up to its top speed only', () => {
    const world = openTrack();
    const heading = world.heading;
    world.vx = 0;
    world.vy = 0;
    // The first step: speed 0, so steering does nothing.
    step(world, 1);
    expect(world.heading).toBe(heading);
    const top = openTrack();
    run(top, 120);
    expect(speedOf(top)).toBeLessThanOrEqual(3.5 + 1e-9);
    expect(speedOf(top)).toBeGreaterThan(2.5);
  });

  test('walls bounce the car back, slower, and keep it on the track', () => {
    const world = openTrack();
    world.y = 10;
    world.vy = -3;
    step(world, 0);
    expect(world.y).toBeGreaterThanOrEqual(8);
    expect(world.vy).toBeGreaterThan(0);
    expect(world.vy).toBeLessThan(1.5);
    expect(world.combo).toBe(1);
    expect(world.sinceHit).toBe(0);
    // Steering in circles for a whole run never leaves the track.
    const circling = openTrack('ice');
    run(circling, RUN_STEPS, 1);
    expect(circling.x).toBeGreaterThanOrEqual(0);
    expect(circling.x).toBeLessThanOrEqual(WIDTH);
    expect(circling.y).toBeGreaterThanOrEqual(0);
    expect(circling.y).toBeLessThanOrEqual(HEIGHT);
  });

  test('sliding scores, more on ice than on dry asphalt, and the combo grows', () => {
    const scoreOn = (surface: World['surface']) => {
      const world = openTrack(surface);
      run(world, 60);
      // Weave: steer one way, then the other.
      for (let i = 0; i < 6; i++) run(world, 40, i % 2 ? 1 : -1);
      return world;
    };
    const ice = scoreOn('ice');
    const dry = scoreOn('dry');
    expect(ice.score).toBeGreaterThan(0);
    expect(ice.score).toBeGreaterThan(dry.score);
    expect(ice.skids.length).toBeGreaterThan(0);
    expect(ice.skids.length).toBeLessThanOrEqual(600);
    expect(GRIP.ice / GRIP.dry).toBeCloseTo(0.16);

    const world = openTrack('ice');
    world.vx = 3;
    world.vy = 0;
    world.heading = -Math.PI / 2;
    world.driftSteps = 89;
    step(world, 0);
    expect(driftAngle(world)).toBeGreaterThan(Math.PI / 15);
    expect(world.combo).toBe(3);
  });

  test('a cone costs 100 points, never below 0, and moves elsewhere', () => {
    const world = openTrack();
    world.cones = [{ x: world.x, y: world.y - 4 }];
    world.score = 60;
    world.combo = 4;
    step(world, 0);
    expect(world.score).toBe(0);
    expect(world.combo).toBe(1);
    expect(world.cones).toHaveLength(1);
    expect(Math.hypot(world.cones[0].x - world.x, world.cones[0].y - world.y)).toBeGreaterThan(15);
  });

  test('the same seed places the same cones; rain adds puddles', () => {
    const a = newWorld('rain', still, 42);
    const b = newWorld('rain', still, 42);
    expect(a.cones).toEqual(b.cones);
    expect(a.cones).toHaveLength(9);
    expect(a.puddles).toHaveLength(3);
    expect(newWorld('dry', still, 42).puddles).toHaveLength(0);
    // None at the start.
    for (const cone of a.cones) {
      expect(Math.hypot(cone.x - WIDTH / 2, cone.y - (HEIGHT - 60))).toBeGreaterThan(80);
    }
    expect(seededRandom(7)()).toBe(seededRandom(7)());
  });

  test('wind pushes the car downwind, capped', () => {
    // A west wind (from 270°) blows towards the east: right on the track.
    const west = windPush(10, 270);
    expect(west.x).toBeGreaterThan(0);
    expect(Math.abs(west.y)).toBeLessThan(1e-9);
    // From the north: down the track.
    expect(windPush(10, 0).y).toBeGreaterThan(0);
    expect(Math.hypot(windPush(60, 90).x, windPush(60, 90).y)).toBeCloseTo(0.045);
    const world = openTrack('dry', west);
    run(world, 30);
    expect(world.x).toBeGreaterThan(WIDTH / 2);
  });
});

test.describe('drift road from the weather', () => {
  const weather = (current: Partial<Forecast['current']>, wetHours = false): Forecast => {
    const forecast = forecastFixture() as unknown as Forecast;
    forecast.current = { ...forecast.current, precipitation: 0, snow_depth: 0, ...current };
    forecast.hourly.precipitation = forecast.hourly.precipitation.map(() => (wetHours ? 0.5 : 0));
    return forecast;
  };

  test('dry, rain, snow, ice, freezing rain, no weather', () => {
    expect(roadFor(weather({ weather_code: 1, temperature_2m: 12 })).surface).toBe('dry');
    expect(roadFor(weather({ weather_code: 61, temperature_2m: 6 })).surface).toBe('rain');
    expect(roadFor(weather({ weather_code: 73, temperature_2m: -2 })).surface).toBe('snow');
    expect(roadFor(weather({ weather_code: 3, temperature_2m: 1, snow_depth: 0.12 })).surface).toBe(
      'snow',
    );
    // Below zero after rain: black ice.
    expect(roadFor(weather({ weather_code: 3, temperature_2m: -6 }, true)).surface).toBe('ice');
    // Below zero but dry for hours: dry.
    expect(roadFor(weather({ weather_code: 0, temperature_2m: -6 })).surface).toBe('dry');
    expect(roadFor(weather({ weather_code: 66, temperature_2m: 1 })).surface).toBe('ice');
    expect(roadFor(undefined)).toEqual({
      surface: 'dry',
      windSpeed: 0,
      windFrom: 0,
      push: { x: 0, y: 0 },
    });
  });
});
