import { Button, Center, EmptyState, Loader } from '@mantine/core';
import { IconAlertTriangle, IconMoodEmpty } from '@tabler/icons-react';
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { getErrorMessage } from '@/domain/errors';

export const RoutePending = () => (
  <Center flex={1} py="xl">
    <Loader type="dots" />
  </Center>
);

export const RouteError = ({ error }: ErrorComponentProps) => {
  const router = useRouter();
  return (
    <Center flex={1} p="md">
      <EmptyState icon={<IconAlertTriangle />} variant="light" color="red" title="Something went wrong" description={getErrorMessage(error)}>
        <EmptyState.Actions>
          <Button variant="default" component={Link} to="/">
            Go home
          </Button>
          <Button onClick={() => void router.invalidate()}>Try again</Button>
        </EmptyState.Actions>
      </EmptyState>
    </Center>
  );
};

export const RouteNotFound = () => (
  <Center flex={1} p="md">
    <EmptyState icon={<IconMoodEmpty />} variant="light" title="Page not found" description="The page you're looking for doesn't exist.">
      <EmptyState.Actions>
        <Button component={Link} to="/">
          Back to my lists
        </Button>
      </EmptyState.Actions>
    </EmptyState>
  </Center>
);
