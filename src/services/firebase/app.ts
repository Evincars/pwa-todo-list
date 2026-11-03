import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const env = import.meta.env;

export const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** Firebase app, Auth and Firestore with an offline cache shared by all open tabs (PWA). */
export const initFirebase = () => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    // Optional domain fields (e.g. `ListMember.invitationId`) may be undefined.
    ignoreUndefinedProperties: true,
  });

  const emulator = env.VITE_FIREBASE_EMULATOR_HOST;
  if (emulator) {
    const [host = 'localhost', port = '8080'] = emulator.split(':');
    connectFirestoreEmulator(db, host, Number(port));
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  }
  return { app, auth, db };
};

export type FirebaseHandles = ReturnType<typeof initFirebase>;
