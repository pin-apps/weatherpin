// The temperature quiz's rules, apart from its screens (quiz.ts): which 5
// places a day's quiz has, the points and coloured box for a guess, and the
// little that's kept on the device (today's result, the streak, the best).
//
// The daily quiz is the same for everyone in the world on the same UTC day:
// its places come from a random sequence seeded with the date, so no server
// is needed. It asks for the day's high (the same answer for everyone that
// day, give or take a forecast update); free play asks for the temperature
// right now.

import { readStored, writeStored } from '../storage';

export const ROUNDS = 5;
export const MAX_POINTS = ROUNDS * 100;

/** Quiz #1 was the daily of this UTC day. */
const FIRST_DAY_MS = Date.UTC(2026, 10, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

/** The UTC date, e.g. "2026-11-24": the daily quiz changes at UTC midnight. */
export function quizDay(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** The daily quiz's number, for sharing ("#24"). */
export function quizNumber(day: string): number {
  return Math.floor((Date.parse(`${day}T00:00:00Z`) - FIRST_DAY_MS) / DAY_MS) + 1;
}

/** Milliseconds until the next daily quiz (next UTC midnight). */
export function untilNextQuiz(now = Date.now()): number {
  return DAY_MS - (now % DAY_MS);
}

/** A repeatable random sequence (mulberry32) from a text seed (FNV-1a). */
export function seededRandom(seed: string): () => number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Box = '🟩' | '🟨' | '🟥';

export interface Scored {
  points: number;
  box: Box;
  /** How far off, in whole degrees of the unit played in. */
  off: number;
}

/**
 * A guess against the answer, both in whole degrees of the unit shown.
 * 100 points for spot on, 10 fewer per °C off (5.5 per °F); green within
 * 2 °C (4 °F), yellow within 5 °C (9 °F).
 */
export function score(guess: number, answer: number, fahrenheit: boolean): Scored {
  const off = Math.abs(Math.round(guess) - Math.round(answer));
  const perDegree = fahrenheit ? 100 / 18 : 10;
  const points = Math.max(0, Math.round(100 - off * perDegree));
  const [green, yellow] = fahrenheit ? [4, 9] : [2, 5];
  const box: Box = off <= green ? '🟩' : off <= yellow ? '🟨' : '🟥';
  return { points, box, off };
}

// Stored as nordic-weather:quiz = { version, day, score, boxes, lastDay,
// streak, best }: today's daily result only, no history.
const STORAGE_KEY = 'quiz';
const VERSION = 1;

export interface QuizRecord {
  /** The UTC day of the daily result below. */
  day?: string;
  score?: number;
  boxes?: string;
  /** The last UTC day a daily was finished, for the streak. */
  lastDay?: string;
  streak: number;
  best: number;
}

export function loadRecord(): QuizRecord {
  const stored = readStored(STORAGE_KEY) as
    (Partial<QuizRecord> & { version?: number }) | undefined;
  if (stored?.version !== VERSION) return { streak: 0, best: 0 };
  const number = (value: unknown) => (typeof value === 'number' && value >= 0 ? value : 0);
  const text = (value: unknown) => (typeof value === 'string' ? value : undefined);
  return {
    day: text(stored.day),
    score: typeof stored.score === 'number' ? stored.score : undefined,
    boxes: text(stored.boxes),
    lastDay: text(stored.lastDay),
    streak: number(stored.streak),
    best: number(stored.best),
  };
}

/** Today's daily result, if it was played today. */
export function todaysResult(day = quizDay()): QuizRecord | undefined {
  const record = loadRecord();
  return record.day === day && record.score != null ? record : undefined;
}

/** Keeps a finished daily: today's result, the streak and the best. */
export function saveDaily(day: string, total: number, boxes: string): QuizRecord {
  const before = loadRecord();
  const yesterday = quizDay(Date.parse(`${day}T00:00:00Z`) - DAY_MS);
  const streak =
    before.lastDay === day ? before.streak : before.lastDay === yesterday ? before.streak + 1 : 1;
  const record: QuizRecord = {
    day,
    score: total,
    boxes,
    lastDay: day,
    streak,
    best: Math.max(before.best, total),
  };
  writeStored(STORAGE_KEY, { version: VERSION, ...record });
  return record;
}
