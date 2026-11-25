// NOAA's aurora nowcast (src/weather/aurora.ts), cut down to a few cells
// ([longitude 0–359, latitude, chance %]): over Oslo 15 % with more just
// north of it ("low in the north"), over Helsinki 35 %, near Dunedin
// (New Zealand) 25 %; 0 everywhere else.

export function auroraFixture() {
  return {
    'Observation Time': '2026-11-15T20:58:00Z',
    'Forecast Time': '2026-11-15T22:14:00Z',
    'Data Format': '[Longitude, Latitude, Aurora]',
    coordinates: [
      [11, 60, 15],
      [11, 61, 20],
      [11, 62, 40],
      [11, 63, 30],
      [25, 60, 35],
      [171, -46, 25],
    ],
  };
}
