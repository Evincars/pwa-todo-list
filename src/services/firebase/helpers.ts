import { FirebaseError } from 'firebase/app';
import {
  collection,
  doc,
  DocumentReference,
  onSnapshot,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type FirestoreDataConverter,
  type PartialWithFieldValue,
  type WithFieldValue,
  type Query,
} from 'firebase/firestore';
import { AppError, isAppError, type AppErrorCode, type AppErrorReason } from '@/domain/errors';
import type { Unsubscribe } from '../types';

/** Domain documents are stored as-is (plain JSON, ISO date strings); the converter only adds typing. */
const converter = <T extends DocumentData>(): FirestoreDataConverter<T, T> => ({
  // Identity in both directions; the overloads (full / merge writes) only differ in typing.
  toFirestore: (value: WithFieldValue<T> | PartialWithFieldValue<T>) => value as WithFieldValue<T>,
  fromFirestore: (snapshot) => snapshot.data() as T,
});

export const typedCollection = <T extends DocumentData>(db: Firestore, path: string, ...segments: string[]): CollectionReference<T, T> =>
  collection(db, path, ...segments).withConverter(converter<T>());

export const typedDoc = <T extends DocumentData>(db: Firestore, path: string, ...segments: string[]): DocumentReference<T, T> =>
  doc(db, path, ...segments).withConverter(converter<T>());

const ERROR_MAP: Record<string, [AppErrorCode, AppErrorReason]> = {
  'permission-denied': ['permission-denied', 'noAccess'],
  'not-found': ['not-found', 'documentNotFound'],
  unauthenticated: ['unauthenticated', 'signInRequired'],
  unavailable: ['failed-precondition', 'offline'],
  'auth/network-request-failed': ['failed-precondition', 'offline'],
  'auth/popup-closed-by-user': ['cancelled', 'signInCancelled'],
  'auth/cancelled-popup-request': ['cancelled', 'signInCancelled'],
  'auth/user-cancelled': ['cancelled', 'signInCancelled'],
  'auth/popup-blocked': ['failed-precondition', 'popupBlocked'],
  // One account per e-mail: the same address already signed in with Google (or vice versa).
  'auth/account-exists-with-different-credential': ['failed-precondition', 'accountExistsWithOtherProvider'],
  'auth/unauthorized-domain': ['failed-precondition', 'unauthorizedDomain'],
  'auth/operation-not-allowed': ['failed-precondition', 'providerDisabled'],
};

/** Translates Firebase errors into domain errors the UI knows how to show. */
export const toAppError = (error: unknown): unknown => {
  if (isAppError(error) || !(error instanceof FirebaseError)) return error;
  const mapped = ERROR_MAP[error.code];
  return mapped ? new AppError(mapped[0], mapped[1]) : error;
};

/** Wraps a Firebase call so it only ever rejects with domain errors. */
export const guard = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw toAppError(error);
  }
};

/**
 * Real-time listener feeding `useLiveInvalidation`: calls `onChange` for every change. Only an
 * initial snapshot served from the local cache is skipped (the query just fetched fresher data) –
 * an initial server snapshot may already contain changes made after that fetch. Errors – e.g.
 * access revoked – also trigger a refetch, which then surfaces the error.
 */
export const watch = (target: Query | DocumentReference, onChange: () => void): Unsubscribe => {
  let initial = true;
  const next = (snapshot: { metadata: { fromCache: boolean } }) => {
    const skip = initial && snapshot.metadata.fromCache;
    initial = false;
    if (!skip) onChange();
  };
  return target instanceof DocumentReference
    ? onSnapshot(target, next, () => onChange())
    : onSnapshot(target, next, () => onChange());
};

export { nowISO } from '../session';
