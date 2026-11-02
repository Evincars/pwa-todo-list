import type { InvitationId, ListId } from '@/domain/types';

/** Single source of truth for TanStack Query keys (hierarchical → easy invalidation). */
export const queryKeys = {
  lists: {
    all: ['lists'] as const,
    mine: () => [...queryKeys.lists.all, 'mine'] as const,
    detail: (listId: ListId) => [...queryKeys.lists.all, 'detail', listId] as const,
  },
  todos: {
    all: ['todos'] as const,
    byList: (listId: ListId) => [...queryKeys.todos.all, listId] as const,
  },
  invitations: {
    all: ['invitations'] as const,
    mine: () => [...queryKeys.invitations.all, 'mine'] as const,
    byList: (listId: ListId) => [...queryKeys.invitations.all, 'list', listId] as const,
    detail: (invitationId: InvitationId) => [...queryKeys.invitations.all, 'detail', invitationId] as const,
  },
};
