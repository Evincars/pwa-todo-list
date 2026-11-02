import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { getQuickReminderOptions, suggestReminder } from './reminderTime';

// Sunday 1 Nov 2026, 10:00 local time.
const now = dayjs('2026-11-01T10:00:00');
const due = (iso: string, dueHasTime = true) => ({ dueAt: dayjs(iso).toISOString(), dueHasTime });
const fmt = (value: ReturnType<typeof suggestReminder>) => value && value.at.format('ddd HH:mm');

describe('suggestReminder', () => {
  it('reminds 3 hours before daytime tasks', () => {
    const suggestion = suggestReminder(due('2026-11-02T15:00:00'), now);
    expect(fmt(suggestion)).toBe('Mon 12:00');
    expect(suggestion?.label).toBe('3 hours before');
  });

  it('reminds 5 hours before evening tasks', () => {
    expect(fmt(suggestReminder(due('2026-11-03T20:00:00'), now))).toBe('Tue 15:00');
  });

  it('reminds the evening before early-morning tasks', () => {
    const suggestion = suggestReminder(due('2026-11-02T07:00:00'), now);
    expect(fmt(suggestion)).toBe('Sun 19:00');
    expect(suggestion?.label).toBe('The evening before');
  });

  it('does not suggest reminders before 8:00 on the same day', () => {
    expect(fmt(suggestReminder(due('2026-11-02T10:30:00'), now))).toBe('Mon 08:00');
  });

  it('uses 9:00 for all-day tasks', () => {
    expect(fmt(suggestReminder(due('2026-11-04T00:00:00', false), now))).toBe('Wed 09:00');
  });

  it('falls back to 30 minutes before when the default already passed', () => {
    const suggestion = suggestReminder(due('2026-11-01T12:00:00'), dayjs('2026-11-01T10:00:00'));
    expect(fmt(suggestion)).toBe('Sun 11:30');
    expect(suggestion?.label).toBe('30 minutes before');
  });

  it('returns null without a due date or when it is too late', () => {
    expect(suggestReminder({ dueAt: null, dueHasTime: false }, now)).toBeNull();
    expect(suggestReminder(due('2026-11-01T10:15:00'), now)).toBeNull();
  });
});

describe('getQuickReminderOptions', () => {
  it('offers later today, tomorrow and next Monday', () => {
    expect(getQuickReminderOptions(now).map((option) => `${option.key} ${option.at.format('ddd HH:mm')}`)).toEqual([
      'laterToday Sun 13:00',
      'tomorrow Mon 09:00',
      'nextWeek Mon 09:00',
    ]);
  });
});
