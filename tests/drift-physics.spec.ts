// The drift game's rules (src/drift/physics.ts), its daily course
// (course.ts) and its road from the weather (surface.ts), without a browser
// page: steps, speeds, walls, drifting and banking, gates and laps, cones
// and time, the wind, 60 Hz vs 120 Hz.

import { expect, test } from '@playwright/test';
import { courseDay, makeCourse, type Course } from '../src/drift/course';
import {
  GRIP,
  HEIGHT,
  RUN_STEPS,
  WIDTH,
  finish,
  newWorld,
  speedOf,
  step,
  stepsDue,
  windPush,
  type Steer,
  type World,
} from '../src/drift/physics';
import { roadFor } from '../src/drift/surface';
import type { Forecast } from '../src/weather/api';
import { forecastFixture } from './fixtures/forecast';

const still = { x: 0, y: 0 };

/** A course with one gate far away: an open track to test the car on. */
const OPEN: Course = {
  gates: [{ a: { x: 20, y: 20 }, b: { x: 60, y: 20 } }],
  pylons: [],
  start: { x: WIDTH / 2, y: HEIGHT - 60, heading: -Math.PI / 2 },
  puddles: [],
  eight: false,
};

function openTrack(surface: World['surface'] = 'dry', wind = still): World {
  const world = newWorld(surface, wind, OPEN);
  world.cones = [];
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
    expect(stepsDue(0, 2000).steps).toBe(5);
  });

  test('no turning at a standstill; top speed 3.5; steering builds up', () => {
    const world = openTrack();
    const heading = world.heading;
    step(world, 1);
    expect(world.heading).toBe(heading);
    expect(world.steer).toBeCloseTo(1 / 8);
    const top = openTrack();
    run(top, 120);
    expect(speedOf(top)).toBeLessThanOrEqual(3.5 + 1e-9);
    expect(speedOf(top)).toBeGreaterThan(2.5);
  });

  test('a wall bounces the car back and costs 2 s, once while scraping', () => {
    const world = openTrack();
    world.y = 10;
    world.vy = -3;
    step(world, 0);
    expect(world.y).toBeGreaterThanOrEqual(10);
    expect(world.vy).toBeGreaterThan(0);
    expect(world.endAt).toBe(RUN_STEPS - 120);
    expect(world.events).toContainEqual({ type: 'wall' });
    const circling = openTrack('ice');
    run(circling, RUN_STEPS, 1);
    expect(circling.x).toBeGreaterThanOrEqual(0);
    expect(circling.x).toBeLessThanOrEqual(WIDTH);
    expect(circling.y).toBeGreaterThanOrEqual(0);
    expect(circling.y).toBeLessThanOrEqual(HEIGHT);
  });

  test('drift points are banked when a drift ends cleanly; ice slides more', () => {
    const scoreOn = (surface: World['surface']) => {
      const world = openTrack(surface);
      run(world, 60);
      for (let i = 0; i < 6; i++) run(world, 40, i % 2 ? 1 : -1);
      run(world, 30);
      finish(world);
      return world;
    };
    const ice = scoreOn('ice');
    const dry = scoreOn('dry');
    expect(ice.score).toBeGreaterThan(0);
    // Ice slides more: longer skid marks.
    expect(ice.skids.filter(Boolean).length).toBeGreaterThan(dry.skids.filter(Boolean).length);
    expect(ice.events.some((e) => e.type === 'banked')).toBe(true);
    expect(ice.pending).toBe(0);
    expect(GRIP.ice / GRIP.dry).toBeCloseTo(0.1);
    expect(GRIP.glare / GRIP.dry).toBeCloseTo(0.04);
  });

  test('a long clean drift buys a second; a hit mid-drift wipes its points', () => {
    const world = openTrack('ice');
    world.pending = 400;
    world.driftSteps = 130;
    world.calmSteps = 19;
    world.vx = 0;
    world.vy = 0;
    const endAt = world.endAt;
    step(world, 0);
    expect(world.score).toBe(400);
    expect(world.endAt).toBe(endAt + 60);
    expect(world.events).toContainEqual({ type: 'banked', points: 400, long: true });

    const crashing = openTrack('ice');
    crashing.pending = 250;
    crashing.cones = [{ x: crashing.x, y: crashing.y - 4, hitAt: -Infinity }];
    step(crashing, 0);
    expect(crashing.pending).toBe(0);
    expect(crashing.score).toBe(0);
    expect(crashing.events).toContainEqual({ type: 'wiped', points: 250 });
  });

  test('a cone costs 50 points and 2 s, lies down, counts once', () => {
    const world = openTrack();
    world.cones = [{ x: world.x, y: world.y - 4, hitAt: -Infinity }];
    world.score = 60;
    world.combo = 4;
    step(world, 0);
    step(world, 0);
    expect(world.score).toBe(10);
    expect(world.combo).toBe(1);
    expect(world.endAt).toBe(RUN_STEPS - 120);
    expect(world.events.filter((e) => e.type === 'cone')).toHaveLength(1);
  });

  test('gates in order; a lap; a clean lap gives 300 and 2 s', () => {
    const course: Course = {
      gates: [
        { a: { x: 150, y: 300 }, b: { x: 230, y: 300 } },
        { a: { x: 150, y: 200 }, b: { x: 230, y: 200 } },
      ],
      pylons: [],
      start: { x: 190, y: 360, heading: -Math.PI / 2 },
      puddles: [],
      eight: false,
    };
    const world = newWorld('dry', still, course);
    world.cones = [];
    // Straight up through both gates.
    run(world, 120);
    expect(world.laps).toBe(1);
    expect(world.events.filter((e) => e.type === 'gate')).toHaveLength(2);
    expect(world.events).toContainEqual({ type: 'lap', clean: true, points: 300 });
    expect(world.endAt).toBe(RUN_STEPS + 120);
    expect(world.score).toBeGreaterThanOrEqual(150 * 2 + 300);
  });

  test('the course: the same all day, another tomorrow, on the track', () => {
    expect(courseDay(new Date('2026-11-28T23:59:00Z'))).toBe('2026-11-28');
    expect(makeCourse('2026-11-28')).toEqual(makeCourse('2026-11-28'));
    expect(makeCourse('2026-11-29')).not.toEqual(makeCourse('2026-11-28'));
    let eights = 0;
    for (let day = 1; day <= 60; day++) {
      const course = makeCourse(new Date(Date.UTC(2027, 0, day)).toISOString().slice(0, 10));
      if (course.eight) eights++;
      expect(course.gates.length).toBeGreaterThanOrEqual(4);
      expect(course.gates.length).toBeLessThanOrEqual(6);
      for (const gate of course.gates) {
        for (const p of [gate.a, gate.b]) {
          expect(p.x).toBeGreaterThanOrEqual(48);
          expect(p.x).toBeLessThanOrEqual(WIDTH - 48);
          expect(p.y).toBeGreaterThanOrEqual(48);
          expect(p.y).toBeLessThanOrEqual(HEIGHT - 48);
        }
      }
    }
    expect(eights).toBeGreaterThan(5);
    expect(newWorld('rain', still, makeCourse('2026-11-28')).puddles).toHaveLength(3);
    expect(newWorld('dry', still, makeCourse('2026-11-28')).puddles).toHaveLength(0);
  });

  test('wind pushes the car downwind, capped', () => {
    const west = windPush(10, 270);
    expect(west.x).toBeGreaterThan(0);
    expect(Math.abs(west.y)).toBeLessThan(1e-9);
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

  test('dry, rain, snow, ice, glare ice from freezing rain, no weather', () => {
    expect(roadFor(weather({ weather_code: 1, temperature_2m: 12 })).surface).toBe('dry');
    expect(roadFor(weather({ weather_code: 61, temperature_2m: 6 })).surface).toBe('rain');
    expect(roadFor(weather({ weather_code: 73, temperature_2m: -2 })).surface).toBe('snow');
    expect(roadFor(weather({ weather_code: 3, temperature_2m: 1, snow_depth: 0.12 })).surface).toBe(
      'snow',
    );
    expect(roadFor(weather({ weather_code: 3, temperature_2m: -6 }, true)).surface).toBe('ice');
    expect(roadFor(weather({ weather_code: 0, temperature_2m: -6 })).surface).toBe('dry');
    expect(roadFor(weather({ weather_code: 66, temperature_2m: 1 })).surface).toBe('glare');
    expect(roadFor(undefined).surface).toBe('dry');
  });
});
