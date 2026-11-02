import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { CreateListInput, ListId, MemberPermission, TodoList, UpdateListInput, UserId } from '@/domain/types';
import { queryKeys } from '@/lib/queryKeys';
import { useLiveInvalidation } from '@/lib/useLiveInvalidation';
import { useServices } from '@/services/ServicesContext';
import type { Services } from '@/services/types';

export const myListsQueryOptions = (services: Services) =>
  queryOptions({
    queryKey: queryKeys.lists.mine(),
    queryFn: () => services.lists.getMyLists(),
  });

export const listQueryOptions = (services: Services, listId: ListId) =>
  queryOptions({
    queryKey: queryKeys.lists.detail(listId),
    queryFn: () => services.lists.getList(listId),
  });

export const useMyListsQuery = () => {
  const services = useServices();
  useLiveInvalidation(queryKeys.lists.all, useCallback((cb: () => void) => services.lists.watchMyLists(cb), [services]));
  return useQuery(myListsQueryOptions(services));
};

export const useListQuery = (listId: ListId) => {
  const services = useServices();
  useLiveInvalidation(
    queryKeys.lists.detail(listId),
    useCallback((cb: () => void) => services.lists.watchList(listId, cb), [services, listId]),
  );
  return useQuery(listQueryOptions(services, listId));
};

/** Writes the fresh list into both the detail and the collection cache. */
const useListCacheWriter = () => {
  const queryClient = useQueryClient();
  return (list: TodoList) => {
    queryClient.setQueryData(queryKeys.lists.detail(list.id), list);
    void queryClient.invalidateQueries({ queryKey: queryKeys.lists.mine() });
  };
};

export const useCreateList = () => {
  const { lists } = useServices();
  const writeList = useListCacheWriter();
  return useMutation({
    mutationFn: (input: CreateListInput) => lists.createList(input),
    onSuccess: writeList,
  });
};

export const useUpdateList = (listId: ListId) => {
  const { lists } = useServices();
  const writeList = useListCacheWriter();
  return useMutation({
    mutationFn: (input: UpdateListInput) => lists.updateList(listId, input),
    onSuccess: writeList,
  });
};

export const useDeleteList = () => {
  const { lists } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listId: ListId) => lists.deleteList(listId),
    onSuccess: (_void, listId) => {
      queryClient.setQueryData<TodoList[]>(queryKeys.lists.mine(), (current) => current?.filter((l) => l.id !== listId));
      queryClient.removeQueries({ queryKey: queryKeys.lists.detail(listId) });
      queryClient.removeQueries({ queryKey: queryKeys.todos.byList(listId) });
    },
    meta: { successMessage: 'lists.deleted' },
  });
};

export const useLeaveList = () => {
  const { lists } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listId: ListId) => lists.leaveList(listId),
    onSuccess: (_void, listId) => {
      queryClient.setQueryData<TodoList[]>(queryKeys.lists.mine(), (current) => current?.filter((l) => l.id !== listId));
      queryClient.removeQueries({ queryKey: queryKeys.lists.detail(listId) });
    },
    meta: { successMessage: 'lists.left' },
  });
};

export const useSetMemberPermission = (listId: ListId) => {
  const { lists } = useServices();
  const writeList = useListCacheWriter();
  return useMutation({
    mutationFn: ({ userId, permission }: { userId: UserId; permission: MemberPermission }) =>
      lists.setMemberPermission(listId, userId, permission),
    onSuccess: writeList,
  });
};

export const useRemoveMember = (listId: ListId) => {
  const { lists } = useServices();
  const writeList = useListCacheWriter();
  return useMutation({
    mutationFn: (userId: UserId) => lists.removeMember(listId, userId),
    onSuccess: writeList,
    meta: { successMessage: 'share.memberRemoved' },
  });
};
