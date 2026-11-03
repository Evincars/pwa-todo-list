/**
 * Runs `then` once a mutation succeeds – even if the calling component unmounted meanwhile.
 * TanStack Query skips `mutate(…, { onSuccess })` for unmounted observers, and live updates
 * (Firestore's latency compensation) often remove the triggering UI before the server confirms,
 * e.g. an accepted invitation card or a deleted list's page. Errors are already shown by the
 * global `MutationCache` handler, so the rejection is just consumed here.
 */
export const afterSuccess = <T>(mutation: Promise<T>, then: (result: T) => unknown): void => {
  mutation.then(then, () => undefined);
};
