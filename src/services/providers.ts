import { AUTH_PROVIDERS, type AuthProviderId } from '@/domain/types';

const DEFAULT_PROVIDERS: readonly AuthProviderId[] = ['google', 'facebook'];

/**
 * Sign-in buttons shown on the login screen, from `VITE_AUTH_PROVIDERS` (e.g. `google,facebook`).
 * Providers left out stay implemented, just hidden – Apple needs a paid Apple Developer account.
 */
export const enabledProviders = (configured = import.meta.env.VITE_AUTH_PROVIDERS): AuthProviderId[] => {
  if (!configured) return [...DEFAULT_PROVIDERS];
  const requested = configured.split(',').map((value) => value.trim());
  const providers = AUTH_PROVIDERS.filter((provider) => requested.includes(provider));
  return providers.length ? providers : [...DEFAULT_PROVIDERS];
};
