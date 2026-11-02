import { Divider } from '@mantine/core';
import { IconBellOff, IconCalendarMonth, IconCalendarEvent, IconClockHour4, IconSparkles, IconSunset2 } from '@tabler/icons-react';
import dayjs, { type Dayjs } from 'dayjs';
import { useState, type ReactElement, type ReactNode } from 'react';
import type { ISODateString } from '@/domain/types';
import { DateTimeSelector, type DateTimeSelection } from '@/features/todos/components/DateTimeSelector';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { formatTime, type DueValue } from '@/lib/dates';
import { getQuickReminderOptions, suggestReminder, type QuickReminderKey } from '@/lib/reminderTime';
import { OptionList, ResponsiveOverlay, type OptionItem } from '@/shared/ui';

const QUICK_ICONS: Record<QuickReminderKey, ReactNode> = {
  laterToday: <IconClockHour4 size={18} />,
  tomorrow: <IconSunset2 size={18} />,
  nextWeek: <IconCalendarEvent size={18} />,
};

type PickerAction = { type: 'at'; at: Dayjs } | { type: 'custom' } | { type: 'clear' };

export interface ReminderPickerProps {
  value: ISODateString | null;
  /** Due date of the task – drives the suggested default. */
  due: DueValue;
  onChange: (remindAt: ISODateString | null) => void;
  opened: boolean;
  onClose: () => void;
  /** Anchor element (must forward its ref). */
  target: ReactElement;
}

/** "Remind me": suggested time from the due date, MS To Do quick picks, or a custom date + clock dial. */
export const ReminderPicker = ({ value, due, onChange, opened, onClose, target }: ReminderPickerProps) => {
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const [view, setView] = useState<'quick' | 'custom'>('quick');

  const close = () => {
    onClose();
    setView('quick');
  };
  const commit = (next: ISODateString | null) => {
    onChange(next);
    close();
  };

  const now = dayjs();
  const hint = (date: Dayjs) => (date.isSame(now, 'day') ? formatTime(date, timeFormat) : `${date.format('ddd')} ${formatTime(date, timeFormat)}`);
  const suggestion = suggestReminder(due, now);

  const options: OptionItem<PickerAction>[] = [];
  if (suggestion) {
    options.push({
      value: { type: 'at', at: suggestion.at },
      label: suggestion.label,
      description: 'Suggested from the due date',
      icon: <IconSparkles size={18} />,
      hint: hint(suggestion.at),
    });
  }
  for (const option of getQuickReminderOptions(now)) {
    options.push({ value: { type: 'at', at: option.at }, label: option.label, icon: QUICK_ICONS[option.key], hint: hint(option.at) });
  }

  const moreOptions: OptionItem<PickerAction>[] = [{ value: { type: 'custom' }, label: 'Pick a date & time', icon: <IconCalendarMonth size={18} /> }];
  if (value) moreOptions.push({ value: { type: 'clear' }, label: 'Remove reminder', icon: <IconBellOff size={18} />, color: 'red' });

  const handleSelect = (action: PickerAction) => {
    if (action.type === 'at') commit(action.at.toISOString());
    else if (action.type === 'clear') commit(null);
    else setView('custom');
  };

  const initial = dayjs(value ?? suggestion?.at ?? now.add(1, 'hour').startOf('hour'));
  const initialSelection: DateTimeSelection = { date: initial.format('YYYY-MM-DD'), time: initial.format('HH:mm') };
  const toDate = ({ date, time }: DateTimeSelection) => dayjs(`${date}T${time ?? '09:00'}`);

  return (
    <ResponsiveOverlay
      opened={opened}
      onClose={close}
      target={target}
      title={view === 'quick' ? 'Remind me' : 'Reminder date & time'}
      width={view === 'quick' ? 300 : 320}
    >
      {view === 'quick' ? (
        <>
          <OptionList options={options} onSelect={handleSelect} />
          <Divider my={4} />
          <OptionList options={moreOptions} onSelect={handleSelect} />
        </>
      ) : (
        <DateTimeSelector
          initial={initialSelection}
          validate={(selection) => (toDate(selection).isAfter(dayjs()) ? null : 'Pick a time in the future')}
          onSubmit={(selection) => commit(toDate(selection).toISOString())}
          onCancel={() => setView('quick')}
        />
      )}
    </ResponsiveOverlay>
  );
};
