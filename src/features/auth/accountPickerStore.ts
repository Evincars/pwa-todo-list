import { create } from 'zustand';
import type { AuthProviderId } from '@/domain/types';
import type { MockAccount, MockAccountPicker } from '@/services/local/MockAuthService';

interface PendingRequest {
  provider: AuthProviderId;
  resolve: (account: MockAccount | null) => void;
}

interface AccountPickerState {
  request: PendingRequest | null;
  pick: MockAccountPicker;
  complete: (account: MockAccount | null) => void;
}

/** Bridges the promise-based mock auth flow with a React dialog. */
export const useAccountPickerStore = create<AccountPickerState>()((set, get) => ({
  request: null,
  pick: (provider) =>
    new Promise<MockAccount | null>((resolve) => {
      get().request?.resolve(null);
      set({ request: { provider, resolve } });
    }),
  complete: (account) => {
    get().request?.resolve(account);
    set({ request: null });
  },
}));
