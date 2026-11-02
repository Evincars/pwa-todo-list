import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { combineDateTime, formatDue, getQuickDueOptions } from './dates';

describe('getQuickDueOptions', () => {
  it('offers later today, tomorrow 9:00, weekend and next Monday on a Tuesday morning', () => {
    const tuesday = dayjs('2026-11-03T10:15:00');
    const options = getQuickDueOptions(tuesday);
    expect(options.map((o) => o.key)).toEqual(['laterToday', 'today', 'tomorrow', 'weekend', 'nextWeek']);
    expect(options[0]!.date.format('HH:mm')).toBe('13:00');
    expect(options.find((o) => o.key === 'tomorrow')!.date.format('YYYY-MM-DD HH:mm')).toBe('2026-11-04 09:00');
    expect(options.find((o) => o.key === 'weekend')!.date.format('ddd HH:mm')).toBe('Sat 10:00');
    expect(options.find((o) => o.key === 'nextWeek')!.date.format('YYYY-MM-DD ddd')).toBe('2026-11-09 Mon');
  });

  it('skips "later today" late in the evening and "weekend" on Fridays', () => {
    const fridayNight = dayjs('2026-11-06T21:30:00');
    expect(getQuickDueOptions(fridayNight).map((o) => o.key)).toEqual(['today', 'tomorrow', 'nextWeek']);
  });
});

describe('combineDateTime / formatDue', () => {
  const now = dayjs('2026-11-03T10:00:00');

  it('combines a date with time', () => {
    const value = combineDateTime('2026-11-03', '18:30');
    expect(value.dueHasTime).toBe(true);
    expect(formatDue(value, '24h', now)).toBe('Today, 18:30');
    expect(formatDue(value, '12h', now)).toBe('Today, 6:30 PM');
  });

  it('formats date-only values relatively', () => {
    expect(formatDue(combineDateTime('2026-11-04', null), '24h', now)).toBe('Tomorrow');
    expect(formatDue(combineDateTime('2026-11-02', null), '24h', now)).toBe('Yesterday');
  });
});
