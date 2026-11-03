import { enabledProviders } from '../providers';
import type { Services } from '../types';
import { initFirebase } from './app';
import { FirebaseAuthService } from './FirebaseAuthService';
import { FirestoreInvitationsService } from './FirestoreInvitationsService';
import { FirestoreListsService } from './FirestoreListsService';
import { FirestoreRemindersService } from './FirestoreRemindersService';
import { FirestoreTodosService } from './FirestoreTodosService';

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
