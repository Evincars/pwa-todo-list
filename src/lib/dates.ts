import dayjs, { type Dayjs } from 'dayjs';
import type { ISODateString } from '@/domain/types';
import type { TimeFormat } from '@/features/settings/settingsStore';
import { t } from '@/i18n/i18n';

/** Format pattern of the active language, e.g. `'dayMonth'` → `D MMM` (en) / `D. M.` (cs). */
export type DateFormatKey = keyof ReturnType<typeof dateFormats>;
const dateFormats = () => t('dates.format', { returnObjects: true });
export const formatDate = (date: Dayjs, key: DateFormatKey) => date.format(dateFormats()[key]);

/** Weekday names are lower-case in some languages (Czech); labels start with a capital. */
export const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

export interface DueValue {
  dueAt: ISODateString | null;
  dueHasTime: boolean;
}

export const NO_DUE: DueValue = { dueAt: null, dueHasTime: false };

export const timePattern = (format: TimeFormat) => (format === '12h' ? 'h:mm A' : 'HH:mm');

export const formatTime = (date: Dayjs, format: TimeFormat) => date.format(timePattern(format));

const atTime = (date: Dayjs, hour: number, minute = 0) => date.hour(hour).minute(minute).second(0).millisecond(0);

export const toDue = (date: Dayjs, withTime: boolean): DueValue => ({
  dueAt: (withTime ? date.second(0).millisecond(0) : date.startOf('day')).toISOString(),
  dueHasTime: withTime,
});

export type QuickDueKey = 'laterToday' | 'today' | 'tomorrow' | 'weekend' | 'nextWeek';

export interface QuickDueOption {
  key: QuickDueKey;
  value: DueValue;
  date: Dayjs;
}

/**
 * Quick picks similar to Microsoft To Do:
 * "Later today" (+3h, rounded), "Tomorrow 9:00", "This weekend", "Next week" (Monday 9:00).
 */
export const getQuickDueOptions = (now: Dayjs = dayjs()): QuickDueOption[] => {
  const options: QuickDueOption[] = [];

  const later = now.add(3, 'hour').startOf('hour');
  if (later.isSame(now, 'day') && later.hour() <= 22) {
    options.push({ key: 'laterToday', date: later, value: toDue(later, true) });
  }
  options.push({ key: 'today', date: now, value: toDue(now, false) });

  const tomorrow = atTime(now.add(1, 'day'), 9);
  options.push({ key: 'tomorrow', date: tomorrow, value: toDue(tomorrow, true) });

  // Saturday 10:00 – only offered Mon–Thu so it doesn't collide with "Tomorrow".
  const day = now.day();
  if (day >= 1 && day <= 4) {
    const saturday = atTime(now.add(6 - day, 'day'), 10);
    options.push({ key: 'weekend', date: saturday, value: toDue(saturday, true) });
  }

  const daysToMonday = ((8 - day) % 7) || 7;
  const nextWeek = atTime(now.add(daysToMonday, 'day'), 9);
  options.push({ key: 'nextWeek', date: nextWeek, value: toDue(nextWeek, true) });

  return options;
};

/** Common times offered in the custom picker. */
export const TIME_PRESETS = ['08:00', '09:00', '12:00', '15:00', '18:00', '20:00'] as const;

/** Combines a `YYYY-MM-DD` date with an optional `HH:mm[:ss]` time. */
export const combineDateTime = (date: string, time: string | null): DueValue => {
  const base = dayjs(date);
  if (!time) return toDue(base, false);
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return toDue(atTime(base, hours, minutes), true);
};

/** "Today" / "Tomorrow" / "Yesterday" or `null`. */
export const relativeDay = (date: Dayjs, now: Dayjs = dayjs()): string | null => {
  if (date.isSame(now, 'day')) return t('dates.today');
  if (date.isSame(now.add(1, 'day'), 'day')) return t('dates.tomorrow');
  if (date.isSame(now.subtract(1, 'day'), 'day')) return t('dates.yesterday');
  return null;
};

/** Human friendly due label: "Today, 18:00", "Tomorrow", "Mon, 12 Nov", "12 Nov 2027". */
export const formatDue = ({ dueAt, dueHasTime }: DueValue, format: TimeFormat, now: Dayjs = dayjs()): string => {
  if (!dueAt) return '';
  const date = dayjs(dueAt);
  const withinWeek = date.diff(now, 'day') < 7 && date.isAfter(now);
  const dayLabel = capitalize(
    relativeDay(date, now) ??
      formatDate(date, date.isSame(now, 'year') ? (withinWeek ? 'weekday' : 'dayMonthWeekday') : 'dayMonthYear'),
  );
  return dueHasTime ? t('dates.withTime', { day: dayLabel, time: formatTime(date, format) }) : dayLabel;
};

/** Reminder label, e.g. "Today, 12:00", "Mon, 9 Nov, 19:00". */
export const formatReminder = (remindAt: ISODateString, format: TimeFormat, now: Dayjs = dayjs()): string =>
  formatDue({ dueAt: remindAt, dueHasTime: true }, format, now);

/** Short hint for quick pick rows: "18:00", "Tue 9:00", "Mon 9:00". */
export const formatQuickHint = (option: QuickDueOption, format: TimeFormat, now: Dayjs = dayjs()): string => {
  const { date, value } = option;
  const time = value.dueHasTime ? formatTime(date, format) : '';
  if (date.isSame(now, 'day')) return time || formatDate(date, 'weekdayShort');
  return [formatDate(date, 'weekdayShort'), time].filter(Boolean).join(' ');
};
