import type { RoadConditions } from './digitraffic';

/**
 * Fintraffic's road conditions for the place shown (Finland only): the
 * nearest main road's, null when none is within reach, 'failed' when the
 * service couldn't be reached. Undefined: not asked (yet).
 */
export type RoadState = RoadConditions | null | 'failed';
