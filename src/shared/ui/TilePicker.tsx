import { ScrollArea, SimpleGrid, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import type { ReactNode } from 'react';
import classes from './TilePicker.module.css';

export interface TileItem<T extends string> {
  value: T;
  /** Accessible name, also shown as tooltip. */
  label: string;
  content: ReactNode;
}

export interface TileGroup<T extends string> {
  label: string;
  items: readonly TileItem<T>[];
}

export interface TilePickerProps<T extends string> {
  groups: readonly TileGroup<T>[];
  value: T;
  onChange: (value: T) => void;
  cols?: number;
  /** Scrolls the grid once it grows taller than this (px). */
  maxHeight?: number;
  'aria-label': string;
}

/** Grouped grid of square, selectable tiles (emoji, icons, stickers…). */
export const TilePicker = <T extends string>({ groups, value, onChange, cols = 8, maxHeight = 260, ...props }: TilePickerProps<T>) => (
  <ScrollArea.Autosize mah={maxHeight} type="auto" offsetScrollbars>
    <Stack gap="sm" role="radiogroup" aria-label={props['aria-label']}>
      {groups.map((group) => (
        <div key={group.label}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>
            {group.label}
          </Text>
          <SimpleGrid cols={cols} spacing={6}>
            {group.items.map((item) => (
              <Tooltip key={item.value} label={item.label} openDelay={500}>
                <UnstyledButton
                  className={classes.tile}
                  role="radio"
                  aria-checked={item.value === value}
                  aria-label={item.label}
                  data-selected={item.value === value || undefined}
                  onClick={() => onChange(item.value)}
                >
                  {item.content}
                </UnstyledButton>
              </Tooltip>
            ))}
          </SimpleGrid>
        </div>
      ))}
    </Stack>
  </ScrollArea.Autosize>
);
