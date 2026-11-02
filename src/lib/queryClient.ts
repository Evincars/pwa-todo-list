import { MutationCache, QueryClient } from '@tanstack/react-query';
import { isAppError, isCancelled } from '@/domain/errors';
import { notify } from './notify';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Message shown on success. */
      successMessage?: string;
      /** Skip the global error toast (handled locally). */
      silent?: boolean;
    };
  }
}

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) =>
          // Domain errors (not found, permission denied…) won't fix themselves on retry.
          !isAppError(error) && failureCount < 2,
      },
    },
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        if (mutation.meta?.successMessage) notify.success(mutation.meta.successMessage);
      },
      onError: (error, _variables, _context, mutation) => {
        if (!mutation.meta?.silent && !isCancelled(error)) notify.error(error);
      },
    }),
  });
