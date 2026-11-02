import dayjs, { type Dayjs } from 'dayjs';
import type { DueValue } from './dates';

/** How the suggestion relates to the due date – rendered by the UI ("3 hours before", "The evening before"). */
export type ReminderLead =
  | { kind: 'eveningBefore' }
  | { kind: 'thatDay'; hour: number }
  | { kind: 'before'; minutes: number };

export interface ReminderSuggestion {
  at: Dayjs;
  lead: ReminderLead;
}

/** Earliest hour a same-day reminder is suggested for. */
const DAY_START_HOUR = 8;
/** Tasks due before this hour are reminded the evening before. */
const EARLY_TASK_HOUR = 10;
const EVENING_BEFORE_HOUR = 19;
/** From this hour on the lead time grows – evening plans need preparation during the day. */
const EVENING_TASK_HOUR = 18;
const ALL_DAY_REMINDER_HOUR = 9;

const at = (date: Dayjs, hour: number) => date.hour(hour).minute(0).second(0).millisecond(0);

const leadOf = (due: Dayjs, reminder: Dayjs): ReminderLead =>
  reminder.isSame(due, 'day') ? { kind: 'before', minutes: due.diff(reminder, 'minute') } : { kind: 'eveningBefore' };

/**
 * Default reminder for a due date – "a few hours before, on the same day":
 * - Mon 15:00 → Mon 12:00 (3 h before; never earlier than 8:00)
 * - Tue 20:00 → Tue 15:00 (evening tasks: 5 h before)
 * - Mon 7:00  → Sun 19:00 (early tasks: the evening before)
 * - all-day   → that day 9:00
 * When the suggestion is already in the past, falls back to 30 minutes before (or none).
 */
export const suggestReminder = ({ dueAt, dueHasTime }: DueValue, now: Dayjs = dayjs()): ReminderSuggestion | null => {
  if (!dueAt) return null;
  const due = dayjs(dueAt);

  if (!dueHasTime) {
    const morning = at(due, ALL_DAY_REMINDER_HOUR);
    return morning.isAfter(now) ? { at: morning, lead: { kind: 'thatDay', hour: ALL_DAY_REMINDER_HOUR } } : null;
  }

  let reminder: Dayjs;
  if (due.hour() < EARLY_TASK_HOUR) reminder = at(due.subtract(1, 'day'), EVENING_BEFORE_HOUR);
  else if (due.hour() < EVENING_TASK_HOUR) {
    const threeHoursBefore = due.subtract(3, 'hour');
    const dayStart = at(due, DAY_START_HOUR);
    reminder = threeHoursBefore.isBefore(dayStart) ? dayStart : threeHoursBefore;
  } else reminder = due.subtract(5, 'hour');

  if (!reminder.isAfter(now)) {
    const shortly = due.subtract(30, 'minute');
    if (!shortly.isAfter(now)) return null;
    reminder = shortly;
  }
  return { at: reminder, lead: leadOf(due, reminder) };
};

export type QuickReminderKey = 'laterToday' | 'tomorrow' | 'nextWeek';

export interface QuickReminderOption {
  key: QuickReminderKey;
  at: Dayjs;
}

/** Microsoft To Do's reminder quick picks. */
export const getQuickReminderOptions = (now: Dayjs = dayjs()): QuickReminderOption[] => {
  const options: QuickReminderOption[] = [];
  const later = now.add(3, 'hour').startOf('hour');
  if (later.isSame(now, 'day') && later.hour() <= 22) options.push({ key: 'laterToday', at: later });
  options.push({ key: 'tomorrow', at: at(now.add(1, 'day'), 9) });
  const daysToMonday = (8 - now.day()) % 7 || 7;
  options.push({ key: 'nextWeek', at: at(now.add(daysToMonday, 'day'), 9) });
  return options;
};
