import { ActionIcon, Button, Group, Text, UnstyledButton, type MantineColor } from '@mantine/core';
import { IconChevronDown, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import dayjs, { type Dayjs } from 'dayjs';
import { useRef, type CSSProperties, type PointerEvent } from 'react';
import classes from './AgendaCalendar.module.css';

export type CalendarSpan = 'week' | 'month';

export interface CalendarDayMeta {
  /** Number shown in the bubble (hidden when 0). */
  count: number;
  /** Bubble color, defaults to the primary color. */
  color?: MantineColor;
  /** Accessible description of the count, e.g. "2 tasks". */
  label?: string;
}

export interface AgendaCalendarProps {
  /** Selected day, `YYYY-MM-DD`. Navigation moves the selection. */
  value: string;
  onChange: (date: string) => void;
  span: CalendarSpan;
  onSpanChange: (span: CalendarSpan) => void;
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1;
  getDayMeta?: (date: string) => CalendarDayMeta | undefined;
}

const FORMAT = 'YYYY-MM-DD';
const SWIPE_THRESHOLD = 48;

const startOfWeek = (date: Dayjs, weekStartsOn: 0 | 1) => {
  const offset = (date.day() - weekStartsOn + 7) % 7;
  return date.subtract(offset, 'day').startOf('day');
};

const visibleDays = (selected: Dayjs, span: CalendarSpan, weekStartsOn: 0 | 1): Dayjs[] => {
  if (span === 'week') {
    const start = startOfWeek(selected, weekStartsOn);
    return Array.from({ length: 7 }, (_, index) => start.add(index, 'day'));
  }
  const start = startOfWeek(selected.startOf('month'), weekStartsOn);
  const end = selected.endOf('month');
  const weeks = Math.ceil((end.diff(start, 'day') + 1) / 7);
  return Array.from({ length: weeks * 7 }, (_, index) => start.add(index, 'day'));
};

/**
 * Compact agenda calendar: a swipeable week strip that expands into a month grid.
 * Days can carry a count bubble (events, tasks…). Data-agnostic via `getDayMeta`.
 */
export const AgendaCalendar = ({ value, onChange, span, onSpanChange, weekStartsOn = 1, getDayMeta }: AgendaCalendarProps) => {
  const selected = dayjs(value);
  const today = dayjs();
  const days = visibleDays(selected, span, weekStartsOn);
  const swipeStart = useRef<number | null>(null);

  const move = (direction: 1 | -1) => onChange(selected.add(direction, span).format(FORMAT));

  const handlePointerDown = (event: PointerEvent) => {
    swipeStart.current = event.clientX;
  };
  const handlePointerUp = (event: PointerEvent) => {
    if (swipeStart.current === null) return;
    const dx = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) move(dx < 0 ? 1 : -1);
  };

  const title = span === 'month' || days[0]!.isSame(days[6]!, 'month') ? selected.format('MMMM YYYY') : `${days[0]!.format('MMM')} – ${days[6]!.format('MMM YYYY')}`;
  const isTodayVisible = days.some((day) => day.isSame(today, 'day'));

  return (
    <div className={classes.root}>
      <Group justify="space-between" wrap="nowrap" gap="xs" mb={4}>
        <Text fw={600} size="sm" pl={4}>
          {title}
        </Text>
        <Group gap={2} wrap="nowrap">
          {(!isTodayVisible || !selected.isSame(today, 'day')) && (
            <Button size="compact-xs" variant="subtle" onClick={() => onChange(today.format(FORMAT))}>
              Today
            </Button>
          )}
          <ActionIcon variant="subtle" color="gray" onClick={() => move(-1)} aria-label={`Previous ${span}`}>
            <IconChevronLeft size={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" onClick={() => move(1)} aria-label={`Next ${span}`}>
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
      </Group>

      <div className={classes.grid} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => (swipeStart.current = null)}>
        {days.slice(0, 7).map((day) => (
          <Text key={`h-${day.day()}`} className={classes.weekday} aria-hidden>
            {day.format('dd')}
          </Text>
        ))}
        {days.map((day) => {
          const key = day.format(FORMAT);
          const meta = getDayMeta?.(key);
          const count = meta?.count ?? 0;
          const isSelected = day.isSame(selected, 'day');
          return (
            <UnstyledButton
              key={key}
              className={classes.day}
              onClick={() => onChange(key)}
              data-selected={isSelected || undefined}
              data-today={day.isSame(today, 'day') || undefined}
              data-outside={(span === 'month' && !day.isSame(selected, 'month')) || undefined}
              aria-pressed={isSelected}
              aria-label={`${day.format('dddd, D MMMM')}${count ? `, ${meta?.label ?? count}` : ''}`}
              style={meta?.color ? ({ '--count-color': `var(--mantine-color-${meta.color}-filled)` } as CSSProperties) : undefined}
            >
              <span className={classes.number}>{day.date()}</span>
              <span className={classes.count} data-empty={!count || undefined}>
                {count > 99 ? '99+' : count || ''}
              </span>
            </UnstyledButton>
          );
        })}
      </div>

      <UnstyledButton
        className={classes.handle}
        onClick={() => onSpanChange(span === 'week' ? 'month' : 'week')}
        aria-label={span === 'week' ? 'Show whole month' : 'Show one week'}
        aria-expanded={span === 'month'}
      >
        <IconChevronDown size={16} style={{ transform: span === 'month' ? 'rotate(180deg)' : undefined }} />
      </UnstyledButton>
    </div>
  );
};
