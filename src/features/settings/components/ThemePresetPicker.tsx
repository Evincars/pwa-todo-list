import { Text, UnstyledButton } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import { THEME_IDS, THEME_PRESETS, type ThemeId } from '@/theme/presets';
import classes from './ThemePresetPicker.module.css';

export interface ThemePresetPickerProps {
  value: ThemeId;
  onChange: (themeId: ThemeId) => void;
}

/** Visual theme chooser – each tile previews the light and dark variant. */
export const ThemePresetPicker = ({ value, onChange }: ThemePresetPickerProps) => (
  <div className={classes.grid} role="radiogroup" aria-label="Theme">
    {THEME_IDS.map((id) => {
      const { label, description, preview } = THEME_PRESETS[id];
      const selected = id === value;
      return (
        <UnstyledButton
          key={id}
          role="radio"
          aria-checked={selected}
          title={description}
          className={classes.tile}
          data-selected={selected || undefined}
          onClick={() => onChange(id)}
          style={{ '--tile-accent': preview.accent } as CSSProperties}
        >
          <div className={classes.preview}>
            {[preview.light, preview.dark].map((background, index) => (
              <div key={index} className={classes.half} style={{ background }}>
                <div className={classes.bar} style={{ background: preview.accent, width: '70%' }} />
                <div className={classes.bar} style={{ background: index ? '#ffffff33' : '#00000018', width: '90%' }} />
                <div className={classes.bar} style={{ background: index ? '#ffffff33' : '#00000018', width: '55%' }} />
              </div>
            ))}
            {selected && (
              <span className={classes.check}>
                <IconCheck size={12} stroke={3} />
              </span>
            )}
          </div>
          <Text size="xs" fw={selected ? 600 : 500} ta="center">
            {label}
          </Text>
        </UnstyledButton>
      );
    })}
  </div>
);
