// Place search box: a combobox (text input + list of suggestions), following
// the WAI-ARIA combobox pattern so it works with keyboard and screen readers.
// While the box is empty it suggests the user's favourite places instead,
// with "Edit favourites" and "Random place" under them (buttons, outside
// the list: Tab reaches them).

import { el, iconEl } from './dom';
import {
  displayName,
  loadFavourites,
  onFavouritesChange,
  type Favourite,
} from './favourites/store';
import {
  describeRegion,
  flagEmoji,
  GeocodingError,
  MIN_QUERY_LENGTH,
  searchPlaces,
  type Place,
} from './places/geocoding';
import { plural, t } from './i18n';
import { isSaunaSearch } from './sauna';
import { isSantaSearch } from './santa';
import { formatTemperature } from './format';
import { fetchWeatherNow } from './weather/now';
import { describeWeather } from './weather/wmo';

// Wait for a pause in typing before searching, to keep requests down.
const DEBOUNCE_MS = 300;

// On touch devices, closing the on-screen keyboard after choosing a place
// reveals the map and the weather.
const COARSE_POINTER = window.matchMedia('(pointer: coarse)');

export interface SearchHandlers {
  onSelectPlace(place: Place): void;
  onSelectFavourite(favourite: Favourite): void;
  /** "Edit favourites" under the favourites list. */
  onEditFavourites(): void;
  /** The "sauna" easter egg (see sauna.ts). */
  onSelectSauna(): void;
  /** The "Santa" easter egg (see santa.ts). */
  onSelectSanta(): void;
  /** "Random place" under the favourites (or alone, with none). */
  onRandomPlace(): void;
  /** "Temperature quiz", next to Random place. */
  onQuiz(): void;
}

/** One row in the suggestion list, from a search or from favourites. */
interface Suggestion {
  name: string;
  region?: string;
  icon: string;
  select(): void;
}

/** What the list currently shows; also labels the list for screen readers. */
type ListMode = 'places' | 'favourites';

