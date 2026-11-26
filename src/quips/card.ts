// The card at the top of the panel for a weather excuse or a small talk
// line: the line, "Another one" (every line that fits before repeating),
// "Share" (with a link to the place) and ×. One card at a time: opening
// one replaces the other. Loaded on demand with the lines (quip-buttons.ts).

import { el, iconEl } from '../dom';
import { statusLine } from '../status-line';
import { t } from '../i18n';

export interface CardOptions {
  icon: string;
  /** Translated, e.g. "Weather excuse". */
  title: string;
  /** Every line that fits, shuffled; asked again for each new round. */
  lines: () => string[];
  /** The link to the place, sent with a shared line. */
  placeLink: string;
  /** The status line under the panel's header ("Copied"). */
  status: HTMLElement;
}

export function showCard({ icon, title, lines, placeLink, status }: CardOptions): void {
  const body = document.querySelector<HTMLElement>('.panel__body');
  if (!body) return;
  body.querySelector('.quip')?.remove();

  let round = lines();
  let index = 0;
  const { say } = statusLine(status);

  const card = el('section', 'quip');
  card.setAttribute('aria-labelledby', 'quip-title');
  const heading = el('h3', 'quip__title');
  heading.id = 'quip-title';
  heading.append(iconEl(icon, 'quip__icon'), ` ${title}`);
  const close = el('button', 'quip__close');
  close.type = 'button';
  close.setAttribute('aria-label', t('Close'));
  close.append(iconEl('×', 'quip__close-icon'));
  const header = el('div', 'quip__header');
  header.append(heading, close);

  const text = el('p', 'quip__text', `“${round[0]}”`);
  // Focus lands here when the card opens, so it's read out first.
  text.tabIndex = -1;

  const another = el('button', 'button quip__another');
  another.type = 'button';
  another.append(iconEl('🎲', 'quip__icon'), ` ${t('Another one')}`);
  const share = el('button', 'button quip__share');
  share.type = 'button';
  share.append(iconEl('↗', 'quip__icon'), ` ${t('Share')}`);
  const actions = el('div', 'quip__actions');
  actions.append(another, share);

  card.append(header, text, actions);
  // Below any warnings: they matter more.
  const warnings = body.querySelector(':scope > .warnings');
  if (warnings) warnings.after(card);
  else body.prepend(card);
  text.focus();

  another.addEventListener('click', () => {
    index++;
    // All shown: a new round, not starting with the one just shown.
    if (index >= round.length) {
      const last = round[round.length - 1];
      round = lines();
      if (round.length > 1 && round[0] === last) round.push(round.shift()!);
      index = 0;
    }
    text.textContent = `“${round[index]}”`;
  });

  share.addEventListener('click', async () => {
    const message = `${round[index]}\n${placeLink}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: message });
        window.dispatchEvent(new Event('weatherpin:shared'));
        return;
      } catch (error) {
        // Closing the share sheet is a choice, not a failure.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      say(t('Copied'));
      window.dispatchEvent(new Event('weatherpin:shared'));
    } catch {
      // No clipboard: the text is on screen to copy by hand.
      say(t("Couldn't copy it: select the text to copy it."));
    }
  });

  close.addEventListener('click', () => {
    card.remove();
    document.querySelector<HTMLButtonElement>('.panel__more')?.focus();
  });
}
