import { nanoid } from 'nanoid';
import { AppError } from '@/domain/errors';
import { assertCanManage, assertCanRead } from '@/domain/permissions';
import type {
  CreateListInput,
  Invitation,
  ListId,
  MemberPermission,
  Todo,
  TodoList,
  UpdateListInput,
  UserId,
} from '@/domain/types';
import { toUserSummary } from '@/domain/types';
import type { BatchOperation, DocumentStore } from '../storage/DocumentStore';
import { where } from '../storage/DocumentStore';
import type { AuthService, ListsService } from '../types';
import { paths } from './collections';
import { nowISO, requireUser } from './session';

export class LocalListsService implements ListsService {
  constructor(
    private readonly store: DocumentStore,
    private readonly auth: AuthService,
  ) {}

  async getMyLists(): Promise<TodoList[]> {
    const user = requireUser(this.auth);
    const lists = await this.store.query<TodoList>(paths.lists, [where('memberIds', 'array-contains', user.id)]);
    return lists.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getList(listId: ListId): Promise<TodoList> {
    const user = requireUser(this.auth);
    const list = await this.fetch(listId);
    assertCanRead(list, user.id);
    return list;
  }

  async createList(input: CreateListInput): Promise<TodoList> {
    const user = requireUser(this.auth);
    const title = input.title.trim();
    if (!title) throw new AppError('invalid-argument', 'List name is required');
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
    await this.store.set(paths.list(list.id), list);
    return list;
  }

  async updateList(listId: ListId, input: UpdateListInput): Promise<TodoList> {
    const user = requireUser(this.auth);
    const list = await this.fetch(listId);
    assertCanManage(list, user.id);
    const title = input.title?.trim();
    if (input.title !== undefined && !title) throw new AppError('invalid-argument', 'List name is required');
    const updated: TodoList = { ...list, ...input, ...(title ? { title } : {}), updatedAt: nowISO() };
    await this.store.set(paths.list(listId), updated);
    return updated;
  }

  async deleteList(listId: ListId): Promise<void> {
    const user = requireUser(this.auth);
    const list = await this.fetch(listId);
    assertCanManage(list, user.id);
    const [todos, invitations] = await Promise.all([
      this.store.query<Todo>(paths.todos(listId)),
      this.store.query<Invitation>(paths.invitations, [where('listId', '==', listId)]),
    ]);
    const operations: BatchOperation[] = [
      ...todos.map((todo) => ({ type: 'delete' as const, path: paths.todo(listId, todo.id) })),
      ...invitations.map((invitation) => ({ type: 'delete' as const, path: paths.invitation(invitation.id) })),
      { type: 'delete', path: paths.list(listId) },
    ];
    await this.store.batch(operations);
  }

  async setMemberPermission(listId: ListId, userId: UserId, permission: MemberPermission): Promise<TodoList> {
    const user = requireUser(this.auth);
    const list = await this.fetch(listId);
    assertCanManage(list, user.id);
    const member = list.members[userId];
    if (!member) throw new AppError('not-found', 'Member not found');
    const updated: TodoList = {
      ...list,
      members: { ...list.members, [userId]: { ...member, permission } },
      updatedAt: nowISO(),
    };
    await this.store.set(paths.list(listId), updated);
    return updated;
  }

  async removeMember(listId: ListId, userId: UserId): Promise<TodoList> {
    const user = requireUser(this.auth);
    const list = await this.fetch(listId);
    assertCanManage(list, user.id);
    return this.withoutMember(list, userId);
  }

  async leaveList(listId: ListId): Promise<void> {
    const user = requireUser(this.auth);
    const list = await this.fetch(listId);
    if (list.owner.id === user.id) throw new AppError('failed-precondition', 'The owner cannot leave their own list');
    assertCanRead(list, user.id);
    await this.withoutMember(list, user.id);
  }

  watchMyLists(onChange: () => void) {
    return this.store.subscribe(paths.lists, (change) => {
      // Ignore todo changes – they live in a sub-collection.
      if (!change.path.includes('/todos/')) onChange();
    });
  }

  watchList(listId: ListId, onChange: () => void) {
    return this.store.subscribe(paths.list(listId), (change) => {
      if (change.path === paths.list(listId)) onChange();
    });
  }

  private async withoutMember(list: TodoList, userId: UserId): Promise<TodoList> {
    const { [userId]: _removed, ...members } = list.members;
    const updated: TodoList = {
      ...list,
      members,
      memberIds: list.memberIds.filter((id) => id !== userId),
      updatedAt: nowISO(),
    };
    await this.store.set(paths.list(list.id), updated);
    return updated;
  }

  private async fetch(listId: ListId): Promise<TodoList> {
    const list = await this.store.get<TodoList>(paths.list(listId));
    if (!list) throw new AppError('not-found', 'This list does not exist or was deleted');
    return list;
  }
}
