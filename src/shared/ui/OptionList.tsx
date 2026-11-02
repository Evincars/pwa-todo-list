import { Stack, Text, UnstyledButton, type MantineColor } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { CSSProperties, ReactNode } from 'react';
import classes from './OptionList.module.css';

export interface OptionItem<T> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Text shown on the right (e.g. resolved date). */
  hint?: ReactNode;
  color?: MantineColor;
  disabled?: boolean;
}

export interface OptionListProps<T> {
  options: readonly OptionItem<T>[];
  value?: T | null;
  onSelect: (value: T) => void;
  /** Show a check mark next to the selected option. */
  withCheck?: boolean;
}

/** Vertical list of tappable options – typed by the option value. */
export const OptionList = <T,>({ options, value, onSelect, withCheck = false }: OptionListProps<T>) => (
  <Stack gap={2} role="listbox">
    {options.map((option, index) => {
      const selected = value !== undefined && value !== null && option.value === value;
      return (
        <UnstyledButton
          key={index}
          role="option"
          aria-selected={selected}
          className={classes.option}
          data-selected={selected || undefined}
          disabled={option.disabled}
          onClick={() => onSelect(option.value)}
          style={option.color ? ({ '--option-color': `var(--mantine-color-${option.color}-filled)` } as CSSProperties) : undefined}
        >
          {option.icon && <span className={classes.icon}>{option.icon}</span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500}>
              {option.label}
            </Text>
            {option.description && (
              <Text size="xs" c="dimmed">
                {option.description}
              </Text>
            )}
          </div>
          {option.hint && (
            <Text size="xs" c="dimmed">
              {option.hint}
            </Text>
          )}
          {withCheck && selected && <IconCheck size={16} color="var(--mantine-primary-color-filled)" />}
        </UnstyledButton>
      );
    })}
  </Stack>
);
