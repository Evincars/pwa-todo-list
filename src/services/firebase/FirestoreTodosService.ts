import { deleteDoc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch, type Firestore } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { AppError } from '@/domain/errors';
import type { CreateTodoInput, ListId, Todo, TodoId, UpdateTodoInput } from '@/domain/types';
import { toUserSummary } from '@/domain/types';
import { requireUser } from '../session';
import type { AuthService, TodosService } from '../types';
import { guard, nowISO, typedCollection, typedDoc, watch } from './helpers';

/** Todos live in `lists/{listId}/todos`; the rules derive read/write access from the parent list. */
export class FirestoreTodosService implements TodosService {
  constructor(
    private readonly db: Firestore,
    private readonly auth: AuthService,
  ) {}

  private todos = (listId: ListId) => typedCollection<Todo>(this.db, 'lists', listId, 'todos');
  private todoRef = (listId: ListId, todoId: TodoId) => typedDoc<Todo>(this.db, 'lists', listId, 'todos', todoId);

  getTodos = (listId: ListId) =>
    guard(async () => {
      requireUser(this.auth);
      return (await getDocs(this.todos(listId))).docs.map((d) => d.data());
    });

  createTodo = (listId: ListId, input: CreateTodoInput, id: TodoId = nanoid(14) as TodoId) =>
    guard(async () => {
      const user = requireUser(this.auth);
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
      await setDoc(this.todoRef(listId, id), todo);
      return todo;
    });

  updateTodo = (listId: ListId, todoId: TodoId, input: UpdateTodoInput) =>
    guard(async () => {
      const user = requireUser(this.auth);
      const ref = this.todoRef(listId, todoId);
      const todo = (await getDoc(ref)).data();
      if (!todo) throw new AppError('not-found', 'taskNotFound');
      if (input.title !== undefined && !input.title.trim()) throw new AppError('invalid-argument', 'taskTitleRequired');
      const now = nowISO();
      const completionChanged = input.completed !== undefined && input.completed !== todo.completed;
      const changes: Partial<Todo> = {
        ...input,
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(completionChanged && {
          completedAt: input.completed ? now : null,
          completedBy: input.completed ? user.id : null,
        }),
        updatedAt: now,
        updatedBy: user.id,
      };
      await updateDoc(ref, changes);
      return { ...todo, ...changes };
    });

  deleteTodo = (listId: ListId, todoId: TodoId) =>
    guard(async () => {
      requireUser(this.auth);
      await deleteDoc(this.todoRef(listId, todoId));
    });

  clearCompleted = (listId: ListId) =>
    guard(async () => {
      requireUser(this.auth);
      const completed = await getDocs(query(this.todos(listId), where('completed', '==', true)));
      const batch = writeBatch(this.db);
      completed.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    });

  watchTodos(listId: ListId, onChange: () => void) {
    return watch(this.todos(listId), onChange);
  }
}
