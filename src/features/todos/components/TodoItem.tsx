import { Group, Text } from '@mantine/core';
import { IconBell, IconNote } from '@tabler/icons-react';
import { memo, type CSSProperties } from 'react';
import { isHighlighted, PRIORITY_META } from '@/domain/priority';
import type { Priority, Reminder, Todo } from '@/domain/types';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { formatReminder } from '@/lib/dates';
import { useTranslation } from '@/i18n';
import { CheckCircle, HighlightedText, UserAvatar } from '@/shared/ui';
import { DueBadge } from './DueBadge';
import { PriorityMenu } from './PriorityMenu';
import classes from './TodoItem.module.css';

export interface TodoItemProps {
  todo: Todo;
  canWrite: boolean;
  /** Show who created the task (shared lists). */
  showAuthor: boolean;
  pending?: boolean;
  /** Personal reminder, shown while it hasn't fired. */
  reminder?: Reminder;
  /** Title characters matched by the search. */
  matches?: readonly number[];
  onToggle: (todo: Todo, completed: boolean) => void;
  onOpen: (todo: Todo) => void;
  onPriorityChange: (todo: Todo, priority: Priority) => void;
}

export const TodoItem = memo(({ todo, canWrite, showAuthor, pending, reminder, matches, onToggle, onOpen, onPriorityChange }: TodoItemProps) => {
  const { t } = useTranslation();
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const meta = PRIORITY_META[todo.priority];
  const highlight = !todo.completed && isHighlighted(todo.priority);

  return (
    <div
      className={classes.item}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(todo)}
      onKeyDown={(event) => event.key === 'Enter' && onOpen(todo)}
      data-completed={todo.completed || undefined}
      data-highlight={highlight || undefined}
      data-pending={pending || undefined}
      style={
        todo.priority !== 'none' ? ({ '--priority-color': `var(--mantine-color-${meta.color}-filled)` } as CSSProperties) : undefined
      }
    >
      <CheckCircle
        checked={todo.completed}
        onChange={(checked) => onToggle(todo, checked)}
        disabled={!canWrite}
        color={todo.priority !== 'none' ? meta.color : undefined}
        label={todo.completed ? t('todos.uncomplete', { title: todo.title }) : t('todos.complete', { title: todo.title })}
      />
      <div className={classes.content}>
        <Text size="sm" fw={highlight ? 600 : 500} className={classes.title}>
          <HighlightedText text={todo.title} indices={matches} />
        </Text>
        <div className={classes.meta}>
          {todo.dueAt && <DueBadge todo={todo} />}
          {reminder && !reminder.firedAt && !todo.completed && (
            <Group gap={2} wrap="nowrap" aria-label={t('todos.reminder')}>
              <IconBell size={12} />
              <span>{formatReminder(reminder.remindAt, timeFormat)}</span>
            </Group>
          )}
          {todo.notes && <IconNote size={14} aria-label={t('todos.hasNotes')} />}
          {showAuthor && (
            <Group gap={4} wrap="nowrap">
              <UserAvatar user={todo.createdBy} size={14} />
              <span>{todo.createdBy.displayName.split(' ')[0]}</span>
            </Group>
          )}
        </div>
      </div>
      {!todo.completed && (
        <div onClick={(event) => event.stopPropagation()}>
          <PriorityMenu value={todo.priority} onChange={(priority) => onPriorityChange(todo, priority)} disabled={!canWrite} />
        </div>
      )}
    </div>
  );
});
TodoItem.displayName = 'TodoItem';
