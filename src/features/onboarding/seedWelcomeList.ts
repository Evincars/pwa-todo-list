import dayjs from 'dayjs';
import type { CreateTodoInput } from '@/domain/types';
import type { Services } from '@/services/types';

/** Gives first-time users something to play with. */
export const seedWelcomeList = async ({ lists, todos }: Pick<Services, 'lists' | 'todos'>) => {
  const list = await lists.createList({ title: 'Getting started', icon: '👋', color: 'violet' });
  const today = dayjs();
  const samples: CreateTodoInput[] = [
    { title: 'Tap the circle to complete a task', priority: 'none' },
    {
      title: 'Share this list with a friend',
      notes: 'Open the members icon in the header. Invited people can view by default – you decide who can edit.',
      priority: 'high',
      dueAt: today.hour(18).minute(0).second(0).toISOString(),
      dueHasTime: true,
    },
    { title: 'Set a due date with quick picks', priority: 'medium', dueAt: today.add(1, 'day').startOf('day').toISOString() },
    { title: 'Pick a theme in Settings', priority: 'low' },
    {
      title: 'Open the calendar (top-right icon) and add a reminder',
      notes: 'Tap a task → "Remind me". The suggested time is a few hours before the due time.',
      priority: 'medium',
      dueAt: today.add(2, 'day').hour(15).minute(0).second(0).toISOString(),
      dueHasTime: true,
    },
    { title: 'Mark something urgent', priority: 'urgent', dueAt: today.subtract(1, 'day').startOf('day').toISOString() },
  ];
  for (const sample of samples) await todos.createTodo(list.id, sample);
  return list;
};
