/** Creates an element with an optional class and text (set safely as text). */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/** An emoji icon hidden from screen readers (the text next to it says the same). */
export function iconEl(icon: string, className: string): HTMLSpanElement {
  const span = el('span', className, icon);
  span.setAttribute('aria-hidden', 'true');
  return span;
}

/** Text only screen readers see, e.g. a description for an icon. */
export function hiddenText(text: string): HTMLSpanElement {
  return el('span', 'visually-hidden', text);
}

/**
 * "⚠️ Estimate only, not a measurement. …": shown with every estimate (a
 * `dd` inside a details row, else a paragraph).
 */
export function estimateNote(lead: string, rest = '', tag: 'p' | 'dd' = 'p'): HTMLElement {
  const note = el(tag, 'estimate-note');
  note.append(iconEl('⚠️', 'estimate-note__icon'), ' ', el('strong', undefined, lead));
  if (rest) note.append(` ${rest}`);
  return note;
}
