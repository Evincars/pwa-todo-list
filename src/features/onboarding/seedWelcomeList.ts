import dayjs from 'dayjs';
import type { CreateTodoInput } from '@/domain/types';
import { t } from '@/i18n';
import type { Services } from '@/services/types';

/** Gives first-time users something to play with – in their language. */
export const seedWelcomeList = async ({ lists, todos }: Pick<Services, 'lists' | 'todos'>) => {
  const list = await lists.createList({ title: t('onboarding.listTitle'), icon: '👋', color: 'violet' });
  const today = dayjs();
  const samples: CreateTodoInput[] = [
    { title: t('onboarding.complete'), priority: 'none' },
    {
      title: t('onboarding.share'),
      notes: t('onboarding.shareNotes'),
      priority: 'high',
      dueAt: today.hour(18).minute(0).second(0).toISOString(),
      dueHasTime: true,
    },
    { title: t('onboarding.dueDate'), priority: 'medium', dueAt: today.add(1, 'day').startOf('day').toISOString() },
    { title: t('onboarding.theme'), priority: 'low' },
    {
      title: t('onboarding.calendar'),
      notes: t('onboarding.calendarNotes'),
      priority: 'medium',
      dueAt: today.add(2, 'day').hour(15).minute(0).second(0).toISOString(),
      dueHasTime: true,
    },
    { title: t('onboarding.urgent'), priority: 'urgent', dueAt: today.subtract(1, 'day').startOf('day').toISOString() },
  ];
  for (const sample of samples) await todos.createTodo(list.id, sample);
  return list;
};
