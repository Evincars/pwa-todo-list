import { useCallback, useEffect, useState } from 'react';
import { getNotificationSupport, requestNotificationPermission, type NotificationSupport } from '@/lib/systemNotifications';

/** Reactive notification permission (users can change it in browser settings at any time). */
export const useNotificationSupport = () => {
  const [support, setSupport] = useState<NotificationSupport>(getNotificationSupport);

  useEffect(() => {
    const refresh = () => setSupport(getNotificationSupport());
    document.addEventListener('visibilitychange', refresh);
    let status: PermissionStatus | undefined;
    void navigator.permissions
      ?.query({ name: 'notifications' })
      .then((result) => {
        status = result;
        status.addEventListener('change', refresh);
      })
      .catch(() => undefined);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      status?.removeEventListener('change', refresh);
    };
  }, []);

  /** Must be called from a user gesture. */
  const request = useCallback(async () => {
    const next = await requestNotificationPermission();
    setSupport(next);
    return next;
  }, []);

  return { support, request };
};
