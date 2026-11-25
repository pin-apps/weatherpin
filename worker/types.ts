// What the broker sends the app (src/ imports these types too).

export type FmiLanguage = 'en' | 'fi' | 'sv';

export interface FmiWarningText {
  /** E.g. "Wind warning for sea areas". */
  event: string;
  headline?: string;
  description: string;
  instruction?: string;
  /** Area names, e.g. ["Gulf of Finland"]. */
  areas: string[];
}

export interface FmiWarning {
  /** The CAP file's path under https://alerts.fmi.fi/cap/ (never changes). */
  id: string;
  level: 'yellow' | 'orange' | 'red';
  /** ISO times with offset, as FMI gives them. */
  onset?: string;
  expires?: string;
  /** Per language; FMI sends English, Finnish and Swedish. */
  texts: Partial<Record<FmiLanguage, FmiWarningText>>;
  /**
   * The areas' outlines, each a closed ring as flat [lat, lng, lat, lng, …]
   * in units of 0.005° (about 500 m): simplified, and small to send.
   */
  polygons: number[][];
  /** Around all the polygons. */
  box: Box;
}

export interface FmiWarningList {
  /** When the broker last read FMI's list (ISO). */
  updated: string;
  /** True when FMI couldn't be reached and this is the last good list. */
  stale?: boolean;
  /** Ids of the warnings in effect (see FmiWarning.id). */
  ids: string[];
  /**
   * Bounding boxes of the warnings the broker has already read, so the app
   * can skip those nowhere near its point. Missing: not read yet (fetch it);
   * null: nothing to show (a cancellation).
   */
  boxes?: Record<string, Box | null>;
}

/** [south, west, north, east] in polygon units (see GRID). */
export type Box = [number, number, number, number];

/** Polygon units per degree (0.005° grid). */
export const GRID = 200;
