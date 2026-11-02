import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { groupTodosByDay, isOverdue, queryTodos, sortTodos, topPriority } from './todoQuery';
import type { Priority, Todo, TodoId, UserId } from './types';

let seq = 0;
const todo = (overrides: Partial<Todo> = {}): Todo => {
  seq += 1;
  return {
    id: `t${seq}` as TodoId,
    listId: 'l1' as Todo['listId'],
    title: `Task ${seq}`,
    notes: '',
    priority: 'none',
    dueAt: null,
    dueHasTime: false,
    completed: false,
    completedAt: null,
    completedBy: null,
    createdAt: dayjs('2026-01-01').add(seq, 'minute').toISOString(),
    createdBy: { id: 'u1' as UserId, displayName: 'A', email: 'a@x.io', photoURL: null },
    updatedAt: '',
    updatedBy: 'u1' as UserId,
    ...overrides,
  };
};

describe('sortTodos', () => {
  it('smart sort orders by priority, then due date, then newest', () => {
    const low = todo({ title: 'low', priority: 'low' });
    const urgentLate = todo({ title: 'urgent-late', priority: 'urgent', dueAt: '2026-02-10T00:00:00.000Z' });
    const urgentSoon = todo({ title: 'urgent-soon', priority: 'urgent', dueAt: '2026-02-01T00:00:00.000Z' });
    const none = todo({ title: 'none' });
    const urgentNoDate = todo({ title: 'urgent-nodate', priority: 'urgent' });

    expect(sortTodos([low, urgentLate, none, urgentNoDate, urgentSoon], 'smart').map((t) => t.title)).toEqual([
      'urgent-soon',
      'urgent-late',
      'urgent-nodate',
      'low',
      'none',
    ]);
  });

  it('does not mutate the input', () => {
    const input = [todo({ priority: 'low' }), todo({ priority: 'high' })];
    const copy = [...input];
    sortTodos(input, 'priority');
    expect(input).toEqual(copy);
  });

  it.each<[Priority[], Priority[]]>([[['low', 'urgent', 'medium', 'none', 'high'], ['urgent', 'high', 'medium', 'low', 'none']]])(
    'priority sort %j → %j',
    (input, expected) => {
      expect(sortTodos(input.map((priority) => todo({ priority })), 'priority').map((t) => t.priority)).toEqual(expected);
    },
  );
});

describe('isOverdue', () => {
  const now = dayjs('2026-03-10T12:00:00');

  it('date-only tasks are overdue from the next day', () => {
    expect(isOverdue({ dueAt: now.startOf('day').toISOString(), dueHasTime: false, completed: false }, now)).toBe(false);
    expect(isOverdue({ dueAt: now.subtract(1, 'day').toISOString(), dueHasTime: false, completed: false }, now)).toBe(true);
  });

  it('timed tasks are overdue once the time passes; completed never are', () => {
    const past = now.subtract(1, 'hour').toISOString();
    expect(isOverdue({ dueAt: past, dueHasTime: true, completed: false }, now)).toBe(true);
    expect(isOverdue({ dueAt: past, dueHasTime: true, completed: true }, now)).toBe(false);
  });
});

describe('queryTodos', () => {
  it('splits completed, filters and searches notes', () => {
    const items = [
      todo({ title: 'Buy milk', notes: 'oat' }),
      todo({ title: 'Call mom', priority: 'high' }),
      todo({ title: 'Done thing', completed: true, completedAt: '2026-01-02T00:00:00.000Z' }),
    ];
    expect(queryTodos(items, { filter: 'all', sort: 'smart', search: 'OAT' }).active.map((t) => t.title)).toEqual(['Buy milk']);
    const important = queryTodos(items, { filter: 'important', sort: 'smart', search: '' });
    expect(important.active.map((t) => t.title)).toEqual(['Call mom']);
    expect(queryTodos(items, { filter: 'all', sort: 'smart', search: '' }).completed).toHaveLength(1);
  });
});

describe('groupTodosByDay', () => {
  it('groups planned todos per local day, all-day first, then by time', () => {
    const evening = todo({ title: 'evening', dueAt: dayjs('2026-11-03T20:00').toISOString(), dueHasTime: true });
    const morning = todo({ title: 'morning', dueAt: dayjs('2026-11-03T08:00').toISOString(), dueHasTime: true });
    const allDay = todo({ title: 'all day', dueAt: dayjs('2026-11-03').startOf('day').toISOString() });
    const done = todo({ title: 'done', dueAt: dayjs('2026-11-03T09:00').toISOString(), dueHasTime: true, completed: true });
    const other = todo({ title: 'other', dueAt: dayjs('2026-11-04T09:00').toISOString(), dueHasTime: true, priority: 'high' });
    const unplanned = todo({ title: 'unplanned' });

    const days = groupTodosByDay([evening, morning, allDay, done, other, unplanned]);
    expect([...days.keys()].sort()).toEqual(['2026-11-03', '2026-11-04']);
    expect(days.get('2026-11-03')?.active.map((t) => t.title)).toEqual(['all day', 'morning', 'evening']);
    expect(days.get('2026-11-03')?.completed.map((t) => t.title)).toEqual(['done']);
    expect(topPriority(days.get('2026-11-04')!.active)).toBe('high');
    expect(topPriority([])).toBe('none');
  });
});

describe('queryTodos search', () => {
  it('matches titles fuzzily, ranks by relevance and reports highlights', () => {
    const loose = todo({ title: 'Get new iPhone', priority: 'urgent' });
    const exact = todo({ title: 'Set a due date with quick picks' });
    const byNotes = todo({ title: 'Something else', notes: 'remember TEWI code' });
    const miss = todo({ title: 'Buy milk' });

    const result = queryTodos([loose, exact, byNotes, miss], { filter: 'all', sort: 'smart', search: 'tewi' });
    expect(result.active.map((t) => t.title)).toEqual(['Set a due date with quick picks', 'Get new iPhone', 'Something else']);
    expect(result.highlights.get(exact.id)).toEqual([12, 13, 15, 16]);
    expect(result.highlights.has(byNotes.id)).toBe(false);
  });
});
