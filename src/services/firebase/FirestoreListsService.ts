import {
  arrayRemove,
  deleteField,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { AppError } from '@/domain/errors';
import { assertCanManage, assertCanRead } from '@/domain/permissions';
import type { CreateListInput, Invitation, ListId, MemberPermission, Todo, TodoList, UpdateListInput, UserId } from '@/domain/types';
import { toUserSummary } from '@/domain/types';
import { requireUser } from '../session';
import type { AuthService, ListsService } from '../types';
import { guard, nowISO, typedCollection, typedDoc, watch } from './helpers';

/** Same behaviour as `LocalListsService`; `firestore.rules` enforces the permission checks server-side. */
export class FirestoreListsService implements ListsService {
  constructor(
    private readonly db: Firestore,
    private readonly auth: AuthService,
  ) {}

  private listRef = (listId: ListId) => typedDoc<TodoList>(this.db, 'lists', listId);

  private myListsQuery(userId: UserId) {
    return query(typedCollection<TodoList>(this.db, 'lists'), where('memberIds', 'array-contains', userId));
  }

  getMyLists = () =>
    guard(async () => {
      const user = requireUser(this.auth);
      const snapshot = await getDocs(this.myListsQuery(user.id));
      return snapshot.docs.map((d) => d.data()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });

  getList = (listId: ListId) =>
    guard(async () => {
      const user = requireUser(this.auth);
      const list = await this.fetch(listId);
      assertCanRead(list, user.id);
      return list;
    });

  createList = (input: CreateListInput) =>
    guard(async () => {
      const user = requireUser(this.auth);
      const title = input.title.trim();
      if (!title) throw new AppError('invalid-argument', 'listNameRequired');
      const now = nowISO();
      const list: TodoList = {
        id: nanoid(12) as ListId,
        title,
        icon: input.icon,
        color: input.color,
        owner: toUserSummary(user),
        members: {},
        memberIds: [user.id],
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(this.listRef(list.id), list);
      return list;
    });

  updateList = (listId: ListId, input: UpdateListInput) =>
    guard(async () => {
      const user = requireUser(this.auth);
      assertCanManage(await this.fetch(listId), user.id);
      const title = input.title?.trim();
      if (input.title !== undefined && !title) throw new AppError('invalid-argument', 'listNameRequired');
      await updateDoc(this.listRef(listId), { ...input, ...(title ? { title } : {}), updatedAt: nowISO() });
      return this.fetch(listId);
    });

  deleteList = (listId: ListId) =>
    guard(async () => {
      const user = requireUser(this.auth);
      assertCanManage(await this.fetch(listId), user.id);
      const [todos, invitations] = await Promise.all([
        getDocs(typedCollection<Todo>(this.db, 'lists', listId, 'todos')),
        // The `invitedBy.id` filter lets the security rules prove the owner may read them.
        getDocs(query(typedCollection<Invitation>(this.db, 'invitations'), where('listId', '==', listId), where('invitedBy.id', '==', user.id))),
      ]);
      const batch = writeBatch(this.db);
      todos.docs.forEach((d) => batch.delete(d.ref));
      invitations.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(this.listRef(listId));
      await batch.commit();
    });

  setMemberPermission = (listId: ListId, userId: UserId, permission: MemberPermission) =>
    guard(async () => {
      const user = requireUser(this.auth);
      const list = await this.fetch(listId);
      assertCanManage(list, user.id);
      if (!list.members[userId]) throw new AppError('not-found', 'memberNotFound');
      await updateDoc(this.listRef(listId), { [`members.${userId}.permission`]: permission, updatedAt: nowISO() });
      return this.fetch(listId);
    });

  removeMember = (listId: ListId, userId: UserId) =>
    guard(async () => {
      const user = requireUser(this.auth);
      assertCanManage(await this.fetch(listId), user.id);
      await this.withoutMember(listId, userId);
      return this.fetch(listId);
    });

  leaveList = (listId: ListId) =>
    guard(async () => {
      const user = requireUser(this.auth);
      const list = await this.fetch(listId);
      if (list.owner.id === user.id) throw new AppError('failed-precondition', 'ownerCannotLeave');
      assertCanRead(list, user.id);
      await this.withoutMember(listId, user.id);
    });

  watchMyLists(onChange: () => void) {
    const user = this.auth.getCurrentUser();
    return user ? watch(this.myListsQuery(user.id), onChange) : () => {};
  }

  watchList(listId: ListId, onChange: () => void) {
    return watch(this.listRef(listId), onChange);
  }

  private withoutMember(listId: ListId, userId: UserId) {
    return updateDoc(this.listRef(listId), {
      [`members.${userId}`]: deleteField(),
      memberIds: arrayRemove(userId),
      updatedAt: nowISO(),
    });
  }

  private async fetch(listId: ListId): Promise<TodoList> {
    const snapshot = await getDoc(this.listRef(listId));
    const list = snapshot.data();
    if (!list) throw new AppError('not-found', 'listNotFound');
    return list;
  }
}
