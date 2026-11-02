import { Button, Card, Center, EmptyState, Loader, Stack, Text, Title } from '@mantine/core';
import { IconMailOff } from '@tabler/icons-react';
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/domain/errors';
import type { ListId } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/authStore';
import { useServices } from '@/services/ServicesContext';
import { UserAvatar } from '@/shared/ui';
import { invitationQueryOptions, useAcceptInvitation } from '../api';

const route = getRouteApi('/_authed/invite/$invitationId');

export const AcceptInvitationPage = () => {
  const { invitationId } = route.useParams();
  const services = useServices();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const invitation = useQuery(invitationQueryOptions(services, invitationId));
  const accept = useAcceptInvitation();

  const openList = (listId: ListId) => void navigate({ to: '/lists/$listId', params: { listId }, replace: true });

  if (invitation.isPending) {
    return (
      <Center flex={1}>
        <Loader type="dots" />
      </Center>
    );
  }

  const data = invitation.data;
  const unusable =
    invitation.error ??
    (data && data.status !== 'pending' && !data.acceptedBy.includes(user.id) ? new Error(`This invitation was ${data.status}`) : null);

  if (unusable || !data) {
    return (
      <Center flex={1} p="md">
        <EmptyState icon={<IconMailOff />} variant="light" color="gray" title="Invitation unavailable" description={getErrorMessage(unusable)}>
          <EmptyState.Actions>
            <Button component={Link} to="/">
              Go to my lists
            </Button>
          </EmptyState.Actions>
        </EmptyState>
      </Center>
    );
  }

  const alreadyJoined = data.acceptedBy.includes(user.id) || data.invitedBy.id === user.id;

  return (
    <Center flex={1} p="md">
      <Card withBorder radius="xl" padding="xl" maw={400} w="100%">
        <Stack align="center" ta="center" gap="md">
          <Text fz={56} lh={1}>
            {data.listEmoji}
          </Text>
          <div>
            <Text size="sm" c="dimmed">
              You've been invited to
            </Text>
            <Title order={2}>{data.listTitle}</Title>
          </div>
          <Stack gap={4} align="center">
            <UserAvatar user={data.invitedBy} size="lg" />
            <Text size="sm">
              <b>{data.invitedBy.displayName}</b> wants you to {data.permission === 'write' ? 'collaborate on' : 'view'} this list
            </Text>
          </Stack>
          {alreadyJoined ? (
            <Button fullWidth size="md" onClick={() => openList(data.listId)}>
              Open list
            </Button>
          ) : (
            <Button fullWidth size="md" loading={accept.isPending} onClick={() => accept.mutate(data.id, { onSuccess: (list) => openList(list.id) })}>
              Join as {user.displayName}
            </Button>
          )}
          <Button variant="subtle" component={Link} to="/">
            Not now
          </Button>
        </Stack>
      </Card>
    </Center>
  );
};
