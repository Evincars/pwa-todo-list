import dayjs from 'dayjs';
import { PRIORITY_META } from './priority';
import type { Todo } from './types';

export const TODO_SORT_KEYS = ['smart', 'priority', 'dueDate', 'createdAt', 'title'] as const;
export type TodoSortKey = (typeof TODO_SORT_KEYS)[number];

export const TODO_FILTERS = ['all', 'today', 'planned', 'overdue', 'important'] as const;
export type TodoFilter = (typeof TODO_FILTERS)[number];

export const SORT_LABEL: Record<TodoSortKey, string> = {
  smart: 'Smart (priority, then due date)',
  priority: 'Priority',
  dueDate: 'Due date',
  createdAt: 'Recently added',
  title: 'Alphabetically',
};

export const FILTER_LABEL: Record<TodoFilter, string> = {
  all: 'All',
  today: 'Today',
  planned: 'Planned',
  overdue: 'Overdue',
  important: 'Important',
};

type Comparator<T> = (a: T, b: T) => number;

const byPriority: Comparator<Todo> = (a, b) => PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight;

/** Earliest first, todos without due date go last. */
const byDueDate: Comparator<Todo> = (a, b) => {
  if (a.dueAt === b.dueAt) return 0;
  if (!a.dueAt) return 1;
  if (!b.dueAt) return -1;
  return a.dueAt.localeCompare(b.dueAt);
};

const byCreatedDesc: Comparator<Todo> = (a, b) => b.createdAt.localeCompare(a.createdAt);
const byTitle: Comparator<Todo> = (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });

const chain =
  <T>(...comparators: Comparator<T>[]): Comparator<T> =>
  (a, b) => {
    for (const compare of comparators) {
      const result = compare(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };

const COMPARATORS: Record<TodoSortKey, Comparator<Todo>> = {
  smart: chain(byPriority, byDueDate, byCreatedDesc),
  priority: chain(byPriority, byCreatedDesc),
  dueDate: chain(byDueDate, byPriority, byCreatedDesc),
  createdAt: byCreatedDesc,
  title: chain(byTitle, byCreatedDesc),
};

export const sortTodos = (todos: readonly Todo[], sortKey: TodoSortKey): Todo[] =>
  [...todos].sort(COMPARATORS[sortKey]);

export const isOverdue = (todo: Pick<Todo, 'dueAt' | 'dueHasTime' | 'completed'>, now = dayjs()): boolean => {
  if (!todo.dueAt || todo.completed) return false;
  const due = dayjs(todo.dueAt);
  return todo.dueHasTime ? due.isBefore(now) : due.isBefore(now, 'day');
};

const FILTER_PREDICATES: Record<TodoFilter, (todo: Todo) => boolean> = {
  all: () => true,
  today: (todo) => !!todo.dueAt && dayjs(todo.dueAt).isSame(dayjs(), 'day'),
  planned: (todo) => !!todo.dueAt,
  overdue: (todo) => isOverdue(todo),
  important: (todo) => PRIORITY_META[todo.priority].weight >= 3,
};

export interface TodoQuery {
  filter: TodoFilter;
  sort: TodoSortKey;
  search: string;
}

export interface TodoSections {
  active: Todo[];
  completed: Todo[];
}

/** Applies filter, search and sort; completed todos are split out and ordered by completion time. */
export const queryTodos = (todos: readonly Todo[], { filter, sort, search }: TodoQuery): TodoSections => {
  const needle = search.trim().toLowerCase();
  const matches = todos.filter(
    (todo) =>
      FILTER_PREDICATES[filter](todo) &&
      (!needle || todo.title.toLowerCase().includes(needle) || todo.notes.toLowerCase().includes(needle)),
  );

  return {
    active: sortTodos(
      matches.filter((todo) => !todo.completed),
      sort,
    ),
    completed: matches
      .filter((todo) => todo.completed)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
  };
};

/** Local calendar day key, `YYYY-MM-DD`. */
export const dayKey = (iso: string) => dayjs(iso).format('YYYY-MM-DD');

export interface CalendarDay {
  active: Todo[];
  completed: Todo[];
}

/** Planned todos grouped per local day; inside a day all-day tasks first, then by time and priority. */
export const groupTodosByDay = (todos: readonly Todo[]): Map<string, CalendarDay> => {
  const days = new Map<string, CalendarDay>();
  const agendaOrder = chain<Todo>(
    (a, b) => Number(a.dueHasTime) - Number(b.dueHasTime),
    (a, b) => (a.dueHasTime && b.dueHasTime ? a.dueAt!.localeCompare(b.dueAt!) : 0),
    byPriority,
    byTitle,
  );
  for (const todo of todos) {
    if (!todo.dueAt) continue;
    const key = dayKey(todo.dueAt);
    const day = days.get(key) ?? { active: [], completed: [] };
    (todo.completed ? day.completed : day.active).push(todo);
    days.set(key, day);
  }
  for (const day of days.values()) {
    day.active.sort(agendaOrder);
    day.completed.sort(agendaOrder);
  }
  return days;
};

/** Most important priority among `todos` (`none` when empty). */
export const topPriority = (todos: readonly Todo[]) =>
  todos.reduce<Todo['priority']>((top, todo) => (PRIORITY_META[todo.priority].weight > PRIORITY_META[top].weight ? todo.priority : top), 'none');
