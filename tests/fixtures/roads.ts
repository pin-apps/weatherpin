// Fintraffic's Digitraffic road weather (src/roads/digitraffic.ts): two
// main road sections, by Helsinki and by Rovaniemi, and their forecasts.

export type RoadsKind = 'normal' | 'poor' | 'very-poor';

export function roadSectionsFixture() {
  return {
    type: 'FeatureCollection',
    dataUpdatedTime: '2026-11-15T12:50:00Z',
    features: [
      {
        type: 'Feature',
        id: '00001_001_000_0',
        geometry: {
          type: 'LineString',
          coordinates: [
            [24.944, 60.167, 0],
            [24.862, 60.203, 0],
            [24.646, 60.22, 0],
          ],
        },
        properties: { id: '00001_001_000_0', description: 'Vt 1: Helsinki - Kehä III' },
      },
      {
        type: 'Feature',
        id: '00004_420_000_0',
        geometry: {
          type: 'LineString',
          coordinates: [
            [25.72, 66.5, 0],
            [25.8, 66.6, 0],
          ],
        },
        properties: { id: '00004_420_000_0', description: 'Vt 4: Rovaniemi - Sodankylä' },
      },
    ],
  };
}

const LEVEL = {
  normal: 'NORMAL_CONDITION',
  poor: 'POOR_CONDITION',
  'very-poor': 'EXTREMELY_POOR_CONDITION',
};

/** Helsinki's section: `kind` in 4 hours (normal before); Rovaniemi normal. */
export function roadForecastsFixture(kind: RoadsKind = 'normal') {
  const forecast = (name: string, hours: number, condition: string, reason?: object) => ({
    time: new Date(Date.parse('2026-11-15T13:00:00Z') + hours * 3_600_000).toISOString(),
    type: hours === 0 ? 'OBSERVATION' : 'FORECAST',
    forecastName: name,
    overallRoadCondition: condition,
    ...(reason ? { forecastConditionReason: reason } : {}),
  });
  return {
    dataUpdatedTime: '2026-11-15T12:50:00Z',
    forecastSections: [
      {
        id: '00001_001_000_0',
        forecasts: [
          forecast('0h', 0, 'NORMAL_CONDITION', { roadCondition: 'WET' }),
          forecast('2h', 2, 'NORMAL_CONDITION', { roadCondition: 'WET' }),
          forecast('4h', 4, LEVEL[kind], {
            roadCondition: kind === 'normal' ? 'WET' : 'PARTLY_ICY',
          }),
          forecast('6h', 6, 'NORMAL_CONDITION'),
          forecast('12h', 12, 'NORMAL_CONDITION'),
        ],
      },
      {
        id: '00004_420_000_0',
        forecasts: [forecast('0h', 0, 'NORMAL_CONDITION', { roadCondition: 'DRY' })],
      },
    ],
  };
}
