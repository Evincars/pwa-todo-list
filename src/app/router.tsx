import type { QueryClient } from '@tanstack/react-query';
import { createHashHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import type { Services } from '@/services/types';
import { RouteError, RouteNotFound, RoutePending } from './RouteFallbacks';

export interface RouterContext {
  queryClient: QueryClient;
  services: Services;
}

export const createAppRouter = (context: RouterContext) =>
  createRouter({
    routeTree,
    context,
    // Hash history → deep links (e.g. invitations) work on any static host / GitHub Pages.
    history: createHashHistory(),
    defaultPreload: 'intent',
    // Let TanStack Query own caching; the router just triggers `ensureQueryData`.
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: RoutePending,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: RouteNotFound,
    scrollRestoration: true,
  });

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
