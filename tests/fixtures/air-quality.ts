// Made-up Open-Meteo Air Quality API responses (real shape), for places in
// Europe, the US, Canada and the UK, so tests don't depend on live data.

export type AirQualityKind = 'europe' | 'north-america' | 'canada' | 'uk';

const NO_POLLEN = {
  alder_pollen: null,
  birch_pollen: null,
  grass_pollen: null,
  mugwort_pollen: null,
  olive_pollen: null,
  ragweed_pollen: null,
};

/**
 * The other values now (sulphur dioxide, carbon monoxide and dust in µg/m³,
 * CO₂ in ppm, methane in µg/m³ ≈ 2.3 ppm), like Helsinki on 2026-11-22.
 */
const OTHER_NOW = {
  sulphur_dioxide: 1.2,
  carbon_monoxide: 187,
  dust: 0,
  carbon_dioxide: 456,
  methane: 1520,
};

const DATES = ['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'];
const HOURS = DATES.flatMap((date) =>
  Array.from({ length: 24 }, (_, h) => `${date}T${String(h).padStart(2, '0')}:00`),
);

/**
 * Hourly index values: `base` everywhere, then the given hours set to other
 * values (null = no data). Keys are local times like "2026-11-15T18:00".
 */
function hourlyValues(base: number, overrides: Record<string, number | null>) {
  return HOURS.map((time) => (time in overrides ? overrides[time] : base));
}

/** Every hour of a day set to null: no forecast that far. */
function noDataOn(date: string): Record<string, null> {
  return Object.fromEntries(
    HOURS.filter((time) => time.startsWith(date)).map((time) => [time, null]),
  );
}

// With yesterday too (past_days=1): the UK's and Canada's indices average
// over hours before now.
const HOURS_FROM_YESTERDAY = [
  ...Array.from({ length: 24 }, (_, h) => `2026-11-14T${String(h).padStart(2, '0')}:00`),
  ...HOURS,
];

/**
 * Pollutant values (µg/m³) per hour: `base` everywhere, then each block of
 * hours set to other values. Keys are the first hour; `hours` long.
 */
function pollutant(base: number, blocks: [start: string, hours: number, value: number][]) {
  const values = HOURS_FROM_YESTERDAY.map(() => base);
  for (const [start, hours, value] of blocks) {
    const from = HOURS_FROM_YESTERDAY.indexOf(start);
    for (let i = from; i < from + hours; i++) values[i] = value;
  }
  return values;
}

/** Pollen outside Europe: every hour null. */
function noPollenHourly(hours = HOURS) {
  return Object.fromEntries(Object.keys(NO_POLLEN).map((type) => [type, hours.map(() => null)]));
}

