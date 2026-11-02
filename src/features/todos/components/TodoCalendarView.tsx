import { Anchor, EmptyState, Group, Stack, Text } from '@mantine/core';
import { IconCalendarCheck } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useMemo, type ReactNode } from 'react';
import { PRIORITY_META } from '@/domain/priority';
import { groupTodosByDay, topPriority } from '@/domain/todoQuery';
import type { Todo } from '@/domain/types';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { useTranslation } from '@/i18n';
import { capitalize, formatDate, relativeDay } from '@/lib/dates';
import { AgendaCalendar, type CalendarDayMeta, type CalendarSpan } from '@/shared/ui';

export interface TodoCalendarViewProps {
  todos: readonly Todo[];
  /** Selected day, `YYYY-MM-DD`. */
  day: string;
  onDayChange: (day: string) => void;
  span: CalendarSpan;
  onSpanChange: (span: CalendarSpan) => void;
  showCompleted: boolean;
  canWrite: boolean;
  renderItem: (todo: Todo) => ReactNode;
  onShowUnscheduled: () => void;
}

/** Calendar with per-day task counts and the agenda of the selected day below it. */
export const TodoCalendarView = ({
  todos,
  day,
  onDayChange,
  span,
  onSpanChange,
  showCompleted,
  canWrite,
  renderItem,
  onShowUnscheduled,
}: TodoCalendarViewProps) => {
  const { t } = useTranslation();
  const weekStartsOn = useSettingsStore((state) => state.weekStartsOn);
  const days = useMemo(() => groupTodosByDay(todos), [todos]);
  const today = dayjs().format('YYYY-MM-DD');

  const getDayMeta = (key: string): CalendarDayMeta | undefined => {
    const entry = days.get(key);
    if (!entry?.active.length) return undefined;
    const overdue = key < today;
    const priority = topPriority(entry.active);
    return {
      count: entry.active.length,
      color: overdue ? 'red' : priority === 'none' ? undefined : PRIORITY_META[priority].color,
      label: t(overdue ? 'calendar.overdueTasks' : 'calendar.tasks', { count: entry.active.length }),
    };
  };

  const selected = days.get(day);
  const active = selected?.active ?? [];
  const completed = showCompleted ? (selected?.completed ?? []) : [];
  const unscheduled = todos.filter((todo) => !todo.dueAt && !todo.completed).length;
  const date = dayjs(day);
  const relative = date.isBefore(dayjs(), 'day') ? null : relativeDay(date);
  const dateLabel = capitalize(formatDate(date, 'agendaDay'));

  return (
    <Stack gap="sm">
      <AgendaCalendar
        value={day}
        onChange={onDayChange}
        span={span}
        onSpanChange={onSpanChange}
        weekStartsOn={weekStartsOn}
        getDayMeta={getDayMeta}
      />

      <Group justify="space-between" px={4} mt={4}>
        <Text fw={600} size="sm">
          {relative ? t('calendar.relative', { relative, date: dateLabel }) : dateLabel}
        </Text>
        {active.length > 0 && (
          <Text size="xs" c="dimmed">
            {t('calendar.tasks', { count: active.length })}
          </Text>
        )}
      </Group>

      {active.length === 0 && completed.length === 0 ? (
        <EmptyState
          icon={<IconCalendarCheck />}
          variant="light"
          color="gray"
          title={t('calendar.nothingPlanned')}
          description={canWrite && day >= today ? t('calendar.plannedHint') : undefined}
          py="md"
        />
      ) : (
        <Stack gap={6}>
          {active.map(renderItem)}
          {completed.map(renderItem)}
        </Stack>
      )}

      {unscheduled > 0 && (
        <Text size="xs" c="dimmed" ta="center" mt="xs">
          {t('calendar.withoutDate', { count: unscheduled })} ·{' '}
          <Anchor component="button" size="xs" onClick={onShowUnscheduled}>
            {t('calendar.showInList')}
          </Anchor>
        </Text>
      )}
    </Stack>
  );
};
