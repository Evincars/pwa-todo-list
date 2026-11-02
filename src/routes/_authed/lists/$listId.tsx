import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import type { ListId, TodoId } from '@/domain/types';
import { listQueryOptions } from '@/features/lists/api';
import { todosQueryOptions } from '@/features/todos/api';
import { ListPage } from '@/features/todos/pages/ListPage';

export const Route = createFileRoute('/_authed/lists/$listId')({
  params: {
    parse: ({ listId }) => ({ listId: listId as ListId }),
    stringify: ({ listId }) => ({ listId }),
  },
  // `?task=<id>` opens the task details – the back button closes them on mobile.
  validateSearch: z.object({
    task: z
      .string()
      .optional()
      .transform((value) => value as TodoId | undefined),
  }),
  loader: ({ context: { queryClient, services }, params: { listId } }) =>
    Promise.all([
      queryClient.ensureQueryData(listQueryOptions(services, listId)),
      queryClient.ensureQueryData(todosQueryOptions(services, listId)),
    ]),
  component: ListPage,
});
