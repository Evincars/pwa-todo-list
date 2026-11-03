import type { AuthProviderId } from '@/domain/types';
import type { MockAccount } from '@/services/local/MockAuthService';

const avatar = (name: string) => `${import.meta.env.BASE_URL}avatars/${name}.svg`;

/**
 * Pre-baked identities so sharing can be tried out by switching accounts in one browser.
 * Like the real providers: Google and Facebook return a profile photo, Apple never shares one (→ initials).
 */
export const DEMO_ACCOUNTS: Record<AuthProviderId, MockAccount[]> = {
  google: [
    { displayName: 'Alex Morgan', email: 'alex.morgan@gmail.com', photoURL: avatar('alex') },
    { displayName: 'Sam Rivera', email: 'sam.rivera@gmail.com', photoURL: avatar('sam') },
  ],
  facebook: [{ displayName: 'Morgan Blake', email: 'morgan.blake@outlook.com', photoURL: avatar('morgan') }],
  apple: [
    { displayName: 'Jordan Lee', email: 'jordan.lee@icloud.com', photoURL: null },
    { displayName: 'Taylor Kim', email: 'taylor.kim@icloud.com', photoURL: null },
  ],
};
