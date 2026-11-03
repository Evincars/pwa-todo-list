import { Button, Card, Group, Text } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { useTranslation } from '@/i18n';
import { useNotificationSupport } from '../useNotificationSupport';

const dismiss = () => useSettingsStore.setState({ notificationPromptDismissed: true });

/**
 * Asks for notification permission up front. Browsers only show the permission dialog from a tap
 * (iOS refuses otherwise, Chrome mutes it), so this is a card with a button rather than an auto-prompt.
 */
export const NotificationPrompt = () => {
  const { t } = useTranslation();
  const { support, request } = useNotificationSupport();
  const dismissed = useSettingsStore((state) => state.notificationPromptDismissed);
  if (dismissed || (support !== 'default' && support !== 'ios-needs-install')) return null;

  return (
    <Card withBorder radius="lg" padding="md" bg="var(--mantine-primary-color-light)">
      <Group wrap="nowrap" align="flex-start">
        <IconBell size={28} color="var(--mantine-primary-color-filled)" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600}>{t('reminders.prompt.title')}</Text>
          <Text size="sm" c="dimmed">
            {support === 'ios-needs-install' ? t('reminders.prompt.iosInstall') : t('reminders.prompt.description')}
          </Text>
          <Group mt="sm" gap="xs">
            {support === 'default' && (
              <Button size="xs" onClick={() => void request()}>
                {t('reminders.prompt.enable')}
              </Button>
            )}
            <Button size="xs" variant="default" onClick={dismiss}>
              {t('reminders.prompt.notNow')}
            </Button>
          </Group>
        </div>
      </Group>
    </Card>
  );
};
