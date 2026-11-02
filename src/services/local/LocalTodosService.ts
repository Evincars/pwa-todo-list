import { nanoid } from 'nanoid';
import { AppError } from '@/domain/errors';
import { assertCanRead, assertCanWrite } from '@/domain/permissions';
import type { CreateTodoInput, ListId, Todo, TodoId, TodoList, UpdateTodoInput } from '@/domain/types';
import { toUserSummary } from '@/domain/types';
import type { DocumentStore } from '../storage/DocumentStore';
import type { AuthService, TodosService } from '../types';
import { paths } from './collections';
import { nowISO, requireUser } from './session';

export class LocalTodosService implements TodosService {
  constructor(
    private readonly store: DocumentStore,
    private readonly auth: AuthService,
  ) {}

  async getTodos(listId: ListId): Promise<Todo[]> {
    const { list, user } = await this.context(listId);
    assertCanRead(list, user.id);
    return this.store.query<Todo>(paths.todos(listId));
  }

  async createTodo(listId: ListId, input: CreateTodoInput, id: TodoId = nanoid(14) as TodoId): Promise<Todo> {
    const { list, user } = await this.context(listId);
    assertCanWrite(list, user.id);
    const title = input.title.trim();
    if (!title) throw new AppError('invalid-argument', 'taskTitleRequired');
    const now = nowISO();
    const todo: Todo = {
      id,
      listId,
      title,
      notes: input.notes ?? '',
      priority: input.priority ?? 'none',
      dueAt: input.dueAt ?? null,
      dueHasTime: input.dueHasTime ?? false,
      completed: false,
      completedAt: null,
      completedBy: null,
      createdAt: now,
      createdBy: toUserSummary(user),
      updatedAt: now,
      updatedBy: user.id,
    };
    await this.store.set(paths.todo(listId, id), todo);
    return todo;
  }

  async updateTodo(listId: ListId, todoId: TodoId, input: UpdateTodoInput): Promise<Todo> {
    const { list, user } = await this.context(listId);
    assertCanWrite(list, user.id);
    const todo = await this.store.get<Todo>(paths.todo(listId, todoId));
    if (!todo) throw new AppError('not-found', 'taskNotFound');
    if (input.title !== undefined && !input.title.trim()) {
      throw new AppError('invalid-argument', 'taskTitleRequired');
    }
    const now = nowISO();
    const completionChanged = input.completed !== undefined && input.completed !== todo.completed;
    const updated: Todo = {
      ...todo,
      ...input,
      title: input.title?.trim() ?? todo.title,
      ...(completionChanged && {
        completedAt: input.completed ? now : null,
        completedBy: input.completed ? user.id : null,
      }),
      updatedAt: now,
      updatedBy: user.id,
    };
    await this.store.set(paths.todo(listId, todoId), updated);
    return updated;
  }

  async deleteTodo(listId: ListId, todoId: TodoId): Promise<void> {
    const { list, user } = await this.context(listId);
    assertCanWrite(list, user.id);
    await this.store.delete(paths.todo(listId, todoId));
  }

  async clearCompleted(listId: ListId): Promise<void> {
    const { list, user } = await this.context(listId);
    assertCanWrite(list, user.id);
    const todos = await this.store.query<Todo>(paths.todos(listId), [{ field: 'completed', op: '==', value: true }]);
    await this.store.batch(todos.map((todo) => ({ type: 'delete', path: paths.todo(listId, todo.id) })));
  }

  watchTodos(listId: ListId, onChange: () => void) {
    return this.store.subscribe(`${paths.todos(listId)}/`, onChange);
  }

  private async context(listId: ListId) {
    const user = requireUser(this.auth);
    const list = await this.store.get<TodoList>(paths.list(listId));
    if (!list) throw new AppError('not-found', 'listNotFound');
    return { list, user };
  }
}
