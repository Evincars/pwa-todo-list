import { Button, Group, Notification, Portal } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Offers to reload when a new service worker version is waiting. */
export const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <Portal>
      <Notification
        icon={<IconRefresh size={18} />}
        title="Update available"
        onClose={() => setNeedRefresh(false)}
        style={{ position: 'fixed', left: 16, right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom))', zIndex: 1000, maxWidth: 420, marginInline: 'auto' }}
      >
        A new version of the app is ready.
        <Group mt="xs">
          <Button size="xs" onClick={() => void updateServiceWorker(true)}>
            Reload
          </Button>
        </Group>
      </Notification>
    </Portal>
  );
};
