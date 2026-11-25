// Points closer than this (in degrees, ~1 km) count as the same place.
const SAME_PLACE_DEGREES = 0.01;

interface Point {
  lat: number;
  lng: number;
}

/** Whether two points are the same place, for favourites and the start place. */
export function samePlace(a: Point, b: Point): boolean {
  // Longitude difference the short way round, so 179.999° and -179.999°
  // (either side of the date line) count as neighbours.
  const lngDifference = Math.abs(((((a.lng - b.lng) % 360) + 540) % 360) - 180);
  return Math.abs(a.lat - b.lat) < SAME_PLACE_DEGREES && lngDifference < SAME_PLACE_DEGREES;
}
