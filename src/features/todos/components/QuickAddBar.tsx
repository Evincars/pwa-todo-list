import { ActionIcon, Button, Collapse, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowUp, IconCalendarDue, IconCircleDashed, IconX } from '@tabler/icons-react';
import { useRef, useState, type FormEvent } from 'react';
import type { CreateTodoInput, Priority } from '@/domain/types';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { formatDue, NO_DUE, type DueValue } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { DueDatePicker } from './DueDatePicker';
import { PriorityMenu } from './PriorityMenu';
import classes from './QuickAddBar.module.css';

export interface QuickAddBarProps {
  onAdd: (input: CreateTodoInput) => void;
}

/** Always-visible composer pinned to the bottom – type and hit Enter, optional due date & priority. */
export const QuickAddBar = ({ onAdd }: QuickAddBarProps) => {
  const defaultPriority = useSettingsStore((state) => state.defaultPriority);
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState<DueValue>(NO_DUE);
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [focused, setFocused] = useState(false);
  const [dueOpened, dueHandlers] = useDisclosure(false);

  const expanded = focused || !!title || dueOpened || !!due.dueAt || priority !== defaultPriority;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), priority, ...due });
    haptic();
    setTitle('');
    setDue(NO_DUE);
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
          placeholder="Add a task"
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
                  rightSection={
                    due.dueAt ? (
                      <IconX
                        size={12}
                        aria-label="Clear due date"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDue(NO_DUE);
                        }}
                      />
                    ) : null
                  }
                  onClick={dueHandlers.toggle}
                >
                  {due.dueAt ? formatDue(due, timeFormat) : 'Due date'}
                </Button>
              }
            />
            <PriorityMenu value={priority} onChange={setPriority} variant="button" />
          </div>
        </Collapse>
      </div>
    </form>
  );
};
