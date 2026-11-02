import { SegmentedControl, Stack } from '@mantine/core';
import { useState } from 'react';
import type { ListColor, ListIcon } from '@/domain/types';
import { useTranslation } from '@/i18n';
import { TilePicker, type TileGroup } from '@/shared/ui';
import { EMOJI_GROUPS, GLYPH_GROUPS, glyphIcon, isGlyphIcon } from '../listIcons';
import { ListIconView } from './ListIconView';

type IconTab = 'emoji' | 'glyph';

export interface ListIconPickerProps {
  value: ListIcon;
  onChange: (icon: ListIcon) => void;
  /** Glyphs are previewed in the list color. */
  color: ListColor;
}

/** Emoji or monochrome glyphs (dark, metal, hazard…), grouped and scrollable. */
export const ListIconPicker = ({ value, onChange, color }: ListIconPickerProps) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<IconTab>(isGlyphIcon(value) ? 'glyph' : 'emoji');

  const emojiTiles: TileGroup<ListIcon>[] = EMOJI_GROUPS.map((group) => ({
    label: t(`icons.groups.${group.key}`),
    items: group.items.map((emoji) => ({ value: emoji, label: emoji, content: emoji })),
  }));
  const glyphTiles: TileGroup<ListIcon>[] = GLYPH_GROUPS.map((group) => ({
    label: t(`icons.groups.${group.key}`),
    items: group.items.map((item) => {
      const icon = glyphIcon(item.id);
      return { value: icon, label: t(`icons.glyphs.${item.id}`), content: <ListIconView icon={icon} color={color} size={22} /> };
    }),
  }));

  return (
    <Stack gap="xs">
      <SegmentedControl<IconTab>
        size="xs"
        fullWidth
        value={tab}
        onChange={setTab}
        data={[
          { value: 'emoji', label: t('icons.tabs.emoji') },
          { value: 'glyph', label: t('icons.tabs.glyph') },
        ]}
      />
      <TilePicker
        key={tab}
        aria-label={t('icons.aria')}
        groups={tab === 'emoji' ? emojiTiles : glyphTiles}
        value={value}
        onChange={onChange}
        maxHeight={232}
      />
    </Stack>
  );
};
