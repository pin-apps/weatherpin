import { t } from './i18n';
// The browser's Geolocation API, wrapped in a promise with friendly errors.

export interface Coordinates {
  lat: number;
  lng: number;
}

export class LocationError extends Error {}

const OPTIONS: PositionOptions = {
  // City-level accuracy is plenty for weather, and faster and lighter on
  // the battery than GPS.
  enableHighAccuracy: false,
  timeout: 10_000,
  // Reuse a position up to 5 minutes old instead of asking the device again.
  maximumAge: 5 * 60 * 1000,
};

function messageFor(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return t(
        "Location access is blocked. Allow it in your browser's site settings and try again.",
      );
    case error.POSITION_UNAVAILABLE:
      return t('Your location could not be determined right now.');
    case error.TIMEOUT:
      return t('Finding your location took too long. Please try again.');
    default:
      return t('Your location could not be determined.');
  }
}

/** Asks the browser for the user's position (it may show a permission prompt). */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    // Browsers only offer geolocation on https:// pages and localhost.
    if (!window.isSecureContext) {
      reject(
        new LocationError(t('Your location is only available over a secure (https) connection.')),
      );
      return;
    }
    if (!('geolocation' in navigator)) {
      reject(new LocationError(t('This browser cannot share your location.')));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(new LocationError(messageFor(error))),
      OPTIONS,
    );
  });
}
