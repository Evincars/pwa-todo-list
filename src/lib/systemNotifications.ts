/**
 * Thin wrapper over the Web Notifications API.
 *
 * - Android/Chrome only allows `ServiceWorkerRegistration.showNotification` (the `Notification`
 *   constructor throws), so the service worker is preferred and the constructor is a fallback.
 * - iOS/iPadOS (16.4+) exposes notifications only to web apps added to the Home Screen.
 * - Permission must be requested from a user gesture.
 */

export type NotificationSupport = 'unsupported' | 'ios-needs-install' | NotificationPermission;

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const getNotificationSupport = (): NotificationSupport => {
  if (!('Notification' in window)) return isIOS() && !isStandalone() ? 'ios-needs-install' : 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationSupport> => {
  const support = getNotificationSupport();
  if (support !== 'default') return support;
  return Notification.requestPermission();
};

export interface SystemNotification {
  title: string;
  body?: string;
  /** Notifications with the same tag replace each other (dedupes across tabs). */
  tag?: string;
  /** In-app URL opened on click, relative to the app root (e.g. `#/lists/abc`). */
  url?: string;
}

const ICON = './pwa-192x192.png';
const BADGE = './pwa-64x64.png';

/** Shows an OS-level notification. Resolves `false` when it can't be shown. */
export const showSystemNotification = async ({ title, body, tag, url }: SystemNotification): Promise<boolean> => {
  if (getNotificationSupport() !== 'granted') return false;
  const options: NotificationOptions = { body, tag, icon: ICON, badge: BADGE, data: { url } };

  const registration = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
  if (registration) {
    await registration.showNotification(title, options);
    return true;
  }
  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      if (url) window.location.hash = new URL(url, window.location.href).hash;
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
};

/** Follows "navigate" requests posted by the service worker's `notificationclick` handler. */
export const listenForNotificationClicks = () => {
  const handler = (event: MessageEvent<unknown>) => {
    const data = event.data as { type?: string; url?: string } | null;
    if (data?.type === 'notification-click' && data.url) window.location.hash = new URL(data.url).hash;
  };
  navigator.serviceWorker?.addEventListener('message', handler);
  return () => navigator.serviceWorker?.removeEventListener('message', handler);
};
