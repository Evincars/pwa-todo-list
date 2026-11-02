import { Divider } from '@mantine/core';
import { IconBellOff, IconCalendarMonth, IconCalendarEvent, IconClockHour4, IconSparkles, IconSunset2 } from '@tabler/icons-react';
import dayjs, { type Dayjs } from 'dayjs';
import { useState, type ReactElement, type ReactNode } from 'react';
import type { ISODateString } from '@/domain/types';
import { DateTimeSelector, type DateTimeSelection } from '@/features/todos/components/DateTimeSelector';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { formatDate, formatTime, type DueValue } from '@/lib/dates';
import { t as translate, useTranslation } from '@/i18n';
import { getQuickReminderOptions, suggestReminder, type QuickReminderKey, type ReminderLead } from '@/lib/reminderTime';
import { OptionList, ResponsiveOverlay, type OptionItem } from '@/shared/ui';

const QUICK_ICONS: Record<QuickReminderKey, ReactNode> = {
  laterToday: <IconClockHour4 size={18} />,
  tomorrow: <IconSunset2 size={18} />,
  nextWeek: <IconCalendarEvent size={18} />,
};

/** "3 hours before", "The evening before", "That day, 9:00"… */
export const formatReminderLead = (lead: ReminderLead): string => {
  if (lead.kind === 'eveningBefore') return translate('reminders.lead.eveningBefore');
  if (lead.kind === 'thatDay') return translate('reminders.lead.thatDay', { time: `${lead.hour}:00` });
  const hours = Math.floor(lead.minutes / 60);
  const minutes = lead.minutes % 60;
  if (!hours) return translate('reminders.lead.minutes', { count: minutes });
  return minutes ? translate('reminders.lead.hoursMinutes', { hours, minutes }) : translate('reminders.lead.hours', { count: hours });
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
  const { t } = useTranslation();
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
  const hint = (date: Dayjs) =>
    date.isSame(now, 'day') ? formatTime(date, timeFormat) : `${formatDate(date, 'weekdayShort')} ${formatTime(date, timeFormat)}`;
  const suggestion = suggestReminder(due, now);

  const options: OptionItem<PickerAction>[] = [];
  if (suggestion) {
    options.push({
      value: { type: 'at', at: suggestion.at },
      label: formatReminderLead(suggestion.lead),
      description: t('reminders.suggested'),
      icon: <IconSparkles size={18} />,
      hint: hint(suggestion.at),
    });
  }
  for (const option of getQuickReminderOptions(now)) {
    options.push({ value: { type: 'at', at: option.at }, label: t(`reminders.quick.${option.key}`), icon: QUICK_ICONS[option.key], hint: hint(option.at) });
  }

  const moreOptions: OptionItem<PickerAction>[] = [{ value: { type: 'custom' }, label: t('due.pick'), icon: <IconCalendarMonth size={18} /> }];
  if (value) moreOptions.push({ value: { type: 'clear' }, label: t('reminders.remove'), icon: <IconBellOff size={18} />, color: 'red' });

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
      title={view === 'quick' ? t('reminders.title') : t('reminders.customTitle')}
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
          validate={(selection) => (toDate(selection).isAfter(dayjs()) ? null : t('dateTime.futureOnly'))}
          onSubmit={(selection) => commit(toDate(selection).toISOString())}
          onCancel={() => setView('quick')}
        />
      )}
    </ResponsiveOverlay>
  );
};
