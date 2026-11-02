import { Divider } from '@mantine/core';
import {
  IconCalendarEvent,
  IconCalendarMonth,
  IconCalendarOff,
  IconCalendarWeek,
  IconClockHour4,
  IconSun,
  IconSunset2,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState, type ReactElement, type ReactNode } from 'react';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { useTranslation } from '@/i18n';
import { combineDateTime, formatQuickHint, getQuickDueOptions, NO_DUE, type DueValue, type QuickDueKey } from '@/lib/dates';
import { OptionList, ResponsiveOverlay, type OptionItem } from '@/shared/ui';
import { DateTimeSelector, type DateTimeSelection } from './DateTimeSelector';

const QUICK_ICONS: Record<QuickDueKey, ReactNode> = {
  laterToday: <IconClockHour4 size={18} />,
  today: <IconSun size={18} />,
  tomorrow: <IconSunset2 size={18} />,
  weekend: <IconCalendarWeek size={18} />,
  nextWeek: <IconCalendarEvent size={18} />,
};

const toSelection = ({ dueAt, dueHasTime }: DueValue): DateTimeSelection => {
  const date = dueAt ? dayjs(dueAt) : dayjs().add(1, 'day');
  return { date: date.format('YYYY-MM-DD'), time: dueAt && !dueHasTime ? null : dueAt ? date.format('HH:mm') : '09:00' };
};

type PickerAction = { type: 'quick'; value: DueValue } | { type: 'custom' } | { type: 'clear' };

export interface DueDatePickerProps {
  value: DueValue;
  onChange: (value: DueValue) => void;
  opened: boolean;
  onClose: () => void;
  /** Anchor element (must forward its ref). */
  target: ReactElement;
}

/**
 * Microsoft To Do-like due date picker: quick picks first,
 * "Pick a date & time" opens a calendar with a time grid.
 */
export const DueDatePicker = ({ value, onChange, opened, onClose, target }: DueDatePickerProps) => {
  const { t } = useTranslation();
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const [view, setView] = useState<'quick' | 'custom'>('quick');

  const close = () => {
    onClose();
    setView('quick');
  };

  const commit = (next: DueValue) => {
    onChange(next);
    close();
  };

  const quickOptions: OptionItem<PickerAction>[] = getQuickDueOptions().map((option) => ({
    value: { type: 'quick', value: option.value },
    label: t(`due.quick.${option.key}`),
    icon: QUICK_ICONS[option.key],
    hint: formatQuickHint(option, timeFormat),
  }));

  const moreOptions: OptionItem<PickerAction>[] = [
    { value: { type: 'custom' }, label: t('due.pick'), icon: <IconCalendarMonth size={18} /> },
  ];
  if (value.dueAt) {
    moreOptions.push({ value: { type: 'clear' }, label: t('due.remove'), icon: <IconCalendarOff size={18} />, color: 'red' });
  }

  const handleSelect = (action: PickerAction) => {
    if (action.type === 'quick') commit(action.value);
    else if (action.type === 'clear') commit(NO_DUE);
    else setView('custom');
  };

  return (
    <ResponsiveOverlay
      opened={opened}
      onClose={close}
      target={target}
      title={view === 'quick' ? t('due.title') : t('due.pick')}
      width={view === 'quick' ? 280 : 320}
    >
      {view === 'quick' ? (
        <>
          <OptionList options={quickOptions} onSelect={handleSelect} />
          <Divider my={4} />
          <OptionList options={moreOptions} onSelect={handleSelect} />
        </>
      ) : (
        <DateTimeSelector
          initial={toSelection(value)}
          timeOptional
          onSubmit={({ date, time }) => commit(combineDateTime(date, time))}
          onCancel={() => setView('quick')}
        />
      )}
    </ResponsiveOverlay>
  );
};
