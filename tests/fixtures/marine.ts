// Made-up Open-Meteo Marine API responses (real shape): a point at sea, and
// one inland, where the API answers with every value null.

export type MarineKind = 'sea' | 'land';

const HOURS = ['2026-11-15', '2026-11-16'].flatMap((date) =>
  Array.from({ length: 24 }, (_, h) => `${date}T${String(h).padStart(2, '0')}:00`),
);

export function marineFixture(kind: MarineKind = 'land') {
  if (kind === 'land') {
    return {
      current: {
        time: '2026-11-15T14:00',
        interval: 900,
        wave_height: null,
        wave_direction: null,
        wave_period: null,
        swell_wave_height: null,
        sea_surface_temperature: null,
      },
      hourly: { time: HOURS, wave_height: HOURS.map(() => null) },
    };
  }
  // 1.2 m from SW (225°) every 6 s now; highest 2.4 m at 21:00 today (the
  // 3.0 m at 08:00 is past, the 2.8 m tomorrow at 15:00 beyond 24 hours).
  const heights: Record<string, number> = {
    '2026-11-15T08:00': 3.0,
    '2026-11-15T21:00': 2.4,
    '2026-11-16T15:00': 2.8,
  };
  return {
    current: {
      time: '2026-11-15T14:00',
      interval: 900,
      wave_height: 1.2,
      wave_direction: 225,
      wave_period: 6.4,
      swell_wave_height: 0.8,
      sea_surface_temperature: 8.3,
    },
    hourly: { time: HOURS, wave_height: HOURS.map((time) => heights[time] ?? 1.2) },
  };
}
