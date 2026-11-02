/**
 * Minimal document database contract modelled after Cloud Firestore.
 *
 * Paths alternate collection/document segments:
 *   `lists/{listId}`, `lists/{listId}/todos/{todoId}`, `invitations/{invitationId}`.
 *
 * The local implementation persists into `localStorage`; a Firestore implementation can map
 * every method 1:1 (`getDoc`, `setDoc`, `updateDoc`, `deleteDoc`, `query + where`, `writeBatch`, `onSnapshot`).
 */

export type DocumentData = object;

export type WhereOperator = '==' | '!=' | 'array-contains' | 'in';

export interface WhereClause<T extends DocumentData> {
  field: Extract<keyof T, string>;
  op: WhereOperator;
  value: unknown;
}

export const where = <T extends DocumentData>(
  field: Extract<keyof T, string>,
  op: WhereOperator,
  value: unknown,
): WhereClause<T> => ({ field, op, value });

export type BatchOperation =
  | { type: 'set'; path: string; data: DocumentData }
  | { type: 'update'; path: string; data: DocumentData }
  | { type: 'delete'; path: string };

export interface DocumentChange {
  path: string;
  type: 'set' | 'delete';
}

export type Unsubscribe = () => void;

export interface DocumentStore {
  get<T extends DocumentData>(path: string): Promise<T | null>;
  set<T extends DocumentData>(path: string, data: T): Promise<void>;
  /** Shallow-merges `data` into an existing document; fails when it doesn't exist. */
  update<T extends DocumentData>(path: string, data: Partial<T>): Promise<void>;
  delete(path: string): Promise<void>;
  /** Lists direct documents of a collection (not nested sub-collections). */
  query<T extends DocumentData>(collectionPath: string, clauses?: WhereClause<T>[]): Promise<T[]>;
  /** Applies all operations atomically. */
  batch(operations: BatchOperation[]): Promise<void>;
  /** Notifies about changes of any document whose path starts with `pathPrefix`. */
  subscribe(pathPrefix: string, listener: (change: DocumentChange) => void): Unsubscribe;
}

export const docPath = (...segments: string[]): string => segments.join('/');
