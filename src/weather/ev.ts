// "Electric car range" in More details: how much less range an electric car
// typically has in the cold now, as a range of percentages, only from +5 °C
// down. General figures from published cold-weather tests and fleet data
// (Geotab's real-world range data, AAA's 2019 test at −7 °C, NAF's El Prix
// winter tests in Norway): not any particular car. A heat pump, a car warmed
// while plugged in, gentle speed and longer trips lose less; short trips and
// a hot cabin lose more. Shown with an estimate note.

export interface RangeLoss {
  /** Typical loss, percent of the summer range. */
  low: number;
  high: number;
}

// Upper temperature limit (°C, the air now) of each band, coldest last.
const BANDS: [below: number, low: number, high: number][] = [
  [5, 5, 15],
  [0, 10, 25],
  [-5, 15, 30],
  [-10, 20, 40],
  [-20, 30, 50],
];

/** The typical range loss at this temperature; none above +5 °C. */
export function rangeLoss(celsius: number): RangeLoss | undefined {
  let loss: RangeLoss | undefined;
  for (const [below, low, high] of BANDS) {
    if (celsius < below) loss = { low, high };
  }
  return loss;
}
