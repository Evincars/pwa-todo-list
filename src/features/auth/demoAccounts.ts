import type { AuthProviderId } from '@/domain/types';
import type { MockAccount } from '@/services/local/MockAuthService';

/** Pre-baked identities so sharing can be tried out by switching accounts in one browser. */
export const DEMO_ACCOUNTS: Record<AuthProviderId, MockAccount[]> = {
  google: [
    { displayName: 'Alex Morgan', email: 'alex.morgan@gmail.com' },
    { displayName: 'Sam Rivera', email: 'sam.rivera@gmail.com' },
  ],
  apple: [
    { displayName: 'Jordan Lee', email: 'jordan.lee@icloud.com' },
    { displayName: 'Taylor Kim', email: 'taylor.kim@icloud.com' },
  ],
};
