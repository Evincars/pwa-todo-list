import { Button, Chip, Divider, Drawer, Group, Input, Stack, Text, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell, IconCalendarDue, IconTrash, IconX } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { PRIORITY_META, PRIORITY_ORDER } from '@/domain/priority';
import type { ISODateString, Priority, Reminder, Todo, UpdateTodoInput } from '@/domain/types';
import { ReminderPicker } from '@/features/reminders/components/ReminderPicker';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { formatDue, formatReminder, NO_DUE } from '@/lib/dates';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { BottomSheet, CheckCircle } from '@/shared/ui';
import { DueDatePicker } from './DueDatePicker';
import { PriorityFlag } from './PriorityMenu';

export interface TodoDetailsSheetProps {
  todo: Todo | undefined;
  canWrite: boolean;
  onClose: () => void;
  onUpdate: (todo: Todo, input: UpdateTodoInput) => void;
  onDelete: (todo: Todo) => void;
  /** The current user's personal reminder of the task. */
  reminder: Reminder | undefined;
  onReminderChange: (todo: Todo, remindAt: ISODateString | null) => void;
}

const TodoDetails = ({
  todo,
  canWrite,
  onUpdate,
  onDelete,
  reminder,
  onReminderChange,
}: Omit<TodoDetailsSheetProps, 'todo' | 'onClose'> & { todo: Todo }) => {
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const [title, setTitle] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes);
  const [dueOpened, dueHandlers] = useDisclosure(false);
  const [reminderOpened, reminderHandlers] = useDisclosure(false);
  const reminderPassed = !!reminder && (!!reminder.firedAt || dayjs(reminder.remindAt).isBefore(dayjs()));

  const update = (input: UpdateTodoInput) => canWrite && onUpdate(todo, input);

  const commitTitle = () => {
    const next = title.trim();
    if (!next) setTitle(todo.title);
    else if (next !== todo.title) update({ title: next });
  };

  const commitNotes = () => notes !== todo.notes && update({ notes });

  return (
    <Stack gap="md">
      <Group align="flex-start" wrap="nowrap" gap="sm">
        <div style={{ paddingTop: 6 }}>
          <CheckCircle
            checked={todo.completed}
            onChange={(completed) => update({ completed })}
            disabled={!canWrite}
            size={26}
            color={todo.priority !== 'none' ? PRIORITY_META[todo.priority].color : undefined}
            label="Completed"
          />
        </div>
        <Textarea
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          onBlur={commitTitle}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          readOnly={!canWrite}
          autosize
          minRows={1}
          maxLength={200}
          variant="unstyled"
          aria-label="Title"
          style={{ flex: 1 }}
          styles={{
            input: {
              fontSize: 'var(--mantine-font-size-lg)',
              fontWeight: 600,
              textDecoration: todo.completed ? 'line-through' : undefined,
            },
          }}
        />
      </Group>

      <Input.Wrapper label="Priority">
        <Chip.Group<false, Priority> value={todo.priority} onChange={(priority) => update({ priority })}>
          <Group gap={6} mt={6}>
            {PRIORITY_ORDER.map((priority) => (
              <Chip
                key={priority}
                value={priority}
                size="sm"
                color={PRIORITY_META[priority].color}
                variant="light"
                disabled={!canWrite}
                icon={<PriorityFlag priority={priority} size={12} />}
              >
                {PRIORITY_META[priority].label}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Input.Wrapper>

      <Input.Wrapper label="Due">
        <Group gap="xs" mt={6}>
          <DueDatePicker
            value={todo}
            onChange={(due) => update(due)}
            opened={dueOpened}
            onClose={dueHandlers.close}
            target={
              <Button
                variant={todo.dueAt ? 'light' : 'default'}
                leftSection={<IconCalendarDue size={16} />}
                onClick={dueHandlers.toggle}
                disabled={!canWrite}
              >
                {todo.dueAt ? formatDue(todo, timeFormat) : 'Add due date'}
              </Button>
            }
          />
          {todo.dueAt && canWrite && (
            <Button variant="subtle" color="gray" px="xs" onClick={() => update(NO_DUE)} aria-label="Remove due date">
              <IconX size={16} />
            </Button>
          )}
        </Group>
      </Input.Wrapper>

      <Input.Wrapper label="Remind me" description="Personal – other members aren't notified">
        <Group gap="xs" mt={6}>
          <ReminderPicker
            value={reminder?.remindAt ?? null}
            due={todo}
            onChange={(remindAt) => onReminderChange(todo, remindAt)}
            opened={reminderOpened}
            onClose={reminderHandlers.close}
            target={
              <Button
                variant={reminder && !reminderPassed ? 'light' : 'default'}
                color={reminderPassed ? 'gray' : undefined}
                leftSection={<IconBell size={16} />}
                onClick={reminderHandlers.toggle}
                td={reminderPassed ? 'line-through' : undefined}
              >
                {reminder ? formatReminder(reminder.remindAt, timeFormat) : 'Add reminder'}
              </Button>
            }
          />
          {reminder && (
            <Button variant="subtle" color="gray" px="xs" onClick={() => onReminderChange(todo, null)} aria-label="Remove reminder">
              <IconX size={16} />
            </Button>
          )}
        </Group>
      </Input.Wrapper>

      <Textarea
        label="Notes"
        placeholder={canWrite ? 'Add a note' : 'No notes'}
        value={notes}
        onChange={(event) => setNotes(event.currentTarget.value)}
        onBlur={commitNotes}
        readOnly={!canWrite}
        autosize
        minRows={3}
        maxRows={10}
      />

      <Divider />

      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            Created by {todo.createdBy.displayName} · {dayjs(todo.createdAt).format('D MMM YYYY, HH:mm')}
          </Text>
          {todo.completedAt && (
            <Text size="xs" c="dimmed">
              Completed {dayjs(todo.completedAt).format('D MMM, HH:mm')}
            </Text>
          )}
        </Stack>
        {canWrite && (
          <Button variant="subtle" color="red" leftSection={<IconTrash size={16} />} onClick={() => onDelete(todo)}>
            Delete
          </Button>
        )}
      </Group>
    </Stack>
  );
};

/** Task details: right panel on desktop (like To Do), bottom sheet on phones. Edits auto-save. */
export const TodoDetailsSheet = ({ todo, onClose, ...props }: TodoDetailsSheetProps) => {
  const isMobile = useIsMobile();
  // Keep showing the last todo during the close transition.
  const [lastTodo, setLastTodo] = useState(todo);
  if (todo && todo !== lastTodo) setLastTodo(todo);
  const shown = todo ?? lastTodo;

  const content = shown && <TodoDetails key={shown.id} todo={shown} {...props} />;
  const title = props.canWrite ? 'Task details' : 'Task details (view only)';

  return isMobile ? (
    <BottomSheet opened={!!todo} onClose={onClose} title={title}>
      {content}
    </BottomSheet>
  ) : (
    <Drawer opened={!!todo} onClose={onClose} position="right" size={420} title={title}>
      {content}
    </Drawer>
  );
};
