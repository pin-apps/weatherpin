// "Edit favourites": rename, reorder and remove favourite places. A native
// <dialog> like About (Escape closes it, focus stays inside). Every change
// is saved at once; there's nothing to confirm.
//
// Reordering is ↑/↓ buttons rather than dragging: they work the same with
// touch, mouse, keyboard and screen readers, and don't fight the list's
// scrolling on a phone.

import { el, iconEl } from '../dom';
import {
  displayName,
  loadFavourites,
  MAX_LABEL_LENGTH,
  moveFavourite,
  onFavouritesChange,
  removeFavourite,
  renameFavourite,
  restoreFavourite,
  type Favourite,
} from './store';
import { t } from '../i18n';

export interface FavouritesEditor {
  open(): void;
}

/** The controls in a row, so focus can return to the same one after a redraw. */
type Control = 'name' | 'up' | 'down' | 'remove';

const keyOf = (place: Favourite) => `${place.lat},${place.lng}`;

export function setUpFavouritesEditor(
  dialog: HTMLDialogElement,
  onClose: () => void,
): FavouritesEditor {
  const list = dialog.querySelector<HTMLOListElement>('.favourites-editor__list')!;
  const hint = dialog.querySelector<HTMLElement>('.favourites-editor__hint')!;
  const empty = dialog.querySelector<HTMLElement>('.favourites-editor__empty')!;
  const status = dialog.querySelector<HTMLElement>('.favourites-editor__status')!;
  const undoButton = dialog.querySelector<HTMLButtonElement>('.favourites-editor__undo')!;

  // The list as last drawn, to tell our own saves from another tab's.
  let drawn = '';
  // While a rename is saved: the row updates itself, no redraw.
  let renaming = false;
  // The last removed place and where it was, for Undo.
  let removed: { place: Favourite; index: number } | undefined;

  function say(text: string, offerUndo = false) {
    status.textContent = text;
    undoButton.hidden = !offerUndo;
  }

  function render(focus?: { key: string; control: Control }) {
    const places = loadFavourites();
    drawn = JSON.stringify(places);
    list.replaceChildren(...places.map((place, i) => row(place, i, places.length)));
    empty.hidden = places.length > 0;
    hint.hidden = places.length === 0;
    if (focus) focusControl(focus.key, focus.control);
  }

  function focusControl(key: string, control: Control) {
    const item = [...list.children].find((child) => (child as HTMLElement).dataset.key === key);
    if (!item) return;
    let target = item.querySelector<HTMLElement>(`[data-control="${control}"]`);
    // Moved to the top or bottom: that arrow is now off, use the other one.
    if (target instanceof HTMLButtonElement && target.disabled) {
      target = item.querySelector(`[data-control="${control === 'up' ? 'down' : 'up'}"]`);
    }
    target?.focus();
  }

  function row(place: Favourite, index: number, count: number): HTMLLIElement {
    const key = keyOf(place);
    const shownName = displayName(place);
    const item = el('li', 'favourites-editor__item');
    item.dataset.key = key;

    const name = document.createElement('input');
    name.type = 'text';
    name.className = 'favourites-editor__name';
    name.value = shownName;
    name.maxLength = MAX_LABEL_LENGTH;
    // Emptied, it shows (and goes back to) the place's own name.
    name.placeholder = place.name;
    name.autocomplete = 'off';
    name.enterKeyHint = 'done';
    name.dataset.control = 'name';
    name.setAttribute('aria-label', t('Name for {place}', { place: place.name }));

    const text = el('div', 'favourites-editor__text');
    text.append(name);
    // A renamed place still says where it is.
    const placeLine = el('span', 'favourites-editor__place', place.label ? place.name : '');
    text.append(placeLine);

    const commit = () => {
      const typed = name.value.trim();
      if (typed === displayName(findIn(key) ?? place)) return;
      // Updated in place, not redrawn: the name is saved when the field
      // loses focus, often to a tap on another button, which a redraw now
      // would swallow.
      renaming = true;
      renameFavourite(place, typed);
      renaming = false;
      const saved = findIn(key);
      if (!saved) return;
      drawn = JSON.stringify(loadFavourites());
      name.value = displayName(saved);
      placeLine.textContent = saved.label ? saved.name : '';
      labelButtons(item, displayName(saved));
    };
    name.addEventListener('change', commit);
    name.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      commit();
      // Phones: Enter ("Done") puts the keyboard away.
      name.blur();
    });

    const up = button('↑', 'up', index === 0, () => {
      moveFavourite(place, -1);
      render({ key, control: 'up' });
    });
    const down = button('↓', 'down', index === count - 1, () => {
      moveFavourite(place, 1);
      render({ key, control: 'down' });
    });
    const remove = button('✕', 'remove', false, () => {
      const current = loadFavourites();
      removed = {
        place: findIn(key) ?? place,
        index: current.findIndex((saved) => keyOf(saved) === key),
      };
      removeFavourite(place);
      render();
      say(t('Removed {place}.', { place: displayName(removed.place) }), true);
      undoButton.focus();
    });

    item.append(text, up, down, remove);
    labelButtons(item, shownName);
    return item;
  }

  function button(symbol: string, control: Control, disabled: boolean, onClick: () => void) {
    const element = el('button', `favourites-editor__${control}`);
    element.type = 'button';
    element.dataset.control = control;
    element.disabled = disabled;
    element.append(iconEl(symbol, 'favourites-editor__symbol'));
    element.addEventListener('click', onClick);
    return element;
  }

  /** Names the row's buttons after the place, e.g. "Move Cabin up". */
  function labelButtons(item: Element, name: string) {
    const labels: Record<string, string> = {
      up: t('Move {place} up', { place: name }),
      down: t('Move {place} down', { place: name }),
      remove: t('Remove {place}', { place: name }),
    };
    item.querySelectorAll<HTMLButtonElement>('button[data-control]').forEach((element) => {
      const label = labels[element.dataset.control!];
      element.setAttribute('aria-label', label);
      element.title = label;
    });
  }

  const findIn = (key: string) => loadFavourites().find((place) => keyOf(place) === key);

  undoButton.addEventListener('click', () => {
    if (!removed) return;
    const { place, index } = removed;
    removed = undefined;
    if (restoreFavourite(place, index)) {
      render({ key: keyOf(place), control: 'remove' });
      say(t('{place} is back.', { place: displayName(place) }));
    } else {
      say(t("Couldn't put it back: this browser is blocking storage, or the list is full."));
    }
  });

  dialog.querySelector('.favourites-editor__done')!.addEventListener('click', () => dialog.close());
  // A click on the dimmed backdrop closes it too, like About.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    // A name still being typed (closed with Escape or Done) is kept.
    list.querySelectorAll<HTMLInputElement>('.favourites-editor__name').forEach((input) => {
      input.dispatchEvent(new Event('change'));
    });
    removed = undefined;
    say('');
    onClose();
  });

  // Changed in another tab while open: show the new list.
  onFavouritesChange(() => {
    if (dialog.open && !renaming && JSON.stringify(loadFavourites()) !== drawn) render();
  });

  return {
    open() {
      removed = undefined;
      say('');
      render();
      if (!dialog.open) dialog.showModal();
    },
  };
}
