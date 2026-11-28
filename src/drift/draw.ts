// Draws the drift game's world (physics.ts) on a canvas: the track, its
// tint for snow or ice, puddles, the gates (the next one glowing), skid
// marks, cones (knocked ones lying down), the car, falling rain or snow,
// the drift counter and pops (what just happened), and a red edge after a
// hit. Colours come from the app's CSS
// variables, so every skin, light or dark, has its own track.

import { CAR_RADIUS, HEIGHT, WIDTH, coneDown, type Cone, type Point, type World } from './physics';

export interface Colours {
  track: string;
  edge: string;
  car: string;
  glass: string;
  skid: string;
  gate: string;
  ink: string;
}

/** Words rising from the car for a moment ("Gate +150"). */
export interface Pop extends Point {
  text: string;
  kind: 'good' | 'great' | 'bad';
  age: number;
}
export const POP_STEPS = 60;

/** The app's colours as the page has them now. */
export function readColours(element: HTMLElement): Colours {
  const style = getComputedStyle(element);
  const value = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    track: value('--color-bg', '#eef2f6'),
    edge: value('--color-border', '#c8d1dc'),
    car: value('--color-accent', '#0b63ce'),
    glass: value('--color-surface', '#ffffff'),
    skid: value('--color-text', '#1b2633'),
    gate: '#16a34a',
    ink: value('--color-text', '#1b2633'),
  };
}

interface Flake extends Point {
  speed: number;
}

/** Falling rain or snow, drifting with the wind (fewer with reduced motion). */
export function makeWeatherParticles(world: World, count: number): Flake[] {
  if (world.surface !== 'rain' && world.surface !== 'snow') return [];
  return Array.from({ length: count }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    speed: world.surface === 'rain' ? 6 + Math.random() * 3 : 0.8 + Math.random() * 0.8,
  }));
}

const FLASH_STEPS = 12;

export function draw(
  context: CanvasRenderingContext2D,
  world: World,
  colours: Colours,
  particles: Flake[],
  flash: boolean,
  pops: Pop[] = [],
  counter = '',
): void {
  context.fillStyle = colours.track;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  if (world.surface === 'snow') tint(context, 'rgb(255 255 255 / 35%)');
  if (world.surface === 'ice') tint(context, 'rgb(120 180 255 / 22%)');
  if (world.surface === 'glare') tint(context, 'rgb(120 180 255 / 35%)');

  context.fillStyle = 'rgb(60 120 210 / 35%)';
  for (const puddle of world.puddles) {
    context.beginPath();
    context.ellipse(puddle.x, puddle.y, 30, 22, 0, 0, Math.PI * 2);
    context.fill();
  }

  drawGates(context, world, colours, flash);
  drawSkids(context, world, colours);
  for (const cone of world.cones) drawCone(context, cone, coneDown(world, cone));
  drawCar(context, world, colours);
  drawParticles(context, world, particles);
  drawWords(context, world, colours, pops, counter, flash);

  context.lineWidth = 4;
  context.strokeStyle = colours.edge;
  context.strokeRect(2, 2, WIDTH - 4, HEIGHT - 4);
  if (flash && world.sinceHit < FLASH_STEPS) {
    context.lineWidth = 8;
    context.strokeStyle = `rgb(220 40 40 / ${Math.round(80 * (1 - world.sinceHit / FLASH_STEPS))}%)`;
    context.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);
  }
}

