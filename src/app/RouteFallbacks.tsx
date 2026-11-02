import { Button, Center, EmptyState, Loader } from '@mantine/core';
import { IconAlertTriangle, IconMoodEmpty } from '@tabler/icons-react';
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { getErrorMessage, useTranslation } from '@/i18n';

export const RoutePending = () => (
  <Center flex={1} py="xl">
    <Loader type="dots" />
  </Center>
);

export const RouteError = ({ error }: ErrorComponentProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Center flex={1} p="md">
      <EmptyState icon={<IconAlertTriangle />} variant="light" color="red" title={t('route.errorTitle')} description={getErrorMessage(error)}>
        <EmptyState.Actions>
          <Button variant="default" component={Link} to="/">
            {t('common.goHome')}
          </Button>
          <Button onClick={() => void router.invalidate()}>{t('common.tryAgain')}</Button>
        </EmptyState.Actions>
      </EmptyState>
    </Center>
  );
};

export const RouteNotFound = () => {
  const { t } = useTranslation();
  return (
    <Center flex={1} p="md">
      <EmptyState icon={<IconMoodEmpty />} variant="light" title={t('route.notFoundTitle')} description={t('route.notFoundDescription')}>
        <EmptyState.Actions>
          <Button component={Link} to="/">
            {t('common.backToLists')}
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    </Center>
  );
};
