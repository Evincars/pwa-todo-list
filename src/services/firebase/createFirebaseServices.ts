import type { AuthProviderId } from '@/domain/types';
import type { Services } from '../types';
import { initFirebase } from './app';
import { FirebaseAuthService } from './FirebaseAuthService';
import { FirestoreInvitationsService } from './FirestoreInvitationsService';
import { FirestoreListsService } from './FirestoreListsService';
import { FirestoreRemindersService } from './FirestoreRemindersService';
import { FirestoreTodosService } from './FirestoreTodosService';

const KNOWN_PROVIDERS: readonly AuthProviderId[] = ['google', 'apple'];

/** `VITE_AUTH_PROVIDERS=google,apple` – only providers enabled in the Firebase console. */
const enabledProviders = (): AuthProviderId[] => {
  const configured = (import.meta.env.VITE_AUTH_PROVIDERS ?? 'google').split(',').map((value) => value.trim());
  const providers = KNOWN_PROVIDERS.filter((provider) => configured.includes(provider));
  return providers.length ? providers : ['google'];
};

export const createFirebaseServices = (): Services => {
  const { auth: firebaseAuth, db } = initFirebase();
  const auth = new FirebaseAuthService(firebaseAuth, db, enabledProviders());
  return {
    backend: 'firebase',
    auth,
    lists: new FirestoreListsService(db, auth),
    todos: new FirestoreTodosService(db, auth),
    invitations: new FirestoreInvitationsService(db, auth),
    reminders: new FirestoreRemindersService(db, auth),
  };
};
