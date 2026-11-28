// What the drift game drives on, from the weather now at the place shown
// (the forecast already loaded: no request of its own).

import type { Forecast } from '../weather/api';
import { windPush, type Point, type Surface } from './physics';

export interface Road {
  surface: Surface;
  /** °C now; undefined without a forecast. */
  temperature?: number;
  /** m/s and the direction it blows from (degrees). */
  windSpeed: number;
  windFrom: number;
  push: Point;
}

const FREEZING_RAIN = [56, 57, 66, 67];
const SNOWFALL = [71, 73, 75, 77, 85, 86];
const FOG = [45, 48];
const RAIN = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
// "Recent moisture" for black ice: rain or snow within this many hours.
const RECENT_HOURS = 6;
// Snow on the ground from 1 cm (snow_depth is in metres).
const SNOW_ON_GROUND_M = 0.01;

/** The road for the weather now; dry and still without one. */
export function roadFor(forecast: Forecast | undefined): Road {
  const now = forecast?.current;
  if (!now) return { surface: 'dry', windSpeed: 0, windFrom: 0, push: { x: 0, y: 0 } };
  const windSpeed = now.wind_speed_10m ?? 0;
  const windFrom = now.wind_direction_10m ?? 0;
  return {
    surface: surfaceFor(forecast),
    temperature: now.temperature_2m,
    windSpeed,
    windFrom,
    push: windPush(windSpeed, windFrom),
  };
}

function surfaceFor(forecast: Forecast): Surface {
  const now = forecast.current;
  const code = now.weather_code;
  const freezing = now.temperature_2m <= 0;
  // Freezing rain glazes the road: glare ice, the slipperiest.
  if (FREEZING_RAIN.includes(code)) return 'glare';
  if (SNOWFALL.includes(code)) return 'snow';
  if (freezing && (FOG.includes(code) || wetLately(forecast))) return 'ice';
  if ((now.snow_depth ?? 0) >= SNOW_ON_GROUND_M) return 'snow';
  if (RAIN.includes(code) || (!freezing && now.precipitation > 0)) return 'rain';
  return 'dry';
}

/** Rain or snow now or in the last few hours (the hourly series, local time). */
function wetLately(forecast: Forecast): boolean {
  if (forecast.current.precipitation > 0) return true;
  const { time, precipitation } = forecast.hourly;
  const thisHour = `${forecast.current.time.slice(0, 13)}:00`;
  const index = time.indexOf(thisHour);
  if (index < 0) return false;
  for (let i = Math.max(0, index - RECENT_HOURS + 1); i <= index; i++) {
    if ((precipitation[i] ?? 0) > 0) return true;
  }
  return false;
}
