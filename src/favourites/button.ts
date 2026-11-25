// The ☆/★ toggle in the weather panel's header.

import { formatCoordinates } from '../format';
import type { PickedPoint } from '../map';
import {
  addFavourite,
  favouritesAvailable,
  isSaved,
  MAX_FAVOURITES,
  onFavouritesChange,
  removeFavourite,
} from './store';
import { t } from '../i18n';

export interface FavouriteButton {
  /** Shows the button for the place now in the panel. */
  showFor(point: PickedPoint): void;
  hide(): void;
}

// Long enough to read the message, then it goes away.
const MESSAGE_DURATION_MS = 6000;

export function setUpFavouriteButton(
  button: HTMLButtonElement,
  message: HTMLElement,
): FavouriteButton {
  const icon = button.querySelector<HTMLElement>('.panel__favourite-icon')!;
  let point: PickedPoint | undefined;
  let messageTimer: number | undefined;

  function render() {
    const saved = point !== undefined && isSaved(point);
    // The label stays "Favourite"; aria-pressed tells screen readers whether
    // it's saved. The tooltip says what a click will do.
    button.setAttribute('aria-pressed', String(saved));
    button.title = saved ? t('Remove from favourites') : t('Save as favourite');
    icon.textContent = saved ? '★' : '☆';
  }

  // The message element is a live region that always stays in the page
  // (empty when idle): screen readers often miss text added to a region
  // that was hidden a moment before.
  function say(text: string, visible = false) {
    window.clearTimeout(messageTimer);
    // Routine confirmations are for screen readers only; problems are shown.
    message.classList.toggle('visually-hidden', !visible);
    message.textContent = text;
    messageTimer = window.setTimeout(clearMessage, MESSAGE_DURATION_MS);
  }

  function clearMessage() {
    window.clearTimeout(messageTimer);
    message.textContent = '';
  }

  button.addEventListener('click', () => {
    if (!point) return;
    if (isSaved(point)) {
      removeFavourite(point);
      say(t('Removed from favourites.'));
      return;
    }
    const name = point.name ?? formatCoordinates(point.lat, point.lng);
    switch (addFavourite({ name, lat: point.lat, lng: point.lng })) {
      case 'added':
        say(t('Saved to favourites.'));
        break;
      case 'full':
        say(
          t('You have {count} favourites. Remove one to save another.', { count: MAX_FAVOURITES }),
          true,
        );
        break;
      case 'failed':
        say(t('Could not save: this browser is blocking storage.'), true);
        break;
    }
  });

  // Keep the star right when favourites change elsewhere (e.g. another tab).
  onFavouritesChange(render);

  return {
    showFor(newPoint) {
      point = newPoint;
      clearMessage();
      // Without storage (blocked by the browser) there's nothing to offer.
      button.hidden = !favouritesAvailable();
      render();
    },
    hide() {
      point = undefined;
      button.hidden = true;
      clearMessage();
    },
  };
}
