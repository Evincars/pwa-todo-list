import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  CopyButton,
  Divider,
  Group,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconCopy, IconLink, IconLogout, IconMail, IconShare, IconUserMinus, IconX } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { ACCESS_LABEL, canManage, getListAccess } from '@/domain/permissions';
import type { Invitation, MemberPermission, TodoList } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/authStore';
import { buildInviteUrl, useCreateInvitation, useListInvitationsQuery, useRevokeInvitation } from '@/features/invitations/api';
import { notify } from '@/lib/notify';
import { confirm, ResponsiveModal, UserAvatar, type AvatarUser } from '@/shared/ui';
import { useLeaveList, useRemoveMember, useSetMemberPermission } from '../api';
import { PERMISSION_OPTIONS, PermissionSelect } from './PermissionSelect';

export interface ShareSheetProps {
  list: TodoList;
  opened: boolean;
  onClose: () => void;
}

const PersonRow = ({ user, subtitle, right }: { user: AvatarUser & { email?: string }; subtitle?: ReactNode; right: ReactNode }) => (
  <Group wrap="nowrap" gap="sm">
    <UserAvatar user={user} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <Text size="sm" fw={500} lineClamp={1}>
        {user.displayName}
      </Text>
      <Text size="xs" c="dimmed" lineClamp={1}>
        {subtitle ?? user.email}
      </Text>
    </div>
    {right}
  </Group>
);

const InviteByEmail = ({ list }: { list: TodoList }) => {
  const createInvitation = useCreateInvitation(list.id);
  const form = useForm<{ email: string; permission: MemberPermission }>({
    initialValues: { email: '', permission: 'read' },
    validate: { email: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : 'Enter a valid e-mail') },
  });

  return (
    <form
      onSubmit={form.onSubmit((values) =>
        createInvitation.mutate(
          { kind: 'email', ...values },
          {
            onSuccess: () => {
              notify.success(`Invitation sent to ${values.email}`);
              form.reset();
            },
          },
        ),
      )}
    >
      <Stack gap="xs">
        <Group align="flex-start" gap="xs" wrap="nowrap">
          <TextInput
            placeholder="friend@example.com"
            type="email"
            leftSection={<IconMail size={16} />}
            style={{ flex: 1 }}
            aria-label="E-mail address"
            {...form.getInputProps('email')}
          />
          <PermissionSelect value={form.values.permission} onChange={(permission) => form.setFieldValue('permission', permission)} />
        </Group>
        <Button type="submit" loading={createInvitation.isPending}>
          Send invitation
        </Button>
        <Text size="xs" c="dimmed">
          They'll see the invitation after signing in with this e-mail.
        </Text>
      </Stack>
    </form>
  );
};

const InviteByLink = ({ list, links }: { list: TodoList; links: Invitation[] }) => {
  const createInvitation = useCreateInvitation(list.id);
  const revoke = useRevokeInvitation(list.id);

  const share = async (invitation: Invitation) => {
    const url = buildInviteUrl(invitation.id);
    if (navigator.share) {
      await navigator.share({ title: list.title, text: `Join my list "${list.title}"`, url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      notify.success('Link copied');
    }
  };

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Anyone with the link can join after signing in. Links expire after 14 days.
      </Text>
      <Group gap="xs" grow>
        {PERMISSION_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="light"
            leftSection={<IconLink size={16} />}
            loading={createInvitation.isPending && createInvitation.variables.permission === option.value}
            onClick={() => createInvitation.mutate({ kind: 'link', permission: option.value }, { onSuccess: share })}
          >
            {option.label} link
          </Button>
        ))}
      </Group>
      {links.map((invitation) => {
        const url = buildInviteUrl(invitation.id);
        return (
          <Group key={invitation.id} gap="xs" wrap="nowrap">
            <Badge variant="light" color={invitation.permission === 'write' ? 'teal' : 'gray'} style={{ flexShrink: 0 }}>
              {invitation.permission === 'write' ? 'Edit' : 'View'}
            </Badge>
            <Text size="xs" c="dimmed" style={{ flex: 1, minWidth: 0 }} truncate>
              {url}
            </Text>
            <CopyButton value={url}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy link'}>
                  <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy} aria-label="Copy link">
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
            <ActionIcon color="gray" onClick={() => void share(invitation)} aria-label="Share link">
              <IconShare size={16} />
            </ActionIcon>
            <Tooltip label="Revoke">
              <ActionIcon color="red" onClick={() => revoke.mutate(invitation.id)} aria-label="Revoke link">
                <IconX size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      })}
    </Stack>
  );
};

