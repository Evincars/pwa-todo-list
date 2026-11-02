import { UnstyledButton, type MantineColor } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import classes from './CheckCircle.module.css';

export interface CheckCircleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: MantineColor;
  size?: number;
  disabled?: boolean;
  label: string;
}

/** Round, animated completion toggle (Microsoft To Do / Reminders style). */
export const CheckCircle = ({ checked, onChange, color, size = 24, disabled, label }: CheckCircleProps) => (
  <UnstyledButton
    className={classes.root}
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    data-checked={checked || undefined}
    disabled={disabled}
    onClick={(event) => {
      event.stopPropagation();
      onChange(!checked);
    }}
    style={
      {
        '--check-size': `${size}px`,
        ...(color && { '--check-color': `var(--mantine-color-${color}-filled)` }),
      } as CSSProperties
    }
  >
    <IconCheck size={size * 0.6} stroke={3} />
  </UnstyledButton>
);
