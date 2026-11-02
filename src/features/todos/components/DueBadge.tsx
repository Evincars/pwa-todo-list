import { Badge, type BadgeProps } from '@mantine/core';
import { IconAlertCircle, IconCalendar, IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { isOverdue } from '@/domain/todoQuery';
import type { Todo } from '@/domain/types';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { formatDue } from '@/lib/dates';

export interface DueBadgeProps extends Omit<BadgeProps, 'children' | 'color'> {
  todo: Pick<Todo, 'dueAt' | 'dueHasTime' | 'completed'>;
}

export const DueBadge = ({ todo, ...props }: DueBadgeProps) => {
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  if (!todo.dueAt) return null;
  const overdue = isOverdue(todo);
  const today = dayjs(todo.dueAt).isSame(dayjs(), 'day');
  const Icon = overdue ? IconAlertCircle : todo.dueHasTime ? IconClock : IconCalendar;

  return (
    <Badge
      variant={overdue || today ? 'light' : 'transparent'}
      color={todo.completed ? 'gray' : overdue ? 'red' : today ? undefined : 'gray'}
      size="sm"
      radius="sm"
      tt="none"
      fw={500}
      px={overdue || today ? 6 : 0}
      leftSection={<Icon size={12} />}
      {...props}
    >
      {formatDue(todo, timeFormat)}
    </Badge>
  );
};
