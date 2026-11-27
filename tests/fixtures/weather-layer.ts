// The weather symbols layer's request (src/layer/weather-layer.ts): hourly
// temperature and weather code at many places in one request, local times
// (timezone=auto); the layer takes "now" from this hour (14:00 at the test
// clock). Made up per place: the temperature falls with
// latitude; now and tomorrow differ from tonight so a time switch shows.

const START = Date.UTC(2026, 10, 15);
const CODES = [0, 2, 3, 61, 71];

export function weatherLayerFixture(url: URL) {
  const lats = (url.searchParams.get('latitude') ?? '').split(',').map(Number);
  const answers = lats.map((lat, place) => {
    const base = Math.round(25 - Math.abs(lat) / 2);
    const time = Array.from({ length: 72 }, (_, i) =>
      new Date(START + i * 3600 * 1000).toISOString().slice(0, 16),
    );
    const hourOf = (i: number) => i % 24;
    return {
      latitude: lat,
      utc_offset_seconds: 3600,
      current: {
        time: '2026-11-15T14:00',
        temperature_2m: base,
        weather_code: CODES[place % CODES.length],
        is_day: 1,
      },
      hourly: {
        time,
        // Tonight (03:00) 6° colder, tomorrow (15:00) 3° warmer than now.
        temperature_2m: time.map((_, i) =>
          hourOf(i) === 3 ? base - 6 : hourOf(i) === 15 ? base + 3 : base,
        ),
        weather_code: time.map((_, i) => (hourOf(i) === 3 ? 0 : CODES[place % CODES.length])),
        is_day: time.map((_, i) => (hourOf(i) >= 8 && hourOf(i) < 16 ? 1 : 0)),
      },
    };
  });
  return answers.length === 1 ? answers[0] : answers;
}
