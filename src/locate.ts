// The "My location" button and its status message.

import { getCurrentPosition, LocationError, type Coordinates } from './geolocation';
import { t } from './i18n';

// Long enough to read an error message, then it gets out of the way.
const MESSAGE_DURATION_MS = 8000;

export function setUpLocateButton(
  button: HTMLButtonElement,
  message: HTMLElement,
  onLocated: (position: Coordinates) => void,
): void {
  const idleLabel = button.getAttribute('aria-label') ?? '';
  let busy = false;
  let messageTimer: number | undefined;

  function showMessage(text: string) {
    window.clearTimeout(messageTimer);
    message.textContent = text;
    message.hidden = false;
    messageTimer = window.setTimeout(hideMessage, MESSAGE_DURATION_MS);
  }

  function hideMessage() {
    window.clearTimeout(messageTimer);
    message.hidden = true;
    message.textContent = '';
  }

  function setBusy(value: boolean) {
    busy = value;
    // aria-disabled (not disabled) keeps the button focusable while busy.
    // The icon pulses while busy (CSS); the label says so for screen readers.
    button.setAttribute('aria-disabled', String(value));
    button.setAttribute('aria-label', value ? t('Finding your location…') : idleLabel);
  }

  button.addEventListener('click', async () => {
    if (busy) return;
    hideMessage();
    setBusy(true);
    try {
      onLocated(await getCurrentPosition());
    } catch (error) {
      showMessage(
        error instanceof LocationError
          ? error.message
          : t('Your location could not be determined.'),
      );
    } finally {
      setBusy(false);
    }
  });
}
