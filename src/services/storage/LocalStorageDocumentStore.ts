import { AppError } from '@/domain/errors';
import type {
  BatchOperation,
  DocumentChange,
  DocumentData,
  DocumentStore,
  Unsubscribe,
  WhereClause,
} from './DocumentStore';

export interface LocalStorageDocumentStoreOptions {
  /** Key prefix, lets several apps/versions share one origin. */
  namespace?: string;
  /** Artificial latency (ms) to emulate network round-trips and surface loading states. */
  latency?: number;
  storage?: Storage;
}

const segmentCount = (path: string) => path.split('/').length;

const matches = <T extends DocumentData>(doc: T, { field, op, value }: WhereClause<T>): boolean => {
  const actual: unknown = doc[field];
  switch (op) {
    case '==':
      return actual === value;
    case '!=':
      return actual !== value;
    case 'array-contains':
      return Array.isArray(actual) && actual.includes(value);
    case 'in':
      return Array.isArray(value) && value.includes(actual);
  }
};

/**
 * `DocumentStore` persisted into `localStorage` – one key per document.
 * Changes are broadcast within the tab and across tabs (via the `storage` event),
 * which emulates Firestore real-time listeners well enough for local development.
 */
export class LocalStorageDocumentStore implements DocumentStore {
  private readonly prefix: string;
  private readonly latency: number;
  private readonly storage: Storage;
  private readonly listeners = new Set<{ prefix: string; listener: (change: DocumentChange) => void }>();

  constructor({ namespace = 'shared-todo/v1', latency = 120, storage = window.localStorage }: LocalStorageDocumentStoreOptions = {}) {
    this.prefix = `${namespace}:`;
    this.latency = latency;
    this.storage = storage;
    window.addEventListener('storage', this.handleStorageEvent);
  }

  async get<T extends DocumentData>(path: string): Promise<T | null> {
    await this.delay();
    return this.read<T>(path);
  }

  async set<T extends DocumentData>(path: string, data: T): Promise<void> {
    await this.delay();
    this.write(path, data);
    this.emit({ path, type: 'set' });
  }

  async update<T extends DocumentData>(path: string, data: Partial<T>): Promise<void> {
    await this.delay();
    this.applyUpdate(path, data);
    this.emit({ path, type: 'set' });
  }

  async delete(path: string): Promise<void> {
    await this.delay();
    this.storage.removeItem(this.key(path));
    this.emit({ path, type: 'delete' });
  }

  async query<T extends DocumentData>(collectionPath: string, clauses: WhereClause<T>[] = []): Promise<T[]> {
    await this.delay();
    const collectionPrefix = this.key(`${collectionPath}/`);
    const depth = segmentCount(collectionPath) + 1;
    const results: T[] = [];

    for (let index = 0; index < this.storage.length; index++) {
      const key = this.storage.key(index);
      if (!key?.startsWith(collectionPrefix)) continue;
      const path = key.slice(this.prefix.length);
      if (segmentCount(path) !== depth) continue;
      const doc = this.read<T>(path);
      if (doc && clauses.every((clause) => matches(doc, clause))) results.push(doc);
    }
    return results;
  }

  async batch(operations: BatchOperation[]): Promise<void> {
    await this.delay();
    // Validate first so the batch is all-or-nothing.
    for (const op of operations) {
      if (op.type === 'update' && !this.storage.getItem(this.key(op.path))) {
        throw new AppError('not-found', `Document ${op.path} does not exist`);
      }
    }
    for (const op of operations) {
      if (op.type === 'set') this.write(op.path, op.data);
      else if (op.type === 'update') this.applyUpdate(op.path, op.data);
      else this.storage.removeItem(this.key(op.path));
    }
    operations.forEach((op) => this.emit({ path: op.path, type: op.type === 'delete' ? 'delete' : 'set' }));
  }

  subscribe(pathPrefix: string, listener: (change: DocumentChange) => void): Unsubscribe {
    const entry = { prefix: pathPrefix, listener };
    this.listeners.add(entry);
    return () => this.listeners.delete(entry);
  }

  /** Removes every document of this namespace. */
  clear(): void {
    const keys: string[] = [];
    for (let index = 0; index < this.storage.length; index++) {
      const key = this.storage.key(index);
      if (key?.startsWith(this.prefix)) keys.push(key);
    }
    keys.forEach((key) => this.storage.removeItem(key));
    keys.forEach((key) => this.emit({ path: key.slice(this.prefix.length), type: 'delete' }));
  }

  private key(path: string) {
    return `${this.prefix}${path}`;
  }

  private read<T extends DocumentData>(path: string): T | null {
    const raw = this.storage.getItem(this.key(path));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private write(path: string, data: DocumentData) {
    this.storage.setItem(this.key(path), JSON.stringify(data));
  }

  private applyUpdate(path: string, data: DocumentData) {
    const existing = this.read(path);
    if (!existing) throw new AppError('not-found', `Document ${path} does not exist`);
    this.write(path, { ...existing, ...data });
  }

  private emit(change: DocumentChange) {
    this.listeners.forEach(({ prefix, listener }) => {
      if (change.path.startsWith(prefix)) listener(change);
    });
  }

  private readonly handleStorageEvent = (event: StorageEvent) => {
    if (event.storageArea !== this.storage || !event.key?.startsWith(this.prefix)) return;
    this.emit({ path: event.key.slice(this.prefix.length), type: event.newValue === null ? 'delete' : 'set' });
  };

  private delay() {
    return this.latency > 0 ? new Promise<void>((resolve) => setTimeout(resolve, this.latency)) : Promise.resolve();
  }
}
