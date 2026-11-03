import { Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import type { Invitation } from '@/domain/types';
import { ListIconView } from '@/features/lists/components/ListIconView';
import { useTranslation } from '@/i18n';
import { useAcceptInvitation, useDeclineInvitation, useMyInvitationsQuery } from '../api';
import { afterSuccess } from '@/lib/mutations';

const InvitationCard = ({ invitation }: { invitation: Invitation }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const accept = useAcceptInvitation();
  const decline = useDeclineInvitation();

  return (
    <Card withBorder radius="lg" padding="md" bg="var(--mantine-primary-color-light)">
      <Group wrap="nowrap" align="flex-start">
        <Text fz={28} lh={1}>
          <ListIconView icon={invitation.listIcon} color={invitation.listColor} size={28} />
        </Text>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} lineClamp={1}>
            {invitation.listTitle}
          </Text>
          <Text size="sm" c="dimmed">
            {t(`invitations.invitedYou.${invitation.permission}`, { name: invitation.invitedBy.displayName })}
          </Text>
          <Group mt="sm" gap="xs">
            <Button
              size="xs"
              loading={accept.isPending}
              onClick={() =>
                afterSuccess(accept.mutateAsync(invitation.id), (list) => navigate({ to: '/lists/$listId', params: { listId: list.id } }))
              }
            >
              {t('invitations.join')}
            </Button>
            <Button size="xs" variant="default" loading={decline.isPending} onClick={() => decline.mutate(invitation.id)}>
              {t('invitations.decline')}
            </Button>
          </Group>
        </div>
      </Group>
    </Card>
  );
};

export const InvitationsInbox = () => {
  const { t } = useTranslation();
  const { data: invitations = [] } = useMyInvitationsQuery();
  if (!invitations.length) return null;

  return (
    <Stack gap="xs">
      <Group gap={6} px={4}>
        <IconMail size={16} color="var(--mantine-primary-color-filled)" />
        <Title order={2} fz="sm" tt="uppercase" c="dimmed">
          {t('invitations.inbox')}
        </Title>
      </Group>
      {invitations.map((invitation) => (
        <InvitationCard key={invitation.id} invitation={invitation} />
      ))}
    </Stack>
  );
};
