import { Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import type { Invitation } from '@/domain/types';
import { useAcceptInvitation, useDeclineInvitation, useMyInvitationsQuery } from '../api';

const PERMISSION_TEXT = { read: 'view', write: 'edit' } as const;

const InvitationCard = ({ invitation }: { invitation: Invitation }) => {
  const navigate = useNavigate();
  const accept = useAcceptInvitation();
  const decline = useDeclineInvitation();

  return (
    <Card withBorder radius="lg" padding="md" bg="var(--mantine-primary-color-light)">
      <Group wrap="nowrap" align="flex-start">
        <Text fz={28} lh={1}>
          {invitation.listEmoji}
        </Text>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} lineClamp={1}>
            {invitation.listTitle}
          </Text>
          <Text size="sm" c="dimmed">
            {invitation.invitedBy.displayName} invited you to {PERMISSION_TEXT[invitation.permission]}
          </Text>
          <Group mt="sm" gap="xs">
            <Button
              size="xs"
              loading={accept.isPending}
              onClick={() =>
                accept.mutate(invitation.id, {
                  onSuccess: (list) => void navigate({ to: '/lists/$listId', params: { listId: list.id } }),
                })
              }
            >
              Join list
            </Button>
            <Button size="xs" variant="default" loading={decline.isPending} onClick={() => decline.mutate(invitation.id)}>
              Decline
            </Button>
          </Group>
        </div>
      </Group>
    </Card>
  );
};

export const InvitationsInbox = () => {
  const { data: invitations = [] } = useMyInvitationsQuery();
  if (!invitations.length) return null;

  return (
    <Stack gap="xs">
      <Group gap={6} px={4}>
        <IconMail size={16} color="var(--mantine-primary-color-filled)" />
        <Title order={2} fz="sm" tt="uppercase" c="dimmed">
          Invitations
        </Title>
      </Group>
      {invitations.map((invitation) => (
        <InvitationCard key={invitation.id} invitation={invitation} />
      ))}
    </Stack>
  );
};
