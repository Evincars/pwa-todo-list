import { Badge, Button, Divider, Group, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconChevronRight, IconUserPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { OptionList, ResponsiveModal, UserAvatar } from '@/shared/ui';
import { useAccountPickerStore } from '../accountPickerStore';
import { DEMO_ACCOUNTS } from '../demoAccounts';
import { PROVIDER_LABEL } from './ProviderButton';
import { AppleLogo, GoogleLogo } from './ProviderLogos';

interface CustomAccountForm {
  displayName: string;
  email: string;
}

/**
 * DEV/MOCK ONLY – imitates the Google / Apple account chooser popup.
 * Remove together with `MockAuthService` once Firebase Auth is wired in.
 */
export const MockAccountPickerHost = () => {
  const request = useAccountPickerStore((state) => state.request);
  const complete = useAccountPickerStore((state) => state.complete);
  const [customMode, setCustomMode] = useState(false);

  const form = useForm<CustomAccountForm>({
    initialValues: { displayName: '', email: '' },
    validate: {
      displayName: (value) => (value.trim().length < 2 ? 'Enter your name' : null),
      email: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : 'Enter a valid e-mail'),
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
          {provider === 'google' ? <GoogleLogo /> : <AppleLogo />}
          <Text fw={600}>Sign in with {PROVIDER_LABEL[provider]}</Text>
          <Badge size="xs" variant="light" color="gray">
            mock
          </Badge>
        </Group>
      }
    >
      {customMode ? (
        <form onSubmit={form.onSubmit((values) => close(values))}>
          <Stack>
            <TextInput label="Name" placeholder="Jane Doe" data-autofocus {...form.getInputProps('displayName')} />
            <TextInput label="E-mail" placeholder="jane@example.com" type="email" {...form.getInputProps('email')} />
            <Group justify="space-between">
              <Button variant="subtle" onClick={() => setCustomMode(false)}>
                Back
              </Button>
              <Button type="submit">Continue</Button>
            </Group>
          </Stack>
        </form>
      ) : (
        <Stack gap={4}>
          <Text size="sm" c="dimmed" mb="xs">
            Choose an account to continue to Shared Todo
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
            Use another account
          </Button>
          <Text size="xs" c="dimmed" mt="xs">
            Tip: sign in as different people to try sharing – all data lives in this browser.
          </Text>
        </Stack>
      )}
    </ResponsiveModal>
  );
};
