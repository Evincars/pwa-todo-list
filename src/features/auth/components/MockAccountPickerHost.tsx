import { Badge, Button, Divider, Group, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconChevronRight, IconUserPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from '@/i18n';
import { OptionList, ResponsiveModal, UserAvatar } from '@/shared/ui';
import { useAccountPickerStore } from '../accountPickerStore';
import { DEMO_ACCOUNTS } from '../demoAccounts';
import { PROVIDER_LABEL } from './ProviderButton';
import { ProviderLogo } from './ProviderLogos';

interface CustomAccountForm {
  displayName: string;
  email: string;
  photoURL: string;
}

/**
 * DEV/MOCK ONLY – imitates the Google / Apple account chooser popup.
 * Remove together with `MockAuthService` once Firebase Auth is wired in.
 */
export const MockAccountPickerHost = () => {
  const request = useAccountPickerStore((state) => state.request);
  const complete = useAccountPickerStore((state) => state.complete);
  const [customMode, setCustomMode] = useState(false);
  const { t } = useTranslation();

  const form = useForm<CustomAccountForm>({
    initialValues: { displayName: '', email: '', photoURL: '' },
    validate: {
      displayName: (value) => (value.trim().length < 2 ? t('auth.nameRequired') : null),
      email: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : t('auth.emailInvalid')),
    },
  });

  const close = (account: Parameters<typeof complete>[0]) => {
    complete(account);
    setCustomMode(false);
    form.reset();
  };

  const provider = request?.provider ?? 'google';
  const accounts = DEMO_ACCOUNTS[provider];

  return (
    <ResponsiveModal
      opened={!!request}
      onClose={() => close(null)}
      size="sm"
      title={
        <Group gap="xs">
          <ProviderLogo provider={provider} />
          <Text fw={600}>{t('auth.signInWith', { provider: PROVIDER_LABEL[provider] })}</Text>
          <Badge size="xs" variant="light" color="gray">
            {t('auth.mock')}
          </Badge>
        </Group>
      }
    >
      {customMode ? (
        <form onSubmit={form.onSubmit(({ photoURL, ...values }) => close({ ...values, photoURL: photoURL.trim() || null }))}>
          <Stack>
            <TextInput label={t('auth.name')} placeholder={t('auth.namePlaceholder')} data-autofocus {...form.getInputProps('displayName')} />
            <TextInput label={t('auth.email')} placeholder={t('auth.emailPlaceholder')} type="email" {...form.getInputProps('email')} />
            {provider !== 'apple' && (
              <TextInput
                label={t('auth.photo')}
                placeholder="https://…"
                type="url"
                leftSection={<UserAvatar user={{ displayName: form.values.displayName || '?', photoURL: form.values.photoURL || null }} size={22} />}
                {...form.getInputProps('photoURL')}
              />
            )}
            <Text size="xs" c="dimmed">
              {t('auth.photoHint')}
            </Text>
            <Group justify="space-between">
              <Button variant="subtle" onClick={() => setCustomMode(false)}>
                {t('common.back')}
              </Button>
              <Button type="submit">{t('common.continue')}</Button>
            </Group>
          </Stack>
        </form>
      ) : (
        <Stack gap={4}>
          <Text size="sm" c="dimmed" mb="xs">
            {t('auth.chooseAccount')}
          </Text>
          <OptionList
            options={accounts.map((account) => ({
              value: account,
              label: account.displayName,
              description: account.email,
              icon: <UserAvatar user={account} />,
              hint: <IconChevronRight size={16} />,
            }))}
            onSelect={close}
          />
          <Divider my="xs" />
          <Button variant="subtle" leftSection={<IconUserPlus size={18} />} justify="flex-start" onClick={() => setCustomMode(true)}>
            {t('auth.useAnother')}
          </Button>
          <Text size="xs" c="dimmed" mt="xs">
            {t('auth.tip')}
          </Text>
        </Stack>
      )}
    </ResponsiveModal>
  );
};
