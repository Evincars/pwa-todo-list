import { Group, Image, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import type { ParseKeys } from 'i18next';
import { IconBolt, IconDeviceMobile, IconUsers } from '@tabler/icons-react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { AuthProviderId } from '@/domain/types';
import { useTranslation } from '@/i18n';
import { AuthorCredit } from '@/shared/ui';
import { ProviderButton } from '../components/ProviderButton';
import { useSignIn } from '../useSignIn';
import classes from './LoginPage.module.css';

const route = getRouteApi('/login');

const FEATURES: { icon: ReactNode; text: ParseKeys }[] = [
  { icon: <IconUsers size={16} />, text: 'auth.features.share' },
  { icon: <IconBolt size={16} />, text: 'auth.features.plan' },
  { icon: <IconDeviceMobile size={16} />, text: 'auth.features.offline' },
];

export const LoginPage = () => {
  const { redirect } = route.useSearch();
  const navigate = useNavigate();
  const signIn = useSignIn();
  const { t } = useTranslation();

  const handleSignIn = (provider: AuthProviderId) =>
    signIn.mutate(provider, { onSuccess: () => void navigate({ href: redirect ?? '/', replace: true }) });

  return (
    <div className={classes.root}>
      <Stack className={classes.card} gap="xl">
        <Stack gap="md" align="center" ta="center">
          <Image src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className={classes.logo} />
          <div>
            <Title order={1} fz={32}>
              {t('app.name')}
            </Title>
            <Text c="dimmed" mt={4}>
              {t('auth.tagline')}
            </Text>
          </div>
        </Stack>

        <Stack gap={8} px="md">
          {FEATURES.map((feature) => (
            <Group key={feature.text} gap="sm" wrap="nowrap" className={classes.feature}>
              <ThemeIcon variant="light" radius="xl" size="md">
                {feature.icon}
              </ThemeIcon>
              <Text size="sm">{t(feature.text)}</Text>
            </Group>
          ))}
        </Stack>

        <Stack gap="sm">
          <ProviderButton provider="google" onClick={() => handleSignIn('google')} loading={signIn.isPending && signIn.variables === 'google'} />
          <ProviderButton provider="apple" onClick={() => handleSignIn('apple')} loading={signIn.isPending && signIn.variables === 'apple'} />
        </Stack>

        <Stack gap={4} align="center">
          <Text size="xs" c="dimmed" ta="center">
            {t('auth.demoNote')}
          </Text>
          <AuthorCredit />
        </Stack>
      </Stack>
    </div>
  );
};
