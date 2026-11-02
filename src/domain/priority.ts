import type { MantineColor } from '@mantine/core';
import type { Priority } from './types';

export interface PriorityMeta {
  label: string;
  shortLabel: string;
  color: MantineColor;
  /** Higher = more important; used for sorting. */
  weight: number;
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  urgent: { label: 'Urgent', shortLabel: 'P1', color: 'red', weight: 4 },
  high: { label: 'High', shortLabel: 'P2', color: 'orange', weight: 3 },
  medium: { label: 'Medium', shortLabel: 'P3', color: 'yellow', weight: 2 },
  low: { label: 'Low', shortLabel: 'P4', color: 'blue', weight: 1 },
  none: { label: 'No priority', shortLabel: '—', color: 'gray', weight: 0 },
};

/** Priorities ordered from most to least important. */
export const PRIORITY_ORDER: readonly Priority[] = ['urgent', 'high', 'medium', 'low', 'none'];

export const isHighlighted = (priority: Priority): boolean => PRIORITY_META[priority].weight >= 3;
