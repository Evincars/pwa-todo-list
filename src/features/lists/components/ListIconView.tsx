import type { CSSProperties } from 'react';
import type { ListColor, ListIcon } from '@/domain/types';
import { listColorVar, resolveListIcon } from '../listIcons';

export interface ListIconViewProps {
  icon: ListIcon;
  /** Tint of vector glyphs (emoji keep their own colors). */
  color?: ListColor;
  size?: number;
  style?: CSSProperties;
}

/** Renders a list icon token – an emoji or a tinted vector glyph. */
export const ListIconView = ({ icon, color, size = 22, style }: ListIconViewProps) => {
  const resolved = resolveListIcon(icon);
  if (resolved.kind === 'emoji') {
    return (
      <span aria-hidden style={{ fontSize: size, lineHeight: 1, ...style }}>
        {resolved.emoji}
      </span>
    );
  }
  const Glyph = resolved.icon;
  return <Glyph aria-hidden size={size * 1.05} color={listColorVar(color)} style={{ flexShrink: 0, ...style }} />;
};
