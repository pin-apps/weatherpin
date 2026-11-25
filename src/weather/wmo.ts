import { msg, t } from '../i18n';
// WMO weather interpretation codes, as listed in the Open-Meteo docs.

export interface WeatherCondition {
  description: string;
  icon: string;
}

interface ConditionEntry {
  description: string;
  dayIcon: string;
  /** Only set where night looks different (no sun in the sky). */
  nightIcon?: string;
}

const CONDITIONS: Record<number, ConditionEntry> = {
  0: { description: msg('Clear sky'), dayIcon: '☀️', nightIcon: '🌙' },
  1: { description: msg('Mainly clear'), dayIcon: '🌤️', nightIcon: '🌙' },
  2: { description: msg('Partly cloudy'), dayIcon: '⛅', nightIcon: '☁️' },
  3: { description: msg('Overcast'), dayIcon: '☁️' },
  45: { description: msg('Fog'), dayIcon: '🌫️' },
  48: { description: msg('Depositing rime fog'), dayIcon: '🌫️' },
  51: { description: msg('Light drizzle'), dayIcon: '🌦️', nightIcon: '🌧️' },
  53: { description: msg('Moderate drizzle'), dayIcon: '🌦️', nightIcon: '🌧️' },
  55: { description: msg('Dense drizzle'), dayIcon: '🌧️' },
  56: { description: msg('Light freezing drizzle'), dayIcon: '🌧️' },
  57: { description: msg('Dense freezing drizzle'), dayIcon: '🌧️' },
  61: { description: msg('Slight rain'), dayIcon: '🌦️', nightIcon: '🌧️' },
  63: { description: msg('Moderate rain'), dayIcon: '🌧️' },
  65: { description: msg('Heavy rain'), dayIcon: '🌧️' },
  66: { description: msg('Light freezing rain'), dayIcon: '🌧️' },
  67: { description: msg('Heavy freezing rain'), dayIcon: '🌧️' },
  71: { description: msg('Slight snowfall'), dayIcon: '🌨️' },
  73: { description: msg('Moderate snowfall'), dayIcon: '🌨️' },
  75: { description: msg('Heavy snowfall'), dayIcon: '❄️' },
  77: { description: msg('Snow grains'), dayIcon: '🌨️' },
  80: { description: msg('Slight rain showers'), dayIcon: '🌦️', nightIcon: '🌧️' },
  81: { description: msg('Moderate rain showers'), dayIcon: '🌧️' },
  82: { description: msg('Violent rain showers'), dayIcon: '🌧️' },
  85: { description: msg('Slight snow showers'), dayIcon: '🌨️' },
  86: { description: msg('Heavy snow showers'), dayIcon: '🌨️' },
  95: { description: msg('Thunderstorm'), dayIcon: '⛈️' },
  96: { description: msg('Thunderstorm with slight hail'), dayIcon: '⛈️' },
  97: { description: msg('Heavy thunderstorm'), dayIcon: '⛈️' },
  99: { description: msg('Thunderstorm with heavy hail'), dayIcon: '⛈️' },
};

export function describeWeather(code: number, isDay = true): WeatherCondition {
  const entry = CONDITIONS[code];
  if (!entry) {
    return { description: msg('Unknown conditions'), icon: '❔' };
  }
  const icon = !isDay && entry.nightIcon ? entry.nightIcon : entry.dayIcon;
  return { description: t(entry.description), icon };
}
