import type { QueryClient, QueryKey } from '@tanstack/react-query';

export interface OptimisticContext<T> {
  previous: T | undefined;
}

/**
 * Builds `onMutate` / `onError` / `onSettled` handlers that optimistically
 * apply `update` to the cached value under `queryKey` and roll back on failure.
 */
export const optimisticHandlers = <TData, TVariables>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  update: (current: TData, variables: TVariables) => TData,
) => ({
  onMutate: async (variables: TVariables): Promise<OptimisticContext<TData>> => {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData<TData>(queryKey);
    if (previous !== undefined) queryClient.setQueryData<TData>(queryKey, update(previous, variables));
    return { previous };
  },
  onError: (_error: unknown, _variables: TVariables, context: OptimisticContext<TData> | undefined) => {
    if (context?.previous !== undefined) queryClient.setQueryData(queryKey, context.previous);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey }),
});