export const ShareSheet = ({ list, opened, onClose }: ShareSheetProps) => {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const access = getListAccess(list, user.id);
  const isOwner = canManage(access);
  const invitationsQuery = useListInvitationsQuery(list.id, opened && isOwner);
  const setPermission = useSetMemberPermission(list.id);
  const removeMember = useRemoveMember(list.id);
  const revoke = useRevokeInvitation(list.id);
  const leave = useLeaveList();

  const members = Object.values(list.members).sort((a, b) => a.displayName.localeCompare(b.displayName));
  const pendingEmails = invitationsQuery.data?.filter((invitation) => invitation.kind === 'email') ?? [];
  const links = invitationsQuery.data?.filter((invitation) => invitation.kind === 'link') ?? [];

  const handleRemove = async (member: (typeof members)[number]) => {
    const ok = await confirm({
      title: `Remove ${member.displayName}?`,
      message: 'They will immediately lose access to this list.',
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok) removeMember.mutate(member.userId);
  };

  const handleLeave = async () => {
    const ok = await confirm({
      title: 'Leave this list?',
      message: `You'll need a new invitation from ${list.owner.displayName} to rejoin.`,
      confirmLabel: 'Leave',
      danger: true,
    });
    if (ok) leave.mutate(list.id, { onSuccess: () => void navigate({ to: '/', replace: true }) });
  };

  return (
    <ResponsiveModal opened={opened} onClose={onClose} title={`Share “${list.title}”`}>
      <Stack gap="lg">
        {isOwner ? (
          <Tabs defaultValue="email" variant="pills" radius="xl">
            <Tabs.List grow mb="md">
              <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>
                By e-mail
              </Tabs.Tab>
              <Tabs.Tab value="link" leftSection={<IconLink size={16} />}>
                Invite link
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="email">
              <InviteByEmail list={list} />
            </Tabs.Panel>
            <Tabs.Panel value="link">
              <InviteByLink list={list} links={links} />
            </Tabs.Panel>
          </Tabs>
        ) : (
          <Alert variant="light" color={access === 'write' ? 'teal' : 'gray'} radius="md">
            You {access === 'write' ? 'can edit' : 'can view'} this list. Only {list.owner.displayName} can invite people and change
            permissions.
          </Alert>
        )}

        <Stack gap="sm">
          <Divider label={`People with access · ${members.length + 1}`} labelPosition="left" />
          <PersonRow
            user={list.owner}
            subtitle={list.owner.id === user.id ? 'You' : list.owner.email}
            right={<Badge variant="light">{ACCESS_LABEL.owner}</Badge>}
          />
          {members.map((member) => (
            <PersonRow
              key={member.userId}
              user={member}
              subtitle={member.userId === user.id ? `You · ${member.email}` : member.email}
              right={
                isOwner ? (
                  <Group gap={4} wrap="nowrap">
                    <PermissionSelect
                      size="xs"
                      value={member.permission}
                      onChange={(permission) => setPermission.mutate({ userId: member.userId, permission })}
                      aria-label={`Permission for ${member.displayName}`}
                    />
                    <Tooltip label="Remove">
                      <ActionIcon color="red" onClick={() => void handleRemove(member)} aria-label={`Remove ${member.displayName}`}>
                        <IconUserMinus size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                ) : (
                  <Badge variant="default">{ACCESS_LABEL[member.permission]}</Badge>
                )
              }
            />
          ))}

          {isOwner &&
            pendingEmails.map((invitation) => (
              <PersonRow
                key={invitation.id}
                user={{ displayName: invitation.email ?? '' }}
                subtitle={`Invited ${dayjs(invitation.createdAt).format('D MMM')} · ${ACCESS_LABEL[invitation.permission]}`}
                right={
                  <Group gap={4} wrap="nowrap">
                    <Badge variant="outline" color="yellow">
                      Pending
                    </Badge>
                    <Tooltip label="Revoke invitation">
                      <ActionIcon color="gray" onClick={() => revoke.mutate(invitation.id)} aria-label="Revoke invitation">
                        <IconX size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                }
              />
            ))}
        </Stack>

        {!isOwner && (
          <Button variant="light" color="red" leftSection={<IconLogout size={16} />} onClick={() => void handleLeave()} loading={leave.isPending}>
            Leave list
          </Button>
        )}
      </Stack>
    </ResponsiveModal>
  );
};
