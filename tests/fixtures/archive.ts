// Open-Meteo's archive answer for one day (src/weather/archive.ts): a clear,
// cold, dry day with 7 hours of sunshine, whatever the date.

export function archiveFixture(date: string) {
  return {
    latitude: 59.9,
    longitude: 10.75,
    timezone: 'Europe/Oslo',
    daily: {
      time: [date],
      weather_code: [0],
      temperature_2m_max: [-8.2],
      temperature_2m_min: [-15.4],
      precipitation_sum: [0],
      rain_sum: [0],
      snowfall_sum: [0],
      wind_speed_10m_max: [6.1],
      sunshine_duration: [25_200],
    },
  };
}
