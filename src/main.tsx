import '@mantine/core/styles.layer.css';
import '@mantine/dates/styles.layer.css';
import '@mantine/notifications/styles.layer.css';
import './styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { createAppRouter } from './app/router';
import { useAccountPickerStore } from './features/auth/accountPickerStore';
import { bindAuthStore } from './features/auth/authStore';
import { createQueryClient } from './lib/queryClient';
import { services } from './services/createServices';

const bootstrap = async () => {
  const queryClient = createQueryClient();
  const router = createAppRouter({ queryClient, services });

  // Mock-only: the "provider popup" is a React dialog driven by this store.
  services.auth.setAccountPicker(useAccountPickerStore.getState().pick);
  await bindAuthStore(services.auth);

  services.auth.onAuthStateChanged((user) => {
    if (user) {
      // Re-run route guards (`beforeLoad`) for the new auth state.
      void router.invalidate();
      return;
    }
    // Signed out: start fresh at the login screen, then drop cached data so nothing leaks between accounts.
    void router.navigate({ to: '/login', search: {}, replace: true }).then(() => queryClient.clear());
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App router={router} queryClient={queryClient} services={services} />
    </StrictMode>,
  );
};

void bootstrap();
