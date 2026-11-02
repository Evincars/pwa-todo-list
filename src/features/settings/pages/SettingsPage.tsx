import { Badge, Button, Center, Group, Paper, Select, Slider, Stack, Switch, Text } from '@mantine/core';
import { useDocumentTitle } from '@mantine/hooks';
import {
  IconChecklist,
  IconDatabase,
  IconDeviceDesktop,
  IconDownload,
  IconLogout,
  IconMoon,
  IconPalette,
  IconSun,
} from '@tabler/icons-react';
import { PRIORITY_META, PRIORITY_ORDER } from '@/domain/priority';
import { SORT_LABEL, TODO_SORT_KEYS, type TodoSortKey } from '@/domain/todoQuery';
import type { Priority } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/authStore';
import { PROVIDER_LABEL } from '@/features/auth/components/ProviderButton';
import { AppleLogo, GoogleLogo } from '@/features/auth/components/ProviderLogos';
import { useSignOut } from '@/features/auth/useSignIn';
import { useServices } from '@/services/ServicesContext';
import { useInstallPrompt } from '@/shared/hooks/useInstallPrompt';
import { confirm, PageHeader, SegmentedField, SettingsRow, SettingsSection, UserAvatar } from '@/shared/ui';
import { RADIUS_OPTIONS, type RadiusOption } from '@/theme/createAppTheme';
import { ThemePresetPicker } from '../components/ThemePresetPicker';
import { useSettingsStore, type ColorSchemePreference, type TimeFormat } from '../settingsStore';

const COLOR_SCHEME_OPTIONS = [
  { value: 'light', label: <Center style={{ gap: 6 }}><IconSun size={16} /> Light</Center> },
  { value: 'dark', label: <Center style={{ gap: 6 }}><IconMoon size={16} /> Dark</Center> },
  { value: 'system', label: <Center style={{ gap: 6 }}><IconDeviceDesktop size={16} /> Auto</Center> },
] as const satisfies readonly { value: ColorSchemePreference; label: React.ReactNode }[];

const RADIUS_LABEL: Record<RadiusOption, string> = { xs: 'None', sm: 'S', md: 'M', lg: 'L', xl: 'XL' };

const ProfileCard = () => {
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
        Sign out
      </Button>
    </Paper>
  );
};

export const SettingsPage = () => {
  useDocumentTitle('Settings · Shared Todo');
  const settings = useSettingsStore();
  const { setSetting } = settings;
  const services = useServices();
  const { canInstall, installed, install } = useInstallPrompt();

  const eraseData = async () => {
    const ok = await confirm({
      title: 'Erase all local data?',
      message: 'Removes every list, task, invitation and account stored in this browser and signs you out.',
      confirmLabel: 'Erase everything',
      danger: true,
    });
    if (ok) await services.resetData();
  };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="app-container">
        <Stack gap="xl">
          <ProfileCard />

          <SettingsSection title="Appearance" icon={<IconPalette size={16} color="var(--mantine-color-dimmed)" />}>
            <SegmentedField
              label="Mode"
              fullWidth
              data={COLOR_SCHEME_OPTIONS}
              value={settings.colorScheme}
              onChange={(value) => setSetting('colorScheme', value)}
            />
            <div>
              <Text size="sm" fw={500} mb={6}>
                Theme
              </Text>
              <ThemePresetPicker value={settings.themeId} onChange={(value) => setSetting('themeId', value)} />
            </div>
            <SegmentedField
              label="Corner roundness"
              fullWidth
              data={RADIUS_OPTIONS.map((value) => ({ value, label: RADIUS_LABEL[value] }))}
              value={settings.radius}
              onChange={(value) => setSetting('radius', value)}
            />
            <div>
              <Text size="sm" fw={500}>
                Text size
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
                  { value: 0.875, label: 'Small' },
                  { value: 1, label: 'Default' },
                  { value: 1.25, label: 'Large' },
                ]}
              />
            </div>
          </SettingsSection>

          <SettingsSection title="Tasks" icon={<IconChecklist size={16} color="var(--mantine-color-dimmed)" />}>
            <SettingsRow
              label="Default sort"
              description="Used for lists without their own sort"
              control={
                <Select
                  w={170}
                  data={TODO_SORT_KEYS.map((key) => ({ value: key, label: SORT_LABEL[key].replace(/ \(.*\)/, '') }))}
                  value={settings.defaultSort}
                  onChange={(value) => value && setSetting('defaultSort', value as TodoSortKey)}
                  allowDeselect={false}
                />
              }
            />
            <SettingsRow
              label="Default priority"
              description="For newly added tasks"
              control={
                <Select
                  w={170}
                  data={PRIORITY_ORDER.map((priority) => ({ value: priority, label: PRIORITY_META[priority].label }))}
                  value={settings.defaultPriority}
                  onChange={(value) => value && setSetting('defaultPriority', value as Priority)}
                  allowDeselect={false}
                />
              }
            />
            <SegmentedField<TimeFormat>
              label="Time format"
              fullWidth
              data={[
                { value: '24h', label: '24-hour' },
                { value: '12h', label: '12-hour' },
              ]}
              value={settings.timeFormat}
              onChange={(value) => setSetting('timeFormat', value)}
            />
            <SegmentedField<'0' | '1'>
              label="Week starts on"
              fullWidth
              data={[
                { value: '1', label: 'Monday' },
                { value: '0', label: 'Sunday' },
              ]}
              value={String(settings.weekStartsOn) as '0' | '1'}
              onChange={(value) => setSetting('weekStartsOn', value === '1' ? 1 : 0)}
            />
            <SettingsRow
              label="Show completed tasks"
              control={<Switch checked={settings.showCompleted} onChange={(e) => setSetting('showCompleted', e.currentTarget.checked)} />}
            />
            <SettingsRow
              label="Confirm before deleting"
              control={<Switch checked={settings.confirmDelete} onChange={(e) => setSetting('confirmDelete', e.currentTarget.checked)} />}
            />
            <SettingsRow
              label="Haptic feedback"
              description="Vibrate when completing tasks (Android)"
              control={<Switch checked={settings.haptics} onChange={(e) => setSetting('haptics', e.currentTarget.checked)} />}
            />
          </SettingsSection>

          <SettingsSection title="App & data" icon={<IconDatabase size={16} color="var(--mantine-color-dimmed)" />}>
            <SettingsRow
              label="Install app"
              description={installed ? 'Running as an installed app' : 'Add to your home screen for a native feel'}
              control={
                installed ? (
                  <Badge color="teal" variant="light">
                    Installed
                  </Badge>
                ) : (
                  <Button size="xs" variant="light" leftSection={<IconDownload size={14} />} disabled={!canInstall} onClick={() => void install()}>
                    Install
                  </Button>
                )
              }
            />
            <SettingsRow
              label="Storage"
              description="Data is saved in this browser. Cloud sync (Firebase) is coming."
              control={<Badge variant="default">Local</Badge>}
            />
            <Group grow>
              <Button variant="default" onClick={settings.resetSettings}>
                Reset settings
              </Button>
              <Button variant="light" color="red" onClick={() => void eraseData()}>
                Erase local data
              </Button>
            </Group>
          </SettingsSection>

          <Text size="xs" c="dimmed" ta="center">
            Shared Todo v{__APP_VERSION__}
          </Text>
        </Stack>
      </div>
    </>
  );
};
