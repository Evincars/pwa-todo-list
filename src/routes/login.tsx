import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { useAuthStore } from '@/features/auth/authStore';
import { LoginPage } from '@/features/auth/pages/LoginPage';

/** Only allow in-app relative redirects (prevents open redirects). */
const safeRedirect = z
  .string()
  .refine((value) => value.startsWith('/') && !value.startsWith('//'))
  .optional()
  .catch(undefined);

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: safeRedirect }),
  beforeLoad: ({ search }) => {
    if (useAuthStore.getState().user) throw redirect({ href: search.redirect ?? '/' });
  },
  component: LoginPage,
});
