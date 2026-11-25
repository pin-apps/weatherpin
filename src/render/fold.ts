// Sections people can fold away ("I don't need all of it all the time"): a
// tap on a section's heading hides its content, and the device remembers it
// for every place. The content is hidden with CSS only, so code that fills a
// section later (air quality, Sky, Beer outside) works the same either way.
//
// Stored as nordic-weather:folded-sections = { version, sections }, with
// only the sections the user has changed (true = folded); the rest follow
// the defaults below.

import { el, iconEl } from '../dom';
import { readStored, writeStored } from '../storage';

const STORAGE_KEY = 'folded-sections';
const VERSION = 1;

export type SectionId = 'hourly' | 'daily' | 'sea' | 'air-quality' | 'sky' | 'more-details';

/** Less-checked sections start folded, so a first visit sees a short panel. */
const FOLDED_AT_FIRST: ReadonlySet<SectionId> = new Set(['air-quality', 'sky', 'more-details']);

type Choices = Partial<Record<SectionId, boolean>>;

function storedChoices(): Choices {
  const stored = readStored(STORAGE_KEY) as { version?: unknown; sections?: unknown } | undefined;
  if (stored?.version !== VERSION || typeof stored.sections !== 'object' || !stored.sections) {
    return {};
  }
  return stored.sections as Choices;
}

function isFolded(id: SectionId): boolean {
  return storedChoices()[id] ?? FOLDED_AT_FIRST.has(id);
}

function saveFolded(id: SectionId, folded: boolean) {
  writeStored(STORAGE_KEY, { version: VERSION, sections: { ...storedChoices(), [id]: folded } });
}

/**
 * Turns a section's heading into a fold button (▾ open, ▸ folded). Returns
 * the slot for a short summary shown in the heading while folded
 * ("Air quality [19 Good]").
 */
export function makeFoldable(
  section: HTMLElement,
  heading: HTMLElement,
  id: SectionId,
): HTMLElement {
  const summary = el('span', 'fold__summary');
  const button = el('button', 'fold');
  button.type = 'button';
  button.append(
    el('span', 'fold__title', heading.textContent ?? ''),
    summary,
    iconEl('▾', 'fold__arrow'),
  );
  heading.replaceChildren(button);

  const show = (folded: boolean) => {
    section.classList.toggle('is-folded', folded);
    button.setAttribute('aria-expanded', String(!folded));
  };
  show(isFolded(id));
  button.addEventListener('click', () => {
    const folded = !section.classList.contains('is-folded');
    show(folded);
    saveFolded(id, folded);
  });
  return summary;
}
