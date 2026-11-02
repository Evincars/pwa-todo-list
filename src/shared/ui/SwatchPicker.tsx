import { Group, UnstyledButton, type MantineColor } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

export interface SwatchPickerProps<T extends string> {
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** Maps a value to a Mantine color or any CSS color. */
  getColor?: (value: T) => MantineColor | string;
  size?: number;
  'aria-label'?: string;
}

/** Row of color swatches (used for list colors). */
export const SwatchPicker = <T extends string>({
  values,
  value,
  onChange,
  getColor = (v) => v,
  size = 32,
  'aria-label': ariaLabel,
}: SwatchPickerProps<T>) => (
  <Group gap="xs" role="radiogroup" aria-label={ariaLabel}>
    {values.map((item) => {
      const color = getColor(item);
      const cssColor = color.startsWith('#') ? color : `var(--mantine-color-${color}-filled)`;
      const selected = item === value;
      return (
        <UnstyledButton
          key={item}
          role="radio"
          aria-checked={selected}
          aria-label={item}
          onClick={() => onChange(item)}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: cssColor,
            display: 'grid',
            placeItems: 'center',
            color: 'white',
            outline: selected ? `2px solid ${cssColor}` : 'none',
            outlineOffset: 2,
            transition: 'transform 120ms ease',
            transform: selected ? 'scale(1.05)' : undefined,
          }}
        >
          {selected && <IconCheck size={size * 0.5} stroke={3} />}
        </UnstyledButton>
      );
    })}
  </Group>
);
