// The atmospheric correction for distance meters (EDM) in surveying
// instruments: light travels a little slower in denser air, so a measured
// distance is corrected by so many parts per million (1 ppm = 1 mm per km).
// Surveyors type it in, or the temperature, pressure and humidity it comes
// from. Shown as an estimate: the forecast isn't the air at the instrument.
//
// Leica's formula for the visible red laser (658 nm), from its total station
// manuals (e.g. Leica TS13 / TS12P User Manual, Technical Data → Formulas;
// refractive index after the IAG Resolutions 1999):
//
//   ΔD1 = 286.338 − [0.29535·p / (1 + αt) − 4.126·10⁻⁴·h / (1 + αt) · 10^x]
//
// p air pressure (mbar = hPa) where the instrument stands, t temperature
// (°C), h relative humidity (%), α = 1/273.15, x = 7.5t/(237.3 + t) + 0.7857.
// The bracket is the air's refractivity (dry part minus water vapour: 10^x
// is the saturation vapour pressure, Magnus) and 286.338 its value in
// Leica's standard atmosphere (1013.25 hPa, 12 °C, 60 %), where ΔD1 = 0.

export interface EdmAir {
  /** Air temperature, °C. */
  temperature: number;
  /** Air pressure at ground level (not reduced to sea level), hPa. */
  pressure: number;
  /** Relative humidity, %. */
  humidity: number;
}

/** The correction in ppm, unrounded. */
export function edmCorrection({ temperature: t, pressure: p, humidity: h }: EdmAir): number {
  const expansion = 1 + t / 273.15;
  const x = (7.5 * t) / (237.3 + t) + 0.7857;
  const refractivity = (0.29535 * p) / expansion - ((4.126e-4 * h) / expansion) * 10 ** x;
  return 286.338 - refractivity;
}

/** The correction in whole ppm, as instruments take it. */
export function edmCorrectionPpm(air: EdmAir): number {
  return Math.round(edmCorrection(air)) || 0;
}
