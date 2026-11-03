/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_DATA_BACKEND?: 'firebase' | 'local';
  /** Comma-separated `AuthProviderId`s, e.g. `google,apple`. */
  readonly VITE_AUTH_PROVIDERS?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  /** `host:port` of the Firestore + Auth emulators (e.g. for e2e tests). */
  readonly VITE_FIREBASE_EMULATOR_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
