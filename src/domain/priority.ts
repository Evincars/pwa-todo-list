import type { MantineColor } from '@mantine/core';
import type { Priority } from './types';

/** Display names are translated by the UI (`priority.<value>`). */
export interface PriorityMeta {
  color: MantineColor;
  /** Higher = more important; used for sorting. */
  weight: number;
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  urgent: { color: 'red', weight: 4 },
  high: { color: 'orange', weight: 3 },
  medium: { color: 'yellow', weight: 2 },
  low: { color: 'blue', weight: 1 },
  none: { color: 'gray', weight: 0 },
};

/** Priorities ordered from most to least important. */
export const PRIORITY_ORDER: readonly Priority[] = ['urgent', 'high', 'medium', 'low', 'none'];

export const isHighlighted = (priority: Priority): boolean => PRIORITY_META[priority].weight >= 3;
