import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { Unsubscribe } from '@/services/types';

/**
 * Counts app resumes: back to the foreground, back online, or restored from the back/forward cache.
 * Mobile browsers (iOS Safari especially) suspend background pages and drop their connections, so a
 * listener can silently stop delivering changes until the page is reloaded.
 */
let resumes = 0;
const resumeListeners = new Set<() => void>();

const resume = () => {
  if (document.visibilityState !== 'visible') return;
  resumes += 1;
  resumeListeners.forEach((listener) => listener());
};

const resumeFromCache = (event: PageTransitionEvent) => event.persisted && resume();

const subscribeResumes = (listener: () => void) => {
  if (!resumeListeners.size) {
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    window.addEventListener('pageshow', resumeFromCache);
  }
  resumeListeners.add(listener);
  return () => {
    resumeListeners.delete(listener);
    if (resumeListeners.size) return;
    document.removeEventListener('visibilitychange', resume);
    window.removeEventListener('online', resume);
    window.removeEventListener('pageshow', resumeFromCache);
  };
};

const getResumes = () => resumes;

/**
 * Keeps a query fresh by invalidating it whenever the backend reports a change
 * (local store events, Firestore `onSnapshot`). On every app resume the subscription is
 * restarted and the query refetched, catching up on anything missed while suspended.
 */
export const useLiveInvalidation = (
  queryKey: QueryKey,
  subscribe: ((onChange: () => void) => Unsubscribe) | null,
) => {
  const queryClient = useQueryClient();
  const serializedKey = JSON.stringify(queryKey);
  const resumeCount = useSyncExternalStore(subscribeResumes, getResumes);
  const handledResume = useRef(resumeCount);

  useEffect(() => {
    if (!subscribe) return;
    const refresh = () => void queryClient.invalidateQueries({ queryKey: JSON.parse(serializedKey) as QueryKey });
    if (handledResume.current !== resumeCount) {
      handledResume.current = resumeCount;
      refresh();
    }
    return subscribe(refresh);
  }, [queryClient, serializedKey, subscribe, resumeCount]);
};
