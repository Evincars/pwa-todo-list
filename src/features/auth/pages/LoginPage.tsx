import { Group, Image, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconBolt, IconDeviceMobile, IconUsers } from '@tabler/icons-react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { AuthProviderId } from '@/domain/types';
import { ProviderButton } from '../components/ProviderButton';
import { useSignIn } from '../useSignIn';
import classes from './LoginPage.module.css';

const route = getRouteApi('/login');

const FEATURES: { icon: ReactNode; text: string }[] = [
  { icon: <IconUsers size={16} />, text: 'Share lists and control who can edit' },
  { icon: <IconBolt size={16} />, text: 'Priorities, due dates and smart sorting' },
  { icon: <IconDeviceMobile size={16} />, text: 'Installable, works offline' },
];

export const LoginPage = () => {
  const { redirect } = route.useSearch();
  const navigate = useNavigate();
  const signIn = useSignIn();

  const handleSignIn = (provider: AuthProviderId) =>
    signIn.mutate(provider, { onSuccess: () => void navigate({ href: redirect ?? '/', replace: true }) });

  return (
    <div className={classes.root}>
      <Stack className={classes.card} gap="xl">
        <Stack gap="md" align="center" ta="center">
          <Image src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className={classes.logo} />
          <div>
            <Title order={1} fz={32}>
              Shared Todo
            </Title>
            <Text c="dimmed" mt={4}>
              Plan together. Get things done.
            </Text>
          </div>
        </Stack>

        <Stack gap={8} px="md">
          {FEATURES.map((feature) => (
            <Group key={feature.text} gap="sm" wrap="nowrap" className={classes.feature}>
              <ThemeIcon variant="light" radius="xl" size="md">
                {feature.icon}
              </ThemeIcon>
              <Text size="sm">{feature.text}</Text>
            </Group>
          ))}
        </Stack>

        <Stack gap="sm">
          <ProviderButton provider="google" onClick={() => handleSignIn('google')} loading={signIn.isPending && signIn.variables === 'google'} />
          <ProviderButton provider="apple" onClick={() => handleSignIn('apple')} loading={signIn.isPending && signIn.variables === 'apple'} />
        </Stack>

        <Text size="xs" c="dimmed" ta="center">
          Demo build – sign-in is simulated and data is stored on this device.
        </Text>
      </Stack>
    </div>
  );
};
