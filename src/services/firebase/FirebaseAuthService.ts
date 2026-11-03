import {
  getAdditionalUserInfo,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type AuthProvider,
  type User,
} from 'firebase/auth';
import { setDoc, type Firestore } from 'firebase/firestore';
import type { AuthProviderId, UserId, UserProfile } from '@/domain/types';
import type { AuthService, SignInResult, Unsubscribe } from '../types';
import { guard, nowISO, typedDoc } from './helpers';

const PROVIDER_IDS: Record<string, AuthProviderId> = { 'google.com': 'google', 'apple.com': 'apple' };

const createProvider = (provider: AuthProviderId): AuthProvider => {
  if (provider === 'google') {
    const google = new GoogleAuthProvider();
    google.setCustomParameters({ prompt: 'select_account' });
    return google;
  }
  const apple = new OAuthProvider('apple.com');
  apple.addScope('email');
  apple.addScope('name');
  return apple;
};

/** Google serves 96 px avatars by default – ask for a sharper one. */
const sharperPhoto = (url: string | null) => url?.replace(/=s\d+-c$/, '=s192-c') ?? null;

/**
 * Built purely from the Firebase user, so a signed-in session restores offline.
 * Apple never shares a photo – the UI falls back to initials.
 */
const toProfile = (user: User): UserProfile => {
  const email = (user.email ?? '').toLowerCase();
  const providerId = user.providerData[0]?.providerId ?? 'google.com';
  return {
    id: user.uid as UserId,
    email,
    displayName: user.displayName?.trim() || email.split('@')[0] || 'User',
    photoURL: sharperPhoto(user.photoURL),
    provider: PROVIDER_IDS[providerId] ?? 'google',
    createdAt: new Date(user.metadata.creationTime ?? Date.now()).toISOString(),
    lastLoginAt: nowISO(),
  };
};

export class FirebaseAuthService implements AuthService {
  private currentUser: UserProfile | null = null;
  private readonly listeners = new Set<(user: UserProfile | null) => void>();

  constructor(
    private readonly auth: Auth,
    private readonly db: Firestore,
    readonly providers: readonly AuthProviderId[],
  ) {}

  async initialize(): Promise<UserProfile | null> {
    await this.auth.authStateReady();
    this.currentUser = this.auth.currentUser ? toProfile(this.auth.currentUser) : null;
    // Sign-outs elsewhere (another tab, revoked session) – sign-ins go through `signIn`.
    onAuthStateChanged(this.auth, (user) => {
      if (!user && this.currentUser) this.setUser(null);
    });
    return this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async signIn(provider: AuthProviderId): Promise<SignInResult> {
    return guard(async () => {
      // Popup rather than redirect: redirects break on hosts other than *.firebaseapp.com
      // (third-party storage partitioning), e.g. GitHub Pages.
      const result = await signInWithPopup(this.auth, createProvider(provider));
      const user = toProfile(result.user);
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
      // Profile is refreshed on every sign-in (name / photo changes at Google).
      await setDoc(typedDoc<UserProfile>(this.db, 'users', user.id), user, { merge: true });
      this.setUser(user);
      return { user, isNewUser };
    });
  }

  async signOut() {
    await signOut(this.auth);
    this.setUser(null);
  }

  onAuthStateChanged(listener: (user: UserProfile | null) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setUser(user: UserProfile | null) {
    this.currentUser = user;
    this.listeners.forEach((listener) => listener(user));
  }
}
