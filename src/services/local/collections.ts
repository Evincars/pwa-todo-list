import type { InvitationId, ListId, TodoId, UserId } from '@/domain/types';

/** Firestore-compatible collection layout. */
export const paths = {
  users: 'users',
  user: (userId: UserId) => `users/${userId}`,
  lists: 'lists',
  list: (listId: ListId) => `lists/${listId}`,
  todos: (listId: ListId) => `lists/${listId}/todos`,
  todo: (listId: ListId, todoId: TodoId) => `lists/${listId}/todos/${todoId}`,
  invitations: 'invitations',
  invitation: (invitationId: InvitationId) => `invitations/${invitationId}`,
} as const;
