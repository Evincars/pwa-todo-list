import { LocalInvitationsService } from './local/LocalInvitationsService';
import { LocalListsService } from './local/LocalListsService';
import { LocalRemindersService } from './local/LocalRemindersService';
import { LocalTodosService } from './local/LocalTodosService';
import { MockAuthService } from './local/MockAuthService';
import { migrateLocalData } from './local/migrations';
import { DEFAULT_NAMESPACE, LocalStorageDocumentStore } from './storage/LocalStorageDocumentStore';
import type { Services } from './types';

export interface LocalServices extends Services {
  readonly backend: 'local';
  auth: MockAuthService;
  resetData(): Promise<void>;
}

export const isLocalServices = (services: Services): services is LocalServices => services.backend === 'local';

/** localStorage + mock sign-in: offline demo, tests, and trying out sharing in one browser. */
export const createLocalServices = (): LocalServices => {
  migrateLocalData(window.localStorage, DEFAULT_NAMESPACE);
  const store = new LocalStorageDocumentStore({ latency: import.meta.env.MODE === 'test' ? 0 : 150 });
  const auth = new MockAuthService(store);
  return {
    backend: 'local',
    auth,
    lists: new LocalListsService(store, auth),
    todos: new LocalTodosService(store, auth),
    invitations: new LocalInvitationsService(store, auth),
    reminders: new LocalRemindersService(store, auth),
    async resetData() {
      await auth.signOut();
      store.clear();
    },
  };
};

/**
 * Composition root of the data layer – the only place that knows which backend runs.
 * `VITE_DATA_BACKEND=firebase` (default in `.env`) loads Firestore + Firebase Auth as a separate chunk;
 * `VITE_DATA_BACKEND=local` keeps everything in this browser.
 */
export const createServices = async (): Promise<Services> => {
  if (import.meta.env.VITE_DATA_BACKEND === 'local') return createLocalServices();
  const { createFirebaseServices } = await import('./firebase/createFirebaseServices');
  return createFirebaseServices();
};
