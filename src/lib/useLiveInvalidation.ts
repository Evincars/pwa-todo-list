import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Unsubscribe } from '@/services/types';

/**
 * Keeps a query fresh by invalidating it whenever the backend reports a change
 * (local store events today, Firestore `onSnapshot` later).
 */
export const useLiveInvalidation = (
  queryKey: QueryKey,
  subscribe: ((onChange: () => void) => Unsubscribe) | null,
) => {
  const queryClient = useQueryClient();
  const serializedKey = JSON.stringify(queryKey);

  useEffect(() => {
    if (!subscribe) return;
    return subscribe(() => void queryClient.invalidateQueries({ queryKey: JSON.parse(serializedKey) as QueryKey }));
  }, [queryClient, serializedKey, subscribe]);
};
