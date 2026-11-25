// UV index levels (WHO scale) and today's peak. UV has no unit, so the
// °C/°F switch doesn't touch it.

import type { Forecast } from './api';
import { msg } from '../i18n';

export interface UvLevel {
  /** The index rounded to a whole number, as UV is usually quoted. */
  value: number;
  /** 1 (low) to 5 (extreme); used for the badge colour. */
  level: number;
  label: string;
}

// Upper bound of each WHO band (on the rounded value), lowest first.
const BANDS: [number, string][] = [
  [2, msg('Low')],
  [5, msg('Moderate')],
  [7, msg('High')],
  [10, msg('Very high')],
  [Infinity, msg('Extreme')],
];

/** From UV 3 on, the WHO advises sun protection. */
export const UV_PROTECTION_FROM = 3;

export function uvLevel(uvIndex: number): UvLevel {
  // `|| 0` turns -0 into 0.
  const value = Math.max(0, Math.round(uvIndex)) || 0;
  const index = BANDS.findIndex(([upTo]) => value <= upTo);
  return { value, level: index + 1, label: BANDS[index][1] };
}

export interface UvPeak {
  uvIndex: number;
  /** Local time of the first hour with the peak, e.g. "2026-11-15T12:00". */
  time: string;
}

/**
 * Today's highest hourly UV and when it is, in the place's local time
 * (grouped by the date text, not through `Date`). Undefined without data.
 */
export function todaysUvPeak(forecast: Forecast): UvPeak | undefined {
  const values = forecast.hourly.uv_index;
  if (!Array.isArray(values)) return undefined;
  const today = forecast.current.time.slice(0, 10);
  let peak: UvPeak | undefined;
  forecast.hourly.time.forEach((time, i) => {
    const value = values[i];
    if (!time.startsWith(today) || value == null) return;
    if (!peak || value > peak.uvIndex) peak = { uvIndex: value, time };
  });
  return peak;
}

export interface ProtectionWindow {
  /** Local time of the first hour with UV 3 or more, e.g. "…T11:00". */
  from: string;
  /** Local time of the last such hour. */
  to: string;
}

/**
 * Today's hours that need sun protection (WHO: UV 3 or more, rounded as
 * shown), first to last, in the place's local time. Undefined on days that
 * stay below 3, or without hourly UV.
 */
export function sunProtectionWindow(forecast: Forecast): ProtectionWindow | undefined {
  const values = forecast.hourly.uv_index;
  if (!Array.isArray(values)) return undefined;
  const today = forecast.current.time.slice(0, 10);
  let protection: ProtectionWindow | undefined;
  forecast.hourly.time.forEach((time, i) => {
    const value = values[i];
    if (!time.startsWith(today) || value == null) return;
    if (uvLevel(value).value < UV_PROTECTION_FROM) return;
    protection = { from: protection?.from ?? time, to: time };
  });
  return protection;
}
