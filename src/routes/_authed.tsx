import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/features/auth/authStore';
import { useReminderScheduler } from '@/features/reminders/useReminderScheduler';

const AuthedLayout = () => {
  useReminderScheduler();
  return <Outlet />;
};

/** Guard for everything that requires a signed-in user. */
export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ location }) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw redirect({ to: '/login', search: { redirect: location.href === '/' ? undefined : location.href } });
    }
    return { user };
  },
  component: AuthedLayout,
});
