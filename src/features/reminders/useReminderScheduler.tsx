import { Anchor } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBell } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useEffectEvent, useState } from 'react';
import type { Reminder } from '@/domain/types';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { t } from '@/i18n';
import { formatDue } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { listenForNotificationClicks, showSystemNotification } from '@/lib/systemNotifications';
import { useServices } from '@/services/ServicesContext';
import { useMyRemindersQuery } from './api';

/** Browsers clamp longer `setTimeout` delays (2^31-1 ms ≈ 24.8 days). */
const MAX_TIMEOUT = 2 ** 31 - 1;
/** Reminders missed by more than this (app closed for long) are dropped silently. */
const MISSED_GRACE_MS = 12 * 60 * 60 * 1000;

/** Runs `task` in at most one tab at a time; other tabs skip it. */
const withExclusiveLock = async (name: string, task: () => Promise<void>) => {
  if (!navigator.locks) return task();
  await navigator.locks.request(name, { ifAvailable: true }, async (lock) => {
    if (lock) await task();
  });
};

/**
 * Local stand-in for server-side delivery: schedules timers for the user's pending reminders
 * while the app runs (foreground or background tab) and catches up after the device wakes.
 *
 * With Firebase, a scheduled Cloud Function sends FCM web pushes instead, which also reach
 * users whose app is closed; this hook then only needs to handle foreground messages.
 */
export const useReminderScheduler = () => {
  const services = useServices();
  const navigate = useNavigate();
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const { data: reminders } = useMyRemindersQuery();
  // Timers don't run while a phone sleeps – re-evaluate when the app becomes visible again.
  const [wakeups, setWakeups] = useState(0);

  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && setWakeups((count) => count + 1);
    document.addEventListener('visibilitychange', onVisible);
    const stopListening = listenForNotificationClicks();
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      stopListening();
    };
  }, []);

  const deliver = useEffectEvent((reminder: Reminder) =>
    withExclusiveLock(`reminder:${reminder.id}`, async () => {
      const current = await services.reminders.getReminder(reminder.id);
      if (!current || current.firedAt || current.remindAt !== reminder.remindAt) return;

      const [list, todos] = await Promise.all([
        services.lists.getList(reminder.listId),
        services.todos.getTodos(reminder.listId),
      ]).catch(() => [null, null] as const);
      const todo = todos?.find((candidate) => candidate.id === reminder.todoId);
      if (!list || !todo) {
        // The task, the list or our access to it is gone.
        await services.reminders.removeReminder(reminder.id);
        return;
      }

      if (!todo.completed) {
        const body = [list.title, todo.dueAt && t('reminders.due', { date: formatDue(todo, timeFormat) })].filter(Boolean).join(' · ');
        const url = `#/lists/${list.id}?task=${todo.id}`;
        const shownBySystem = document.visibilityState === 'hidden' && (await showSystemNotification({ title: todo.title, body, tag: reminder.id, url }));
        if (!shownBySystem) {
          haptic([20, 60, 20]);
          notifications.show({
            id: reminder.id,
            title: `🔔 ${todo.title}`,
            message: (
              <>
                {body}{' '}
                <Anchor
                  size="sm"
                  component="button"
                  onClick={() => {
                    notifications.hide(reminder.id);
                    void navigate({ to: '/lists/$listId', params: { listId: list.id }, search: { task: todo.id } });
                  }}
                >
                  {t('common.open')}
                </Anchor>
              </>
            ),
            icon: <IconBell size={18} />,
            autoClose: 20_000,
          });
        }
      }
      await services.reminders.markFired(reminder.id);
    }).catch(() => undefined),
  );

  useEffect(() => {
    if (!reminders) return;
    const now = Date.now();
    const timers: number[] = [];
    for (const reminder of reminders) {
      if (reminder.firedAt) continue;
      const delay = Date.parse(reminder.remindAt) - now;
      if (delay < -MISSED_GRACE_MS) void services.reminders.markFired(reminder.id).catch(() => undefined);
      else if (delay <= MAX_TIMEOUT) timers.push(window.setTimeout(() => void deliver(reminder), Math.max(0, delay)));
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reminders, wakeups, services]);
};
