import { Badge, Button, Center, Group, Paper, Select, Slider, Stack, Switch, Text } from '@mantine/core';
import { useDocumentTitle } from '@mantine/hooks';
import {
  IconBell,
  IconChecklist,
  IconDatabase,
  IconDeviceDesktop,
  IconDownload,
  IconLanguage,
  IconLogout,
  IconMoon,
  IconPalette,
  IconSun,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { PRIORITY_ORDER } from '@/domain/priority';
import { TODO_SORT_KEYS, type TodoSortKey } from '@/domain/todoQuery';
import type { Priority } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/authStore';
import { PROVIDER_LABEL } from '@/features/auth/components/ProviderButton';
import { AppleLogo, GoogleLogo } from '@/features/auth/components/ProviderLogos';
import { useSignOut } from '@/features/auth/useSignIn';
import { useNotificationSupport } from '@/features/reminders/useNotificationSupport';
import {
  detectSystemLanguage,
  LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
  useTranslation,
  type LanguagePreference,
} from '@/i18n';
import { notify } from '@/lib/notify';
import { showSystemNotification } from '@/lib/systemNotifications';
import { useServices } from '@/services/ServicesContext';
import { useInstallPrompt } from '@/shared/hooks/useInstallPrompt';
import { AuthorCredit, confirm, PageHeader, SegmentedField, SettingsRow, SettingsSection, UserAvatar } from '@/shared/ui';
import { RADIUS_OPTIONS } from '@/theme/createAppTheme';
import { ThemePresetPicker } from '../components/ThemePresetPicker';
import { useSettingsStore, type ColorSchemePreference, type TimeFormat } from '../settingsStore';

const sectionIcon = (Icon: typeof IconBell) => <Icon size={16} color="var(--mantine-color-dimmed)" />;

const withIcon = (icon: ReactNode, label: string) => (
  <Center style={{ gap: 6 }}>
    {icon} {label}
  </Center>
);

const ProfileCard = () => {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const signOut = useSignOut();
  return (
    <Paper withBorder radius="lg" p="md">
      <Group wrap="nowrap">
        <UserAvatar user={user} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} lineClamp={1}>
            {user.displayName}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={1}>
            {user.email}
          </Text>
          <Badge mt={4} size="sm" variant="default" leftSection={user.provider === 'google' ? <GoogleLogo width={12} height={12} /> : <AppleLogo width={10} height={10} />}>
            {PROVIDER_LABEL[user.provider]}
          </Badge>
        </div>
      </Group>
      <Button mt="md" fullWidth variant="light" color="red" leftSection={<IconLogout size={16} />} loading={signOut.isPending} onClick={() => signOut.mutate()}>
        {t('auth.signOut')}
      </Button>
    </Paper>
  );
};

const NotificationsSection = () => {
  const { t } = useTranslation();
  const { support, request } = useNotificationSupport();
  const autoReminder = useSettingsStore((state) => state.autoReminder);
  const setSetting = useSettingsStore((state) => state.setSetting);

  const sendTest = async () => {
    const shown = await showSystemNotification({ title: t('settings.testTitle'), body: t('settings.testBody'), tag: 'test' });
    if (!shown) notify.error(new Error(t('settings.testFailed')));
  };

  return (
    <SettingsSection title={t('settings.notifications')} icon={sectionIcon(IconBell)}>
      <SettingsRow
        label={t('settings.systemNotifications')}
        description={t(`settings.permission.${support}`)}
        control={
          support === 'granted' ? (
            <Button size="xs" variant="default" onClick={() => void sendTest()}>
              {t('settings.test')}
            </Button>
          ) : support === 'default' ? (
            <Button size="xs" variant="light" onClick={() => void request()}>
              {t('settings.enable')}
            </Button>
          ) : (
            <Badge color={support === 'denied' ? 'red' : 'gray'} variant="light">
              {support === 'denied' ? t('settings.blocked') : t('settings.unavailable')}
            </Badge>
          )
        }
      />
      <SettingsRow
        label={t('settings.autoReminder')}
        description={t('settings.autoReminderDescription')}
        control={<Switch checked={autoReminder} onChange={(e) => setSetting('autoReminder', e.currentTarget.checked)} />}
      />
    </SettingsSection>
  );
};

