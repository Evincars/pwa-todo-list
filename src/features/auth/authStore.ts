import { create } from 'zustand';
import type { UserProfile } from '@/domain/types';
import type { AuthService } from '@/services/types';

interface AuthState {
  user: UserProfile | null;
  /**
   * Last signed-in user. Authenticated screens stay mounted for a moment after sign-out
   * (until navigation to /login completes) and must not crash in between.
   */
  lastUser: UserProfile | null;
  initialized: boolean;
}

/** Reactive mirror of the auth service – the service stays the source of truth. */
export const useAuthStore = create<AuthState>()(() => ({ user: null, lastUser: null, initialized: false }));

const setUser = (user: UserProfile | null) =>
  useAuthStore.setState((state) => ({ user, lastUser: user ?? state.lastUser }));

export const bindAuthStore = async (auth: AuthService) => {
  setUser(await auth.initialize());
  useAuthStore.setState({ initialized: true });
  return auth.onAuthStateChanged(setUser);
};

/** For components rendered under the authenticated layout. */
export const useCurrentUser = (): UserProfile => {
  const user = useAuthStore((state) => state.user ?? state.lastUser);
  if (!user) throw new Error('useCurrentUser used outside of an authenticated route');
  return user;
};
