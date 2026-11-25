// Small, safe wrapper around the browser's localStorage. Everything the app
// keeps on the device (favourites, the unit setting) goes through here.
// Nothing leaves the device: no cookies, no server.
//
// Storage can fail in many ways (private modes, privacy settings, a full
// disk), and some browsers throw just for touching `localStorage`. Every
// function here catches that and reports "nothing stored" or "not saved".

const PREFIX = 'nordic-weather:';

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

/** localStorage, or null when the browser blocks it. */
function storage(): Storage | null {
  try {
    const store = window.localStorage;
    const probe = `${PREFIX}probe`;
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

/** Whether anything can be saved at all in this browser. */
export function storageAvailable(): boolean {
  return storage() !== null;
}

/** The parsed JSON stored under `key`; undefined if missing or damaged. */
export function readStored(key: string): unknown {
  try {
    const raw = storage()?.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as unknown) : undefined;
  } catch {
    return undefined;
  }
}

/** Saves `data` as JSON under `key`; false if the browser wouldn't save it. */
export function writeStored(key: string, data: unknown): boolean {
  try {
    const store = storage();
    if (!store) return false;
    store.setItem(PREFIX + key, JSON.stringify(data));
    notify(key);
    return true;
  } catch {
    // E.g. storage full.
    return false;
  }
}

/** Removes everything the app saved on this device. */
export function clearAllStored(): boolean {
  try {
    const store = storage();
    if (!store) return false;
    const keys = Object.keys(store).filter((key) => key.startsWith(PREFIX));
    keys.forEach((key) => store.removeItem(key));
    keys.forEach((key) => notify(key.slice(PREFIX.length)));
    return true;
  } catch {
    return false;
  }
}

/** Calls `listener` whenever `key` changes, in this tab or another one. */
export function onStoredChange(key: string, listener: Listener): void {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(listener);
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

// Another tab of the app saved something: tell this tab's listeners.
window.addEventListener('storage', (event) => {
  if (event.key?.startsWith(PREFIX)) notify(event.key.slice(PREFIX.length));
});