function tint(context: CanvasRenderingContext2D, colour: string) {
  context.fillStyle = colour;
  context.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawSkids(context: CanvasRenderingContext2D, world: World, colours: Colours) {
  context.save();
  context.globalAlpha = 0.28;
  context.strokeStyle = colours.skid;
  context.lineWidth = 3;
  context.lineCap = 'round';
  context.beginPath();
  let drawing = false;
  for (const point of world.skids) {
    if (!point) {
      drawing = false;
      continue;
    }
    if (drawing) context.lineTo(point.x, point.y);
    else context.moveTo(point.x, point.y);
    drawing = true;
  }
  context.stroke();
  context.restore();
}

function drawGates(
  context: CanvasRenderingContext2D,
  world: World,
  colours: Colours,
  motion: boolean,
) {
  world.course.gates.forEach((gate, i) => {
    const next = i === world.gate;
    context.save();
    context.strokeStyle = colours.gate;
    context.lineWidth = next ? 4 : 2;
    context.globalAlpha = next ? 0.9 : 0.25;
    context.setLineDash(next ? [] : [6, 6]);
    context.beginPath();
    context.moveTo(gate.a.x, gate.a.y);
    context.lineTo(gate.b.x, gate.b.y);
    context.stroke();
    if (next && motion) {
      context.globalAlpha = 0.25 + 0.2 * Math.sin(performance.now() / 150);
      context.lineWidth = 12;
      context.stroke();
    }
    context.restore();
  });
}

function drawWords(
  context: CanvasRenderingContext2D,
  world: World,
  colours: Colours,
  pops: Pop[],
  counter: string,
  motion: boolean,
) {
  context.save();
  context.textAlign = 'center';
  context.font = '700 17px system-ui, sans-serif';
  context.lineWidth = 4;
  context.strokeStyle = colours.glass;
  if (counter) {
    context.strokeText(counter, world.x, world.y - 26);
    context.fillStyle = '#d97706';
    context.fillText(counter, world.x, world.y - 26);
  }
  for (const pop of pops) {
    const k = pop.age / POP_STEPS;
    const y = pop.y - (motion ? k * 24 : 0);
    context.globalAlpha = 1 - k;
    context.strokeText(pop.text, pop.x, y);
    context.fillStyle =
      pop.kind === 'bad' ? '#dc2626' : pop.kind === 'great' ? colours.gate : colours.ink;
    context.fillText(pop.text, pop.x, y);
  }
  context.restore();
}

function drawCone(context: CanvasRenderingContext2D, cone: Cone, down: boolean) {
  if (down) {
    context.save();
    context.globalAlpha = 0.55;
    context.translate(cone.x, cone.y);
    context.rotate(Math.PI / 2);
    context.translate(-cone.x, -cone.y);
  }
  context.fillStyle = '#f28c28';
  context.beginPath();
  context.moveTo(cone.x, cone.y - 9);
  context.lineTo(cone.x + 7, cone.y + 7);
  context.lineTo(cone.x - 7, cone.y + 7);
  context.closePath();
  context.fill();
  context.fillStyle = '#ffffff';
  context.fillRect(cone.x - 3.5, cone.y - 1, 7, 2.5);
  if (down) context.restore();
}

function drawCar(context: CanvasRenderingContext2D, world: World, colours: Colours) {
  const length = CAR_RADIUS * 2.4;
  const width = CAR_RADIUS * 1.3;
  context.save();
  context.translate(world.x, world.y);
  context.rotate(world.heading);
  context.fillStyle = colours.car;
  context.fillRect(-length / 2, -width / 2, length, width);
  // Windscreen towards the front, headlights at it.
  context.fillStyle = colours.glass;
  context.fillRect(length * 0.08, -width / 2 + 2, length * 0.18, width - 4);
  context.fillStyle = '#ffe680';
  context.fillRect(length / 2 - 2, -width / 2 + 1, 2, 3);
  context.fillRect(length / 2 - 2, width / 2 - 4, 2, 3);
  context.restore();
}

function drawParticles(context: CanvasRenderingContext2D, world: World, particles: Flake[]) {
  if (particles.length === 0) return;
  const rain = world.surface === 'rain';
  context.save();
  context.strokeStyle = 'rgb(80 120 190 / 55%)';
  context.fillStyle = 'rgb(255 255 255 / 90%)';
  context.lineWidth = 1;
  // The wind blows the weather across too (much more than the car).
  const sideways = world.wind.x * 60;
  const down = world.wind.y * 60;
  for (const flake of particles) {
    flake.y += flake.speed + down;
    flake.x += sideways;
    if (flake.y > HEIGHT) flake.y -= HEIGHT;
    if (flake.y < 0) flake.y += HEIGHT;
    if (flake.x > WIDTH) flake.x -= WIDTH;
    if (flake.x < 0) flake.x += WIDTH;
    if (rain) {
      context.beginPath();
      context.moveTo(flake.x, flake.y);
      context.lineTo(flake.x - sideways * 0.5, flake.y - flake.speed * 1.5);
      context.stroke();
    } else {
      context.beginPath();
      context.arc(flake.x, flake.y, 1.6, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
}