export function setUpSearch(root: HTMLElement, handlers: SearchHandlers): void {
  const input = root.querySelector<HTMLInputElement>('.search__input')!;
  const popup = root.querySelector<HTMLElement>('.search__popup')!;
  const list = root.querySelector<HTMLUListElement>('.search__results')!;
  const editButton = root.querySelector<HTMLButtonElement>('.search__edit')!;
  const randomButton = root.querySelector<HTMLButtonElement>('.search__random')!;
  const quizButton = root.querySelector<HTMLButtonElement>('.search__quiz')!;
  const popupButtons: (Element | null)[] = [editButton, randomButton, quizButton];
  const message = root.querySelector<HTMLElement>('.search__message')!;
  // Screen-reader-only announcements, e.g. "3 places found".
  const status = root.querySelector<HTMLElement>('.search__status')!;

  let suggestions: Suggestion[] = [];
  let activeIndex = -1;
  let debounceTimer: number | undefined;
  let inFlight: AbortController | undefined;

  function setOpen(open: boolean) {
    const emptyBox = list.dataset.mode === 'favourites';
    const hasItems = suggestions.length > 0;
    list.hidden = !open || !hasItems;
    editButton.hidden = !open || !emptyBox || !hasItems;
    // Offered with an empty box, also when there are no favourites.
    randomButton.hidden = !open || !emptyBox;
    quizButton.hidden = randomButton.hidden;
    popup.hidden = list.hidden && randomButton.hidden;
    // The list (the combobox's own part) is what "expanded" is about.
    input.setAttribute('aria-expanded', String(!list.hidden));
    if (!open) setActive(-1);
  }

  function setActive(index: number) {
    activeIndex = index;
    list.querySelectorAll<HTMLElement>('[role="option"]').forEach((option, i) => {
      option.setAttribute('aria-selected', String(i === index));
    });
    if (index >= 0) {
      const option = list.children[index] as HTMLElement;
      input.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function showMessage(text: string) {
    message.textContent = text;
    message.hidden = text === '';
  }

  function renderSuggestions(items: Suggestion[], mode: ListMode) {
    suggestions = items;
    list.dataset.mode = mode;
    list.setAttribute('aria-label', mode === 'favourites' ? t('Favourites') : t('Places'));
    // The visible heading over the favourites (drawn by the CSS).
    list.dataset.heading = t('Favourites');
    list.replaceChildren(
      ...items.map((item, i) => {
        const option = el('li', 'search__option');
        option.id = `search-option-${i}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');

        const text = el('span', 'search__option-text');
        text.append(el('span', 'search__option-name', item.name));
        if (item.region) text.append(el('span', 'search__option-region', item.region));

        option.append(iconEl(item.icon, 'search__option-flag'), text);
        // Favourites get the weather there now, filled in when it arrives.
        if (mode === 'favourites') option.append(el('span', 'search__option-weather'));
        // mousedown would blur the input (closing the list) before the click.
        option.addEventListener('mousedown', (event) => event.preventDefault());
        option.addEventListener('click', () => choose(i));
        return option;
      }),
    );
  }

  function showSearchResults(results: Place[], query: string) {
    const items: Suggestion[] = results.map((place) => ({
      name: place.name,
      region: describeRegion(place),
      icon: flagEmoji(place.country_code),
      select: () => handlers.onSelectPlace(place),
    }));
    if (isSaunaSearch(query)) {
      items.unshift({
        name: t('Sauna'),
        region: t('Saunalahti, Finland'),
        icon: '🧖',
        select: () => handlers.onSelectSauna(),
      });
    }
    if (isSantaSearch(query)) {
      items.unshift({
        name: t("Santa's workshop"),
        region: t('Rovaniemi, Finland'),
        icon: '🎅',
        select: () => handlers.onSelectSanta(),
      });
    }
    renderSuggestions(items, 'places');

    if (items.length === 0) {
      showMessage(t('No places found.'));
      status.textContent = t('No places found.');
      setOpen(false);
    } else {
      showMessage('');
      status.textContent = plural(
        items.length,
        '{count} place found. Use the arrow keys to choose.',
        '{count} places found. Use the arrow keys to choose.',
      );
      setOpen(true);
    }
  }

  /**
   * The temperature now at each favourite, in one request. Extra: on a
   * failure the list just stays without them.
   */
  async function showFavouriteWeather(favourites: Favourite[], signal: AbortSignal) {
    let weather;
    try {
      weather = await fetchWeatherNow(favourites, signal);
    } catch {
      return;
    }
    if (signal.aborted || list.dataset.mode !== 'favourites') return;
    list.querySelectorAll('.search__option-weather').forEach((cell, i) => {
      const now = weather[i];
      if (!now) return;
      const condition = describeWeather(now.weatherCode, now.isDay);
      cell.replaceChildren(
        iconEl(condition.icon, 'search__option-weather-icon'),
        formatTemperature(now.temperature),
      );
    });
  }

  /** Favourites as suggestions, for an empty box; closes if there are none. */
  function showFavourites() {
    inFlight?.abort();
    showMessage('');
    const favourites = loadFavourites();
    renderSuggestions(
      favourites.map((favourite) => ({
        name: displayName(favourite),
        // A renamed favourite still says where it is.
        region: favourite.label ? favourite.name : undefined,
        icon: '★',
        select: () => handlers.onSelectFavourite(favourite),
      })),
      'favourites',
    );
    if (favourites.length === 0) {
      status.textContent = '';
      // Just "Random place".
      setOpen(true);
      return;
    }
    const controller = new AbortController();
    inFlight = controller;
    void showFavouriteWeather(favourites, controller.signal);
    const count = favourites.length;
    status.textContent = plural(
      count,
      '{count} favourite. Use the arrow keys to choose.',
      '{count} favourites. Use the arrow keys to choose.',
    );
    setOpen(true);
  }

  async function runSearch(query: string) {
    inFlight?.abort();
    const controller = new AbortController();
    inFlight = controller;
    try {
      const results = await searchPlaces(query, controller.signal);
      // Ignore results for text the user has since changed.
      if (input.value.trim() === query) showSearchResults(results, query);
    } catch (error) {
      if (controller.signal.aborted) return;
      suggestions = [];
      list.replaceChildren();
      setOpen(false);
      const text =
        error instanceof GeocodingError ? error.message : t('Something went wrong searching.');
      showMessage(text);
      status.textContent = text;
    }
  }

  function closeList() {
    inFlight?.abort();
    window.clearTimeout(debounceTimer);
    delete list.dataset.mode;
    suggestions = [];
    list.replaceChildren();
    showMessage('');
    status.textContent = '';
    setOpen(false);
  }

  function choose(index: number) {
    const suggestion = suggestions[index];
    if (!suggestion) return;
    // Empty the box: the panel title shows the place, and the next visit to
    // the box starts with the favourites.
    input.value = '';
    closeList();
    if (COARSE_POINTER.matches) input.blur();
    suggestion.select();
  }

  input.addEventListener('input', () => {
    window.clearTimeout(debounceTimer);
    const query = input.value.trim();
    if (query.length === 0) {
      showFavourites();
      return;
    }
    // Typing means searching: drop the favourites at once, so Enter can't
    // pick a favourite while the search results are still on their way.
    if (query.length < MIN_QUERY_LENGTH || list.dataset.mode === 'favourites') {
      closeList();
    }
    if (query.length < MIN_QUERY_LENGTH) return;
    debounceTimer = window.setTimeout(() => void runSearch(query), DEBOUNCE_MS);
  });

  input.addEventListener('keydown', (event) => {
    const count = suggestions.length;
    switch (event.key) {
      case 'ArrowDown':
        if (count === 0) return;
        event.preventDefault();
        if (list.hidden) setOpen(true);
        setActive((activeIndex + 1) % count);
        break;
      case 'ArrowUp':
        if (count === 0) return;
        event.preventDefault();
        if (list.hidden) setOpen(true);
        setActive(activeIndex <= 0 ? count - 1 : activeIndex - 1);
        break;
      case 'Enter':
        // Enter without picking takes the top suggestion.
        if (count > 0) {
          event.preventDefault();
          choose(Math.max(activeIndex, 0));
        }
        break;
      case 'Escape':
        // First Escape closes the list, a second one clears the text.
        if (!list.hidden) {
          setOpen(false);
        } else {
          input.value = '';
          closeList();
        }
        break;
    }
  });

  // An empty box offers the favourites; otherwise reopen earlier results.
  input.addEventListener('focus', () => {
    if (input.value.trim() === '') {
      showFavourites();
    } else if (suggestions.length > 0) {
      setOpen(true);
    }
  });
  // Leaving the box closes the list, unless focus went (with Tab) to the
  // buttons under it, which are part of it; leaving those closes it too.
  // Already focused (e.g. after choosing a place with a mouse), a click
  // doesn't fire "focus": open the favourites again here.
  input.addEventListener('click', () => {
    if (input.value.trim() === '' && list.hidden) showFavourites();
  });
  input.addEventListener('blur', (event) => {
    if (!popupButtons.includes(event.relatedTarget as Element | null)) setOpen(false);
  });
  for (const button of [editButton, randomButton, quizButton]) {
    button.addEventListener('blur', (event) => {
      const next = event.relatedTarget as Element | null;
      if (next !== input && !popupButtons.includes(next)) setOpen(false);
    });
    // Like the options: keep the focus (and the list) while it's pressed.
    button.addEventListener('mousedown', (event) => event.preventDefault());
  }

  editButton.addEventListener('click', () => {
    input.value = '';
    closeList();
    // Phones: put the keyboard away before the editor opens.
    if (COARSE_POINTER.matches) input.blur();
    handlers.onEditFavourites();
  });

  randomButton.addEventListener('click', () => {
    input.value = '';
    closeList();
    if (COARSE_POINTER.matches) input.blur();
    handlers.onRandomPlace();
  });

  quizButton.addEventListener('click', () => {
    input.value = '';
    closeList();
    if (COARSE_POINTER.matches) input.blur();
    handlers.onQuiz();
  });

  // Keep an open favourites list up to date when a star is toggled.
  onFavouritesChange(() => {
    if (!popup.hidden && list.dataset.mode === 'favourites') showFavourites();
  });

  // The form's own submit (e.g. the keyboard's "Search" key) must not reload
  // the page.
  root.addEventListener('submit', (event) => event.preventDefault());
}
