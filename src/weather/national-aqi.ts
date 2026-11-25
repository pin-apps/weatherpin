// The UK's and Canada's own air quality indices, worked out hour by hour
// from the pollutant forecast (Open-Meteo gives only the European and US
// indices ready-made). Model data, not station readings, so the official
// figures can differ a little; the panel says so.
//
// UK: Daily Air Quality Index (DAQI), 1–10, by DEFRA
//   https://uk-air.defra.gov.uk/air-pollution/daqi?view=more-info
//   The highest of five pollutants' bands, each over its own period.
// Canada: Air Quality Health Index (AQHI), 1–10+, by Environment and
//   Climate Change Canada (Stieb et al. 2008, J Air & Waste Manage Assoc
//   58:435–450): from 3-hour averages of ozone, NO₂ and PM2.5.

/** Hourly pollutant concentrations in µg/m³, local times; null = no data. */
export interface HourlyPollutants {
  pm2_5?: (number | null)[];
  pm10?: (number | null)[];
  ozone?: (number | null)[];
  nitrogen_dioxide?: (number | null)[];
  sulphur_dioxide?: (number | null)[];
}

type Pollutant = keyof HourlyPollutants;

/**
 * Average of the `hours` hours ending at `index` (a running mean), or null
 * if fewer than `needed` of them have data (by default three quarters).
 */
function runningMean(
  values: (number | null)[] | undefined,
  index: number,
  hours: number,
  needed = Math.ceil(hours * 0.75),
): number | null {
  if (!values) return null;
  let sum = 0;
  let count = 0;
  for (let i = index - hours + 1; i <= index; i++) {
    const value = values[i];
    if (value == null) continue;
    sum += value;
    count++;
  }
  return count >= needed ? sum / count : null;
}

// ── UK DAQI ─────────────────────────────────────────────────────────────────

// Upper limit (µg/m³) of index 1 to 9; above the last is 10. DEFRA's table.
// Hours: the averaging period. SO₂ is officially a 15-minute mean; the
// forecast is hourly, so the hourly value stands in for it.
const DAQI: Record<Pollutant, { hours: number; limits: number[] }> = {
  ozone: { hours: 8, limits: [33, 66, 100, 120, 140, 160, 187, 213, 240] },
  nitrogen_dioxide: { hours: 1, limits: [67, 134, 200, 267, 334, 400, 467, 534, 600] },
  sulphur_dioxide: { hours: 1, limits: [88, 177, 266, 354, 443, 532, 710, 887, 1064] },
  pm2_5: { hours: 24, limits: [11, 23, 35, 41, 47, 53, 58, 64, 70] },
  pm10: { hours: 24, limits: [16, 33, 50, 58, 66, 75, 83, 91, 100] },
};

/** DAQI 1–10 for one pollutant concentration (µg/m³, already averaged). */
export function daqiFor(pollutant: Pollutant, concentration: number): number {
  // The table's limits are whole numbers.
  const rounded = Math.round(concentration);
  const band = DAQI[pollutant].limits.findIndex((limit) => rounded <= limit);
  return band === -1 ? 10 : band + 1;
}

/** DAQI for every hour: the worst of the pollutants with data, else null. */
export function daqiSeries(hourly: HourlyPollutants, length: number): (number | null)[] {
  return Array.from({ length }, (_, index) => {
    let worst: number | null = null;
    for (const pollutant of Object.keys(DAQI) as Pollutant[]) {
      const mean = runningMean(hourly[pollutant], index, DAQI[pollutant].hours);
      if (mean != null) worst = Math.max(worst ?? 0, daqiFor(pollutant, mean));
    }
    return worst;
  });
}

// ── Canada AQHI ─────────────────────────────────────────────────────────────

// µg/m³ → ppb at 25 °C and normal pressure: × 24.45 / molar mass (g/mol).
const OZONE_PPB = 24.45 / 48.0;
const NO2_PPB = 24.45 / 46.01;

/**
 * AQHI from 3-hour averages: ozone and NO₂ in ppb, PM2.5 in µg/m³. Rounded
 * to a whole number, at least 1 (the scale starts there); above 10 is
 * shown as "10+".
 */
export function aqhiFor(ozonePpb: number, no2Ppb: number, pm25: number): number {
  const sum =
    Math.exp(0.000537 * ozonePpb) -
    1 +
    (Math.exp(0.000871 * no2Ppb) - 1) +
    (Math.exp(0.000487 * pm25) - 1);
  return Math.max(1, Math.round((10 / 10.4) * 100 * sum));
}

/** AQHI for every hour; null where any of the three has no data. */
export function aqhiSeries(hourly: HourlyPollutants, length: number): (number | null)[] {
  return Array.from({ length }, (_, index) => {
    // Valid with 2 of the 3 hours, as for Canada's stations.
    const ozone = runningMean(hourly.ozone, index, 3, 2);
    const no2 = runningMean(hourly.nitrogen_dioxide, index, 3, 2);
    const pm25 = runningMean(hourly.pm2_5, index, 3, 2);
    if (ozone == null || no2 == null || pm25 == null) return null;
    return aqhiFor(ozone * OZONE_PPB, no2 * NO2_PPB, pm25);
  });
}