export function airQualityFixture(kind: AirQualityKind = 'europe') {
  if (kind === 'canada') {
    // Canada's AQHI, from 3-hour averages (national-aqi.ts). Clean air
    // (ozone 45, NO₂ 18.9, PM2.5 5.7) is 2. Three-hour spells give each
    // day's worst: today 5 at 18:00, Mon 11 ("10+"), Tue 7, then 2, 2.
    const spell = (o: number, n: number, p: number, start: string) => ({ o, n, p, start });
    const spells = [
      spell(80, 40, 30, '2026-11-15T16:00'),
      spell(60, 40, 150, '2026-11-16T09:00'),
      spell(120, 60, 20, '2026-11-17T12:00'),
    ];
    return {
      timezone: 'America/Toronto',
      current: {
        time: '2026-11-15T08:00',
        interval: 3600,
        european_aqi: 20,
        us_aqi: 22,
        pm2_5: 5.7,
        pm10: 5.8,
        ozone: 45,
        nitrogen_dioxide: 18.9,
        ...OTHER_NOW,
        ...NO_POLLEN,
      },
      hourly: {
        time: HOURS_FROM_YESTERDAY,
        european_aqi: HOURS_FROM_YESTERDAY.map(() => 20),
        us_aqi: HOURS_FROM_YESTERDAY.map(() => 22),
        ozone: pollutant(
          45,
          spells.map(({ o, start }) => [start, 3, o]),
        ),
        nitrogen_dioxide: pollutant(
          18.9,
          spells.map(({ n, start }) => [start, 3, n]),
        ),
        pm2_5: pollutant(
          5.7,
          spells.map(({ p, start }) => [start, 3, p]),
        ),
        pm10: pollutant(5.8, []),
        sulphur_dioxide: pollutant(1, []),
        ...noPollenHourly(HOURS_FROM_YESTERDAY),
      },
    };
  }

  if (kind === 'uk') {
    // The UK's DAQI (national-aqi.ts): the worst pollutant's band. Clean
    // air is 2 (ozone 40 over 8 hours). Worst per day: today 4 at 18:00
    // (NO₂ 210), Mon 5 (NO₂ 300), Tue 7 (NO₂ 450), Wed 10 (ozone 250 for
    // 8 hours), Thu 2.
    return {
      timezone: 'Europe/London',
      current: {
        time: '2026-11-15T13:00',
        interval: 3600,
        european_aqi: 25,
        us_aqi: 30,
        pm2_5: 8,
        pm10: 12,
        ozone: 40,
        nitrogen_dioxide: 20,
        ...OTHER_NOW,
        ...NO_POLLEN,
      },
      hourly: {
        time: HOURS_FROM_YESTERDAY,
        european_aqi: HOURS_FROM_YESTERDAY.map(() => 25),
        us_aqi: HOURS_FROM_YESTERDAY.map(() => 30),
        ozone: pollutant(40, [['2026-11-18T10:00', 8, 250]]),
        nitrogen_dioxide: pollutant(20, [
          ['2026-11-15T18:00', 1, 210],
          ['2026-11-16T09:00', 1, 300],
          ['2026-11-17T08:00', 1, 450],
        ]),
        sulphur_dioxide: pollutant(2, []),
        pm2_5: pollutant(8, []),
        pm10: pollutant(12, []),
        ...noPollenHourly(HOURS_FROM_YESTERDAY),
      },
    };
  }

  if (kind === 'north-america') {
    return {
      timezone: 'America/New_York',
      current: {
        time: '2026-11-15T08:00',
        interval: 3600,
        european_aqi: 32,
        us_aqi: 22,
        pm2_5: 5.7,
        pm10: 5.8,
        ozone: 45,
        nitrogen_dioxide: 18.9,
        // Pollen data exists only for Europe.
        ...OTHER_NOW,
        ...NO_POLLEN,
      },
      // The global model reaches all 5 days. Worst per day (US AQI):
      // today (from 08:00) 58 at 17:00, then 40, 35, 72, 45.
      hourly: {
        time: HOURS,
        european_aqi: hourlyValues(20, {}),
        us_aqi: hourlyValues(20, {
          '2026-11-15T17:00': 58,
          '2026-11-16T09:00': 40,
          '2026-11-17T12:00': 35,
          '2026-11-18T15:00': 72,
          '2026-11-19T20:00': 45,
        }),
        ...noPollenHourly(),
      },
    };
  }

  return {
    timezone: 'Europe/Oslo',
    current: {
      time: '2026-11-15T14:00',
      interval: 3600,
      european_aqi: 30,
      us_aqi: 47,
      pm2_5: 5,
      pm10: 10.4,
      ozone: 54,
      nitrogen_dioxide: 17.2,
      // In season one type is in the air; the others are 0 (not shown).
      ...OTHER_NOW,
      ...NO_POLLEN,
      alder_pollen: 0,
      birch_pollen: 25.4,
      grass_pollen: 0,
      mugwort_pollen: 0,
      olive_pollen: 0,
      ragweed_pollen: 0,
    },
    // The European model reaches about 4 days. Worst per day (European AQI):
    // today from 14:00 on 42 at 18:00 (the 70 at 08:00 is already past),
    // then 25, 18, 55. The 5th day has only 6 hours: too few to show.
    hourly: {
      time: HOURS,
      european_aqi: hourlyValues(15, {
        '2026-11-15T08:00': 70,
        '2026-11-15T18:00': 42,
        '2026-11-16T07:00': 25,
        '2026-11-17T03:00': 18,
        '2026-11-18T21:00': 55,
        ...noDataOn('2026-11-19'),
        '2026-11-19T00:00': 90,
        '2026-11-19T01:00': 90,
        '2026-11-19T02:00': 90,
        '2026-11-19T03:00': 90,
        '2026-11-19T04:00': 90,
        '2026-11-19T05:00': 90,
      }),
      us_aqi: hourlyValues(30, noDataOn('2026-11-19')),
      // Worst per day: today (from 14:00) birch 40 (moderate); Mon birch 150
      // (high); Tue grass 12 (moderate) and birch 5 (low); Wed none. The
      // 5th day has no data. Birch 300 at 08:00 today is already past.
      birch_pollen: hourlyValues(0, {
        '2026-11-15T08:00': 300,
        '2026-11-15T18:00': 40,
        '2026-11-16T12:00': 150,
        '2026-11-17T12:00': 5,
        ...noDataOn('2026-11-19'),
      }),
      grass_pollen: hourlyValues(0, { '2026-11-17T15:00': 12, ...noDataOn('2026-11-19') }),
      alder_pollen: hourlyValues(0, noDataOn('2026-11-19')),
      mugwort_pollen: hourlyValues(0, noDataOn('2026-11-19')),
      olive_pollen: hourlyValues(0, noDataOn('2026-11-19')),
      ragweed_pollen: hourlyValues(0, noDataOn('2026-11-19')),
    },
  };
}
