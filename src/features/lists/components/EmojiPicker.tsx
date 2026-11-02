import { SimpleGrid, UnstyledButton } from '@mantine/core';

export const LIST_EMOJIS = ['📝', '✅', '🛒', '🏠', '💼', '🎯', '📚', '💪', '✈️', '🎉', '🍳', '💡', '🧹', '🎁', '🌱', '❤️'] as const;

export interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  emojis?: readonly string[];
}

export const EmojiPicker = ({ value, onChange, emojis = LIST_EMOJIS }: EmojiPickerProps) => (
  <SimpleGrid cols={8} spacing={6} role="radiogroup" aria-label="Icon">
    {emojis.map((emoji) => (
      <UnstyledButton
        key={emoji}
        role="radio"
        aria-checked={emoji === value}
        onClick={() => onChange(emoji)}
        fz={22}
        style={{
          aspectRatio: '1',
          display: 'grid',
          placeItems: 'center',
          borderRadius: 'var(--mantine-radius-md)',
          background: emoji === value ? 'var(--mantine-primary-color-light)' : 'var(--mantine-color-default)',
          outline: emoji === value ? '2px solid var(--mantine-primary-color-filled)' : undefined,
        }}
      >
        {emoji}
      </UnstyledButton>
    ))}
  </SimpleGrid>
);
