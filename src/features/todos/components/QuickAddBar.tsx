import { ActionIcon, Button, Collapse, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowUp, IconBell, IconCalendarDue, IconCircleDashed, IconX } from '@tabler/icons-react';
import { useRef, useState, type FormEvent, type MouseEvent } from 'react';
import type { CreateTodoInput, ISODateString, Priority } from '@/domain/types';
import { ReminderPicker } from '@/features/reminders/components/ReminderPicker';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { formatDue, formatReminder, NO_DUE, type DueValue } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { suggestReminder } from '@/lib/reminderTime';
import { DueDatePicker } from './DueDatePicker';
import { PriorityMenu } from './PriorityMenu';
import classes from './QuickAddBar.module.css';

export interface QuickAddBarProps {
  onAdd: (input: CreateTodoInput, remindAt: ISODateString | null) => void;
  /** Pre-selected due date (e.g. the day picked in the calendar). */
  defaultDue?: DueValue;
  placeholder?: string;
}

const clearButton = (label: string, onClear: () => void) => (
  <IconX
    size={12}
    aria-label={label}
    onClick={(event: MouseEvent) => {
      event.stopPropagation();
      onClear();
    }}
  />
);

/** Always-visible composer pinned to the bottom – type and hit Enter, optional due date, priority & reminder. */
export const QuickAddBar = ({ onAdd, defaultDue = NO_DUE, placeholder = 'Add a task' }: QuickAddBarProps) => {
  const defaultPriority = useSettingsStore((state) => state.defaultPriority);
  const autoReminder = useSettingsStore((state) => state.autoReminder);
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState<DueValue>(defaultDue);
  const [remindAt, setRemindAt] = useState<ISODateString | null>(null);
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [focused, setFocused] = useState(false);
  const [dueOpened, dueHandlers] = useDisclosure(false);
  const [reminderOpened, reminderHandlers] = useDisclosure(false);

  // Follow the pre-selected day while the user hasn't started typing.
  const [syncedDefault, setSyncedDefault] = useState(defaultDue.dueAt);
  if (syncedDefault !== defaultDue.dueAt) {
    setSyncedDefault(defaultDue.dueAt);
    if (!title) setDue(defaultDue);
  }

  const expanded =
    focused || !!title || dueOpened || reminderOpened || !!due.dueAt || !!remindAt || priority !== defaultPriority;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    const reminder = remindAt ?? (autoReminder ? (suggestReminder(due)?.at.toISOString() ?? null) : null);
    onAdd({ title: title.trim(), priority, ...due }, reminder);
    haptic();
    setTitle('');
    setDue(defaultDue);
    setRemindAt(null);
    setPriority(defaultPriority);
    // Keep the keyboard open for rapid entry.
    inputRef.current?.focus();
  };

  return (
    <form className={classes.root} onSubmit={submit}>
      <div className={classes.inner}>
        <TextInput
          ref={inputRef}
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          aria-label="New task title"
          enterKeyHint="done"
          maxLength={200}
          classNames={{ input: classes.input }}
          leftSection={<IconCircleDashed size={20} />}
          rightSectionWidth={44}
          rightSection={
            <ActionIcon type="submit" variant="filled" radius="xl" size="md" disabled={!title.trim()} aria-label="Add task">
              <IconArrowUp size={18} />
            </ActionIcon>
          }
        />
        <Collapse expanded={expanded}>
          {/* Prevent blur so tapping an option doesn't collapse the bar before the click lands. */}
          <div className={classes.options} onMouseDown={(event) => event.preventDefault()}>
            <DueDatePicker
              value={due}
              onChange={setDue}
              opened={dueOpened}
              onClose={dueHandlers.close}
              target={
                <Button
                  size="compact-sm"
                  radius="xl"
                  variant={due.dueAt ? 'light' : 'default'}
                  leftSection={<IconCalendarDue size={14} />}
                  rightSection={due.dueAt ? clearButton('Clear due date', () => setDue(NO_DUE)) : null}
                  onClick={dueHandlers.toggle}
                >
                  {due.dueAt ? formatDue(due, timeFormat) : 'Due date'}
                </Button>
              }
            />
            <PriorityMenu value={priority} onChange={setPriority} variant="button" />
            <ReminderPicker
              value={remindAt}
              due={due}
              onChange={setRemindAt}
              opened={reminderOpened}
              onClose={reminderHandlers.close}
              target={
                <Button
                  size="compact-sm"
                  radius="xl"
                  variant={remindAt ? 'light' : 'default'}
                  leftSection={<IconBell size={14} />}
                  rightSection={remindAt ? clearButton('Clear reminder', () => setRemindAt(null)) : null}
                  onClick={reminderHandlers.toggle}
                  aria-label={remindAt ? undefined : 'Remind me'}
                >
                  {remindAt ? formatReminder(remindAt, timeFormat) : 'Remind'}
                </Button>
              }
            />
          </div>
        </Collapse>
      </div>
    </form>
  );
};
