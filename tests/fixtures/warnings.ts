// Made-up warnings (real shapes, trimmed) from the three services. Each has
// something that must be filtered out. The tests' clock is 2026-11-15
// 13:05 UTC; every warning ends 2026-11-16 20:00 UTC.

const ENDS = '2026-11-16T20:00:00+00:00';

/** MET Norway MetAlerts: a land wind warning, and a marine one (dropped). */
export function metnoWarningsFixture() {
  const alert = (domain: string, name: string, colour: string) => ({
    type: 'Feature',
    properties: {
      eventAwarenessName: name,
      riskMatrixColor: colour,
      geographicDomain: domain,
      status: 'Actual',
      description: 'Strong winds from the south-west, gusts up to 25 m/s.',
      consequences: 'Danger of falling trees.',
      instruction: 'Secure loose objects outdoors.',
      eventEndingTime: ENDS,
    },
    when: { interval: ['2026-11-15T12:00:00+00:00', ENDS] },
  });
  return {
    type: 'FeatureCollection',
    lang: 'en',
    features: [alert('land', 'Wind', 'Yellow'), alert('marine', 'Gale', 'Orange')],
  };
}

/**
 * ECCC weather-alerts: a snowfall warning listed for two areas (shown once)
 * and an ended statement (dropped).
 */
export function ecccWarningsFixture() {
  const snowfall = (area: string) => ({
    type: 'Feature',
    properties: {
      alert_name_en: 'snowfall warning',
      alert_type: 'warning',
      risk_colour_en: 'yellow',
      status_en: 'issued',
      feature_name_en: area,
      alert_text_en:
        'Snowfall with total amounts of 15 to 25 cm is expected.\n\nTravel may be hazardous.',
      event_end_datetime: '2026-11-16T20:00:00.000Z',
      expiration_datetime: '2026-11-16T02:00:00.000Z',
    },
  });
  return {
    type: 'FeatureCollection',
    numberMatched: 3,
    features: [
      snowfall('City of Toronto'),
      snowfall('Toronto - Etobicoke'),
      {
        type: 'Feature',
        properties: {
          alert_name_en: 'special weather statement',
          alert_type: 'statement',
          risk_colour_en: null,
          status_en: 'ended',
          alert_text_en: 'Old news.',
          event_end_datetime: '2026-11-15T06:00:00.000Z',
          expiration_datetime: '2026-11-16T00:00:00.000Z',
        },
      },
    ],
  };
}

/** NWS alerts: a winter storm warning, and a test message (dropped). */
export function nwsWarningsFixture() {
  const alert = (status: string) => ({
    type: 'Feature',
    properties: {
      event: 'Winter Storm Warning',
      severity: 'Severe',
      status,
      messageType: 'Alert',
      description: 'Heavy snow expected. Total snow accumulations of 8 to 14 inches.',
      instruction: 'If you must travel, keep an extra flashlight, food and water in your vehicle.',
      expires: '2026-11-16T12:00:00-05:00',
      ends: '2026-11-16T15:00:00-05:00',
      areaDesc: 'Northern Erie; Southern Erie; Genesee; Wyoming; Chautauqua',
      geocode: { UGC: ['NYZ010', 'NYZ085', 'NYZ011', 'NYZ013', 'NYZ019'] },
    },
  });
  // A point on the water: a marine zone's alert (issue #55).
  const gale = {
    type: 'Feature',
    properties: {
      event: 'Gale Warning',
      severity: 'Moderate',
      status: 'Actual',
      messageType: 'Alert',
      description: 'West winds 25 to 35 kt with gusts up to 45 kt.',
      ends: '2026-11-16T15:00:00-05:00',
      areaDesc: 'San Francisco Bay South of the Bay Bridge',
      geocode: { UGC: ['PZZ531'] },
    },
  };
  return { type: 'FeatureCollection', features: [alert('Actual'), alert('Test'), gale] };
}

export const NO_WARNINGS = { type: 'FeatureCollection', features: [] };

/**
 * SMHI (Sweden): the whole country's list, areas as GeoJSON. A wind warning
 * whose area covers the whole map (so any tapped point), a flood warning far
 * away (left out), a sea wind warning (boats: left out) and a river warning
 * drawn as a line (no point is on it).
 */
export function smhiWarningsFixture() {
  const square = (west: number, south: number, east: number, north: number) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ],
      ],
    },
  });
  const warning = (code: string, name: string, level: string, area: object) => ({
    event: { en: name, sv: name, code },
    warningAreas: [
      {
        warningLevel: { en: level, code: level.toUpperCase() },
        approximateEnd: ENDS,
        descriptions: [
          { title: { en: 'Description of incident' }, text: { en: 'Gusts up to 25 m/s.' } },
          { title: { en: 'What to expect' }, text: { en: 'Fallen trees and power cuts.' } },
        ],
        area,
      },
    ],
  });
  return [
    warning('WIND', 'Wind', 'Yellow', square(-180, -85, 180, 85)),
    warning('FLOODING', 'Flooding', 'Orange', square(170, -50, 175, -45)),
    warning('WIND_SEA', 'Wind at sea', 'Orange', square(-180, -85, 180, 85)),
    warning('HIGH_FLOW', 'High flow', 'Yellow', {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-180, 0],
              [180, 0],
            ],
          },
        },
      ],
    }),
  ];
}
