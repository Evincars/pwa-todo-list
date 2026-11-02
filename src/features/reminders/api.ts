import { notifications } from '@mantine/notifications';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { reminderIdOf, type ISODateString, type ListId, type Reminder, type ReminderId, type TodoId, type UserId } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/authStore';
import { optimisticHandlers } from '@/lib/optimistic';
import { queryKeys } from '@/lib/queryKeys';
import { requestNotificationPermission } from '@/lib/systemNotifications';
import { useLiveInvalidation } from '@/lib/useLiveInvalidation';
import { useServices } from '@/services/ServicesContext';
import type { Services } from '@/services/types';

export const remindersQueryOptions = (services: Services, userId: UserId) =>
  queryOptions({
    queryKey: queryKeys.reminders.mine(userId),
    queryFn: () => services.reminders.getMyReminders(),
  });

export const useMyRemindersQuery = () => {
  const services = useServices();
  const user = useCurrentUser();
  useLiveInvalidation(
    queryKeys.reminders.mine(user.id),
    // The key contains the uid, so the subscription is renewed when the user changes.
    useCallback((cb: () => void) => services.reminders.watchMyReminders(cb), [services]),
  );
  return useQuery(remindersQueryOptions(services, user.id));
};

/** Reminders of one list keyed by task id. */
export const useListReminders = (listId: ListId): ReadonlyMap<TodoId, Reminder> => {
  const { data } = useMyRemindersQuery();
  return useMemo(() => new Map((data ?? []).filter((r) => r.listId === listId).map((r) => [r.todoId, r])), [data, listId]);
};

const warnIfBlocked = async () => {
  const support = await requestNotificationPermission();
  if (support === 'granted') return;
  const message =
    support === 'ios-needs-install'
      ? 'On iPhone and iPad, add the app to your Home Screen (Share → Add to Home Screen) to get system notifications.'
      : support === 'denied'
        ? 'Notifications are blocked for this site. Reminders will only show while the app is open – allow them in browser settings.'
        : support === 'unsupported'
          ? 'This browser does not support notifications. Reminders will only show while the app is open.'
          : 'Notifications were not allowed. Reminders will only show while the app is open.';
  notifications.show({ id: 'notification-permission', title: 'Reminder saved', message, color: 'yellow', autoClose: 8000 });
};

export interface SetReminderVariables {
  listId: ListId;
  todoId: TodoId;
  remindAt: ISODateString;
}

export const useSetReminder = () => {
  const services = useServices();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const mutation = useMutation({
    mutationFn: ({ listId, todoId, remindAt }: SetReminderVariables) => services.reminders.setReminder(listId, todoId, remindAt),
    ...optimisticHandlers<Reminder[], SetReminderVariables>(queryClient, queryKeys.reminders.mine(user.id), (current, input) => {
      const id = reminderIdOf(input.listId, input.todoId);
      const now = new Date().toISOString();
      const existing = current.find((reminder) => reminder.id === id);
      const next: Reminder = { id, userId: user.id, ...input, firedAt: null, createdAt: existing?.createdAt ?? now, updatedAt: now };
      return [...current.filter((reminder) => reminder.id !== id), next];
    }),
  });

  /** Asks for notification permission first – must be called from a user gesture. */
  const setReminder = (variables: SetReminderVariables) => {
    void warnIfBlocked();
    mutation.mutate(variables);
  };
  return { ...mutation, setReminder };
};

export const useRemoveReminder = () => {
  const services = useServices();
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  return useMutation({
    mutationFn: (reminderId: ReminderId) => services.reminders.removeReminder(reminderId),
    ...optimisticHandlers<Reminder[], ReminderId>(queryClient, queryKeys.reminders.mine(user.id), (current, reminderId) =>
      current.filter((reminder) => reminder.id !== reminderId),
    ),
  });
};
