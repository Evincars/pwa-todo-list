import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { MockAccountPickerHost } from '@/features/auth/components/MockAccountPickerHost';
import { ServicesProvider } from '@/services/ServicesContext';
import type { Services } from '@/services/types';
import { ConfirmDialogHost } from '@/shared/ui';
import { AppThemeProvider } from './AppThemeProvider';
import { ReloadPrompt } from './ReloadPrompt';
import type { AppRouter } from './router';

const QueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })))
  : () => null;

export interface AppProps {
  router: AppRouter;
  queryClient: QueryClient;
  services: Services;
}

export const App = ({ router, queryClient, services }: AppProps) => (
  <ServicesProvider services={services}>
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <RouterProvider router={router} />
        <ConfirmDialogHost />
        <MockAccountPickerHost />
        <ReloadPrompt />
      </AppThemeProvider>
      <Suspense>
        <QueryDevtools buttonPosition="top-right" />
      </Suspense>
    </QueryClientProvider>
  </ServicesProvider>
);