export const SettingsPage = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('app.pageTitle', { page: t('settings.title') }));
  const settings = useSettingsStore();
  const { setSetting } = settings;
  const services = useServices();
  const isCloud = services.backend === 'firebase';
  const { canInstall, installed, install } = useInstallPrompt();

  const eraseData = async () => {
    const ok = await confirm({
      title: t('settings.eraseConfirm.title'),
      message: t('settings.eraseConfirm.message'),
      confirmLabel: t('settings.eraseConfirm.confirm'),
      danger: true,
    });
    if (ok) await services.resetData?.();
  };

  const colorSchemeOptions: { value: ColorSchemePreference; label: ReactNode }[] = [
    { value: 'light', label: withIcon(<IconSun size={16} />, t('settings.light')) },
    { value: 'dark', label: withIcon(<IconMoon size={16} />, t('settings.dark')) },
    { value: 'system', label: withIcon(<IconDeviceDesktop size={16} />, t('settings.auto')) },
  ];

  const languageOptions = [
    { value: 'system', label: t('settings.languageSystem', { language: LANGUAGE_NAMES[detectSystemLanguage()] }) },
    ...SUPPORTED_LANGUAGES.map((language) => ({ value: language, label: LANGUAGE_NAMES[language] })),
  ];

  return (
    <>
      <PageHeader title={t('settings.title')} />
      <div className="app-container">
        <Stack gap="xl">
          <ProfileCard />

          <SettingsSection title={t('settings.language')} icon={sectionIcon(IconLanguage)}>
            <Select
              aria-label={t('settings.language')}
              data={languageOptions}
              value={settings.language}
              onChange={(value) => value && setSetting('language', value as LanguagePreference)}
              allowDeselect={false}
              leftSection={<IconLanguage size={16} />}
            />
          </SettingsSection>

          <SettingsSection title={t('settings.appearance')} icon={sectionIcon(IconPalette)}>
            <SegmentedField
              label={t('settings.mode')}
              fullWidth
              data={colorSchemeOptions}
              value={settings.colorScheme}
              onChange={(value) => setSetting('colorScheme', value)}
            />
            <div>
              <Text size="sm" fw={500} mb={6}>
                {t('settings.theme')}
              </Text>
              <ThemePresetPicker value={settings.themeId} onChange={(value) => setSetting('themeId', value)} />
            </div>
            <SegmentedField
              label={t('settings.cornerRoundness')}
              fullWidth
              data={RADIUS_OPTIONS.map((value) => ({ value, label: t(`settings.radius.${value}`) }))}
              value={settings.radius}
              onChange={(value) => setSetting('radius', value)}
            />
            <div>
              <Text size="sm" fw={500}>
                {t('settings.textSize')}
              </Text>
              <Slider
                mt="xs"
                mb="lg"
                min={0.875}
                max={1.25}
                step={0.125}
                value={settings.fontScale}
                onChange={(value) => setSetting('fontScale', value)}
                label={(value) => `${Math.round(value * 100)}%`}
                marks={[
                  { value: 0.875, label: t('settings.textSmall') },
                  { value: 1, label: t('settings.textDefault') },
                  { value: 1.25, label: t('settings.textLarge') },
                ]}
              />
            </div>
          </SettingsSection>

          <SettingsSection title={t('settings.tasks')} icon={sectionIcon(IconChecklist)}>
            <SettingsRow
              label={t('settings.defaultSort')}
              description={t('settings.defaultSortDescription')}
              control={
                <Select
                  w={170}
                  data={TODO_SORT_KEYS.map((key) => ({ value: key, label: t(`sort.${key}`) }))}
                  value={settings.defaultSort}
                  onChange={(value) => value && setSetting('defaultSort', value as TodoSortKey)}
                  allowDeselect={false}
                />
              }
            />
            <SettingsRow
              label={t('settings.defaultPriority')}
              description={t('settings.defaultPriorityDescription')}
              control={
                <Select
                  w={170}
                  data={PRIORITY_ORDER.map((priority) => ({ value: priority, label: t(`priority.${priority}`) }))}
                  value={settings.defaultPriority}
                  onChange={(value) => value && setSetting('defaultPriority', value as Priority)}
                  allowDeselect={false}
                />
              }
            />
            <SegmentedField<TimeFormat>
              label={t('settings.timeFormat')}
              fullWidth
              data={[
                { value: '24h', label: t('settings.hours24') },
                { value: '12h', label: t('settings.hours12') },
              ]}
              value={settings.timeFormat}
              onChange={(value) => setSetting('timeFormat', value)}
            />
            <SegmentedField<'0' | '1'>
              label={t('settings.weekStartsOn')}
              fullWidth
              data={[
                { value: '1', label: t('settings.monday') },
                { value: '0', label: t('settings.sunday') },
              ]}
              value={String(settings.weekStartsOn) as '0' | '1'}
              onChange={(value) => setSetting('weekStartsOn', value === '1' ? 1 : 0)}
            />
            <SettingsRow
              label={t('settings.showCompleted')}
              control={<Switch checked={settings.showCompleted} onChange={(e) => setSetting('showCompleted', e.currentTarget.checked)} />}
            />
            <SettingsRow
              label={t('settings.confirmDelete')}
              control={<Switch checked={settings.confirmDelete} onChange={(e) => setSetting('confirmDelete', e.currentTarget.checked)} />}
            />
            <SettingsRow
              label={t('settings.haptics')}
              description={t('settings.hapticsDescription')}
              control={<Switch checked={settings.haptics} onChange={(e) => setSetting('haptics', e.currentTarget.checked)} />}
            />
          </SettingsSection>

          <NotificationsSection />

          <SettingsSection title={t('settings.appData')} icon={sectionIcon(IconDatabase)}>
            <SettingsRow
              label={t('settings.install')}
              description={installed ? t('settings.installedDescription') : t('settings.installDescription')}
              control={
                installed ? (
                  <Badge color="teal" variant="light">
                    {t('settings.installed')}
                  </Badge>
                ) : (
                  <Button size="xs" variant="light" leftSection={<IconDownload size={14} />} disabled={!canInstall} onClick={() => void install()}>
                    {t('settings.installButton')}
                  </Button>
                )
              }
            />
            <SettingsRow
              label={t('settings.storage')}
              description={isCloud ? t('settings.storageCloudDescription') : t('settings.storageDescription')}
              control={
                <Badge variant={isCloud ? 'light' : 'default'} color={isCloud ? 'teal' : undefined}>
                  {isCloud ? t('settings.cloud') : t('settings.local')}
                </Badge>
              }
            />
            <Group grow>
              <Button variant="default" onClick={settings.resetSettings}>
                {t('settings.reset')}
              </Button>
              {services.resetData && (
                <Button variant="light" color="red" onClick={() => void eraseData()}>
                  {t('settings.erase')}
                </Button>
              )}
            </Group>
          </SettingsSection>

          <Stack gap={2} align="center">
            <Text size="xs" c="dimmed" ta="center">
              {t('app.version', { version: __APP_VERSION__ })}
            </Text>
            <AuthorCredit />
          </Stack>
        </Stack>
      </div>
    </>
  );
};
