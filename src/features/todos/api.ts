import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { useCallback } from 'react';
import { useCurrentUser } from '@/features/auth/authStore';
import type { CreateTodoInput, ListId, Todo, TodoId, UpdateTodoInput } from '@/domain/types';
import { toUserSummary } from '@/domain/types';
import { optimisticHandlers } from '@/lib/optimistic';
import { queryKeys } from '@/lib/queryKeys';
import { useLiveInvalidation } from '@/lib/useLiveInvalidation';
import { useServices } from '@/services/ServicesContext';
import type { Services } from '@/services/types';

export const todosQueryOptions = (services: Services, listId: ListId) =>
  queryOptions({
    queryKey: queryKeys.todos.byList(listId),
    queryFn: () => services.todos.getTodos(listId),
  });

export const useTodosQuery = (listId: ListId) => {
  const services = useServices();
  useLiveInvalidation(
    queryKeys.todos.byList(listId),
    useCallback((cb: () => void) => services.todos.watchTodos(listId, cb), [services, listId]),
  );
  return useQuery(todosQueryOptions(services, listId));
};

export interface CreateTodoVariables extends CreateTodoInput {
  id: TodoId;
}

export const useCreateTodo = (listId: ListId) => {
  const { todos } = useServices();
  const queryClient = useQueryClient();
  const user = useCurrentUser();

  const mutation = useMutation({
    mutationFn: ({ id, ...input }: CreateTodoVariables) => todos.createTodo(listId, input, id),
    ...optimisticHandlers<Todo[], CreateTodoVariables>(queryClient, queryKeys.todos.byList(listId), (current, input) => {
      const now = new Date().toISOString();
      const optimistic: Todo = {
        id: input.id,
        listId,
        title: input.title.trim(),
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
      return [...current, optimistic];
    }),
  });

  /** Client-generated id makes the optimistic item stable across the server round-trip. */
  const createTodo = (input: CreateTodoInput): TodoId => {
    const id = nanoid(14) as TodoId;
    mutation.mutate({ ...input, id });
    return id;
  };
  return { ...mutation, createTodo };
};

export interface UpdateTodoVariables {
  todoId: TodoId;
  input: UpdateTodoInput;
}

export const useUpdateTodo = (listId: ListId) => {
  const { todos } = useServices();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  return useMutation({
    mutationFn: ({ todoId, input }: UpdateTodoVariables) => todos.updateTodo(listId, todoId, input),
    ...optimisticHandlers<Todo[], UpdateTodoVariables>(
      queryClient,
      queryKeys.todos.byList(listId),
      (current, { todoId, input }) =>
        current.map((todo) => {
          if (todo.id !== todoId) return todo;
          const next: Todo = { ...todo, ...input };
          if (input.completed !== undefined && input.completed !== todo.completed) {
            next.completedAt = input.completed ? new Date().toISOString() : null;
            next.completedBy = input.completed ? user.id : null;
          }
          return next;
        }),
    ),
  });
};

export const useDeleteTodo = (listId: ListId) => {
  const { todos } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (todoId: TodoId) => todos.deleteTodo(listId, todoId),
    ...optimisticHandlers<Todo[], TodoId>(queryClient, queryKeys.todos.byList(listId), (current, todoId) =>
      current.filter((todo) => todo.id !== todoId),
    ),
  });
};

export const useClearCompleted = (listId: ListId) => {
  const { todos } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => todos.clearCompleted(listId),
    ...optimisticHandlers<Todo[], void>(queryClient, queryKeys.todos.byList(listId), (current) =>
      current.filter((todo) => !todo.completed),
    ),
    meta: { successMessage: 'list.completedCleared' },
  });
};
