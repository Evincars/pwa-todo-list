import { AppError, type AppErrorReason } from './errors';
import type { ListAccess, TodoList, UserId } from './types';

/**
 * Access rules shared by the UI and the service layer. When moving to Firebase,
 * the same rules have to be expressed in `firestore.rules`.
 */
export const getListAccess = (list: Pick<TodoList, 'owner' | 'members'>, userId: UserId | null | undefined): ListAccess => {
  if (!userId) return 'none';
  if (list.owner.id === userId) return 'owner';
  return list.members[userId]?.permission ?? 'none';
};

export const canRead = (access: ListAccess): boolean => access !== 'none';
export const canWrite = (access: ListAccess): boolean => access === 'owner' || access === 'write';
export const canManage = (access: ListAccess): boolean => access === 'owner';

const assert = (allowed: boolean, reason: AppErrorReason) => {
  if (!allowed) throw new AppError('permission-denied', reason);
};

export const assertCanRead = (list: TodoList, userId: UserId) =>
  assert(canRead(getListAccess(list, userId)), 'noAccess');

export const assertCanWrite = (list: TodoList, userId: UserId) =>
  assert(canWrite(getListAccess(list, userId)), 'readOnly');

export const assertCanManage = (list: TodoList, userId: UserId) =>
  assert(canManage(getListAccess(list, userId)), 'ownerOnly');

