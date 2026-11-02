import { Button, Group, Notification, Portal } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from '@/i18n';

/** Offers to reload when a new service worker version is waiting. */
export const ReloadPrompt = () => {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <Portal>
      <Notification
        icon={<IconRefresh size={18} />}
        title={t('pwa.updateTitle')}
        onClose={() => setNeedRefresh(false)}
        style={{ position: 'fixed', left: 16, right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom))', zIndex: 1000, maxWidth: 420, marginInline: 'auto' }}
      >
        {t('pwa.updateMessage')}
        <Group mt="xs">
          <Button size="xs" onClick={() => void updateServiceWorker(true)}>
            {t('pwa.reload')}
          </Button>
        </Group>
      </Notification>
    </Portal>
  );
};
