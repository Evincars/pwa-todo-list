import { AppError } from '@/domain/errors';
import type { AuthProviderId, UserId, UserProfile } from '@/domain/types';
import type { DocumentStore } from '../storage/DocumentStore';
import type { AuthService, SignInResult, Unsubscribe } from '../types';
import { paths } from './collections';
import { enabledProviders } from '../providers';
import { nowISO } from '../session';

export interface MockAccount {
  displayName: string;
  email: string;
  /** Provider profile photo (Google: `user.photoURL`; Apple never provides one). */
  photoURL?: string | null;
}

/**
 * Stands in for the provider popup (Google / Apple account chooser).
 * Resolves with the chosen account or `null` when the dialog was dismissed.
 */
export type MockAccountPicker = (provider: AuthProviderId) => Promise<MockAccount | null>;

const SESSION_KEY = 'shared-todo/session';

/** Stable, email-derived uid so the same person gets the same id across providers (like Firebase account linking). */
const uidFromEmail = (email: string): UserId => {
  let hash = 0x811c9dc5;
  for (const char of email.trim().toLowerCase()) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return `u_${(hash >>> 0).toString(36)}` as UserId;
};

export class MockAuthService implements AuthService {
  private currentUser: UserProfile | null = null;
  private readonly listeners = new Set<(user: UserProfile | null) => void>();
  private accountPicker: MockAccountPicker | null = null;
  readonly providers: readonly AuthProviderId[] = enabledProviders();

  constructor(private readonly store: DocumentStore) {}

  /** Registered by the UI (see `MockAccountPickerHost`). */
  setAccountPicker(picker: MockAccountPicker | null) {
    this.accountPicker = picker;
  }

  async initialize(): Promise<UserProfile | null> {
    const userId = localStorage.getItem(SESSION_KEY) as UserId | null;
    this.currentUser = userId ? await this.store.get<UserProfile>(paths.user(userId)) : null;
    return this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async signIn(provider: AuthProviderId): Promise<SignInResult> {
    if (!this.accountPicker) throw new AppError('failed-precondition', 'accountPickerUnavailable');
    const account = await this.accountPicker(provider);
    if (!account) throw new AppError('cancelled', 'signInCancelled');

    const email = account.email.trim().toLowerCase();
    const id = uidFromEmail(email);
    const existing = await this.store.get<UserProfile>(paths.user(id));
    const now = nowISO();
    const user: UserProfile = {
      id,
      email,
      provider,
      displayName: account.displayName.trim() || email.split('@')[0] || email,
      // Refreshed on every sign-in, like Firebase does with the provider's profile.
      photoURL: provider === 'apple' ? null : (account.photoURL ?? null),
      createdAt: existing?.createdAt ?? now,
      lastLoginAt: now,
    };
    await this.store.set(paths.user(id), user);
    localStorage.setItem(SESSION_KEY, id);
    this.setUser(user);
    return { user, isNewUser: !existing };
  }

  async signOut() {
    localStorage.removeItem(SESSION_KEY);
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
