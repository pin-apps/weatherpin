// Weather records: a point tapped (or found) near a famous record place
// gets one line about it above the real weather, e.g. at Vostok Station
// "The coldest temperature ever measured on Earth: −89 °C (1983)". The
// facts are built in (no request); values follow the units setting.
// Sources: WMO's World Weather & Climate Extremes Archive, and the
// national weather services for the Nordic records.

import { el, iconEl } from './dom';
import { formatPrecipitation, formatTemperature, formatWindSpeed } from './format';
import type { PickedPoint } from './map';
import { msg, t } from './i18n';

interface WeatherRecord {
  lat: number;
  lng: number;
  /** How near the point must be, in km. */
  radiusKm: number;
  /** A `msg()` text with {value}. */
  text: string;
  /** Formats the record's value in the units shown. */
  value: () => string;
}

const NEAR_KM = 30;

const RECORDS: WeatherRecord[] = [
  {
    lat: -78.46,
    lng: 106.84,
    radiusKm: NEAR_KM,
    text: msg('Vostok: coldest ever measured on Earth, {value} (1983)'),
    value: () => formatTemperature(-89.2),
  },
  {
    lat: 36.46,
    lng: -116.87,
    radiusKm: NEAR_KM,
    text: msg('Death Valley: hottest ever measured on Earth, {value} (1913)'),
    value: () => formatTemperature(56.7),
  },
  {
    lat: 72.3,
    lng: -40.48,
    radiusKm: NEAR_KM,
    text: msg('Greenland: coldest in the Northern Hemisphere, {value} (1991)'),
    value: () => formatTemperature(-69.6),
  },
  {
    lat: 63.46,
    lng: 142.79,
    radiusKm: NEAR_KM,
    text: msg('Oymyakon: one of the coldest villages, {value} (1933)'),
    value: () => formatTemperature(-67.7),
  },
  {
    lat: -20.8,
    lng: 115.4,
    radiusKm: NEAR_KM,
    text: msg('Barrow Island: strongest gust ever measured, {value} (1996)'),
    value: () => formatWindSpeed(113.2),
  },
  {
    lat: 25.3,
    lng: 91.58,
    radiusKm: NEAR_KM,
    text: msg('Mawsynram: wettest place on Earth, about {value} a year'),
    value: () => formatPrecipitation(11870),
  },
  {
    lat: -24.5,
    lng: -69.5,
    radiusKm: 250,
    text: msg('Atacama Desert: some stations here have never had rain'),
    value: () => '',
  },
  {
    lat: 68.17,
    lng: 25.78,
    radiusKm: NEAR_KM,
    text: msg('Pokka: coldest in Finland, {value} (1999)'),
    value: () => formatTemperature(-51.5),
  },
  {
    lat: 62.66,
    lng: 29.61,
    radiusKm: NEAR_KM,
    text: msg('Liperi: hottest in Finland, {value} (2010)'),
    value: () => formatTemperature(37.2),
  },
  {
    lat: 66.57,
    lng: 16.37,
    radiusKm: NEAR_KM,
    text: msg('Vuoggatjålme: coldest in Sweden, {value} (1966)'),
    value: () => formatTemperature(-52.6),
  },
  {
    lat: 69.47,
    lng: 25.51,
    radiusKm: NEAR_KM,
    text: msg('Karasjok: coldest in Norway, {value} (1886)'),
    value: () => formatTemperature(-51.4),
  },
];

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km. */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function recordNear(point: PickedPoint): WeatherRecord | undefined {
  return RECORDS.find(
    (record) => distanceKm(point.lat, point.lng, record.lat, record.lng) <= record.radiusKm,
  );
}

/** The record box for a point near a record place, else nothing. */
export function renderRecord(point: PickedPoint): HTMLElement[] {
  const record = recordNear(point);
  if (!record) return [];
  const heading = el('h3', 'section-title', t('Weather record'));
  heading.id = 'record-title';
  heading.append(' ', iconEl('🏆', 'record__icon'));
  const section = el('section', 'forecast-section record');
  section.setAttribute('aria-labelledby', 'record-title');
  section.append(heading, el('p', 'record__text', t(record.text, { value: record.value() })));
  return [section];
}
