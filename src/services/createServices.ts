import { LocalInvitationsService } from './local/LocalInvitationsService';
import { LocalListsService } from './local/LocalListsService';
import { LocalTodosService } from './local/LocalTodosService';
import { MockAuthService } from './local/MockAuthService';
import { LocalStorageDocumentStore } from './storage/LocalStorageDocumentStore';
import type { Services } from './types';

export interface LocalServices extends Services {
  auth: MockAuthService;
}

/**
 * Composition root of the data layer.
 *
 * To migrate to Firebase, add `createFirebaseServices()` returning `Services`
 * (FirebaseAuthService with Google/Apple providers + Firestore-backed services)
 * and switch the export below. Feature code only talks to the `Services` interfaces.
 */
export const createLocalServices = (): LocalServices => {
  const store = new LocalStorageDocumentStore({ latency: import.meta.env.MODE === 'test' ? 0 : 150 });
  const auth = new MockAuthService(store);
  return {
    auth,
    lists: new LocalListsService(store, auth),
    todos: new LocalTodosService(store, auth),
    invitations: new LocalInvitationsService(store, auth),
    async resetData() {
      await auth.signOut();
      store.clear();
    },
  };
};

export const services = createLocalServices();
