// The air quality forecast as one line per day: each day's worst hour.
// Worst, not average, because that's what matters when planning a run or
// opening the windows.

import { indexSeries, type AirQuality, type AqiScale } from './air-quality';

export interface AqiDay {
  /** Local date, e.g. "2026-11-16". */
  date: string;
  /** Highest index value in the day's (remaining) hours. */
  worst: number;
  /** Local time of the first hour with that value, e.g. "2026-11-16T18:00". */
  worstTime: string;
}

// A day needs data for most of its hours; otherwise a half-covered last
// day (where the model's forecast ends) could look better than it is.
const MIN_COVERAGE = 0.75;

/**
 * Worst index per day, from the current hour on; today counts only the
 * hours still ahead.
 */
export function worstByDay(airQuality: AirQuality, scale: AqiScale): AqiDay[] {
  const hourly = airQuality.hourly;
  if (!hourly) return [];
  return worstPerDay(hourly.time, indexSeries(airQuality, scale), airQuality.current.time);
}

/**
 * Highest of `values` per day, from the hour of `currentTime` on. Times are
 * the place's own local time ("2026-11-16T18:00"), so they're grouped by
 * their date text, not through `Date`. Days the model barely covers are
 * left out.
 */
export function worstPerDay(
  times: string[] | undefined,
  values: (number | null)[] | undefined,
  currentTime: string,
): AqiDay[] {
  if (!Array.isArray(times) || !Array.isArray(values)) return [];

  // "2026-11-16T14" — compare whole hours, the current time may be 14:15.
  const currentHour = currentTime.slice(0, 13);

  const days = new Map<string, { hours: number; worst?: number; worstTime?: string }>();
  times.forEach((time, i) => {
    if (time.slice(0, 13) < currentHour) return;
    const date = time.slice(0, 10);
    const day = days.get(date) ?? { hours: 0 };
    days.set(date, day);
    const value = values[i];
    if (value == null) return;
    day.hours++;
    if (day.worst === undefined || value > day.worst) {
      day.worst = value;
      day.worstTime = time;
    }
  });

  const today = currentHour.slice(0, 10);
  const result: AqiDay[] = [];
  for (const [date, day] of days) {
    // Today has only the hours from now until midnight left.
    const expected = date === today ? 24 - Number(currentHour.slice(11, 13)) : 24;
    if (day.worst === undefined || day.hours < Math.ceil(expected * MIN_COVERAGE)) continue;
    result.push({ date, worst: day.worst, worstTime: day.worstTime! });
  }
  return result;
}
