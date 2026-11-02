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
import type { ReactNode } from 'react';
import { canManage, getListAccess } from '@/domain/permissions';
import type { Invitation, MemberPermission, TodoList } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/authStore';
import { buildInviteUrl, useCreateInvitation, useListInvitationsQuery, useRevokeInvitation } from '@/features/invitations/api';
import { useTranslation } from '@/i18n';
import { formatDate } from '@/lib/dates';
import { notify } from '@/lib/notify';
import dayjs from 'dayjs';
import { confirm, ResponsiveModal, UserAvatar, type AvatarUser } from '@/shared/ui';
import { useLeaveList, useRemoveMember, useSetMemberPermission } from '../api';
import { PERMISSIONS, PermissionSelect } from './PermissionSelect';

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
  const { t } = useTranslation();
  const createInvitation = useCreateInvitation(list.id);
  const form = useForm<{ email: string; permission: MemberPermission }>({
    initialValues: { email: '', permission: 'read' },
    validate: { email: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : t('auth.emailInvalid')) },
  });

  return (
    <form
      onSubmit={form.onSubmit((values) =>
        createInvitation.mutate(
          { kind: 'email', ...values },
          {
            onSuccess: () => {
              notify.success(t('share.sent', { email: values.email }));
              form.reset();
            },
          },
        ),
      )}
    >
      <Stack gap="xs">
        <Group align="flex-start" gap="xs" wrap="nowrap">
          <TextInput
            placeholder={t('share.emailPlaceholder')}
            type="email"
            leftSection={<IconMail size={16} />}
            style={{ flex: 1 }}
            aria-label={t('share.emailAria')}
            {...form.getInputProps('email')}
          />
          <PermissionSelect value={form.values.permission} onChange={(permission) => form.setFieldValue('permission', permission)} />
        </Group>
        <Button type="submit" loading={createInvitation.isPending}>
          {t('share.send')}
        </Button>
        <Text size="xs" c="dimmed">
          {t('share.emailHint')}
        </Text>
      </Stack>
    </form>
  );
};

const InviteByLink = ({ list, links }: { list: TodoList; links: Invitation[] }) => {
  const { t } = useTranslation();
  const createInvitation = useCreateInvitation(list.id);
  const revoke = useRevokeInvitation(list.id);

  const share = async (invitation: Invitation) => {
    const url = buildInviteUrl(invitation.id);
    if (navigator.share) {
      await navigator.share({ title: list.title, text: t('share.joinMyList', { title: list.title }), url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      notify.success(t('share.linkCopied'));
    }
  };

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {t('share.linkDescription')}
      </Text>
      <Group gap="xs" grow>
        {PERMISSIONS.map((permission) => (
          <Button
            key={permission}
            variant="light"
            leftSection={<IconLink size={16} />}
            loading={createInvitation.isPending && createInvitation.variables.permission === permission}
            onClick={() => createInvitation.mutate({ kind: 'link', permission }, { onSuccess: share })}
          >
            {t(`share.linkButton.${permission}`)}
          </Button>
        ))}
      </Group>
      {links.map((invitation) => {
        const url = buildInviteUrl(invitation.id);
        return (
          <Group key={invitation.id} gap="xs" wrap="nowrap">
            <Badge variant="light" color={invitation.permission === 'write' ? 'teal' : 'gray'} style={{ flexShrink: 0 }}>
              {t(`share.linkBadge.${invitation.permission}`)}
            </Badge>
            <Text size="xs" c="dimmed" style={{ flex: 1, minWidth: 0 }} truncate>
              {url}
            </Text>
            <CopyButton value={url}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? t('share.copied') : t('share.copyLink')}>
                  <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy} aria-label={t('share.copyLink')}>
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
            <ActionIcon color="gray" onClick={() => void share(invitation)} aria-label={t('share.shareLink')}>
              <IconShare size={16} />
            </ActionIcon>
            <Tooltip label={t('share.revoke')}>
              <ActionIcon color="red" onClick={() => revoke.mutate(invitation.id)} aria-label={t('share.revokeLink')}>
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
  const { t } = useTranslation();
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
      title: t('share.removeConfirm.title', { name: member.displayName }),
      message: t('share.removeConfirm.message'),
      confirmLabel: t('common.remove'),
      danger: true,
    });
    if (ok) removeMember.mutate(member.userId);
  };

  const handleLeave = async () => {
    const ok = await confirm({
      title: t('list.leaveConfirm.title'),
      message: t('list.leaveConfirm.message', { owner: list.owner.displayName }),
      confirmLabel: t('common.leave'),
      danger: true,
    });
    if (ok) leave.mutate(list.id, { onSuccess: () => void navigate({ to: '/', replace: true }) });
  };

  return (
    <ResponsiveModal opened={opened} onClose={onClose} title={t('share.title', { title: list.title })}>
      <Stack gap="lg">
        {isOwner ? (
          <Tabs defaultValue="email" variant="pills" radius="xl">
            <Tabs.List grow mb="md">
              <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>
                {t('share.byEmail')}
              </Tabs.Tab>
              <Tabs.Tab value="link" leftSection={<IconLink size={16} />}>
                {t('share.byLink')}
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
            {t(access === 'write' ? 'share.notOwner.write' : 'share.notOwner.read', { owner: list.owner.displayName })}
          </Alert>
        )}

        <Stack gap="sm">
          <Divider label={t('share.peopleWithAccess', { count: members.length + 1 })} labelPosition="left" />
          <PersonRow
            user={list.owner}
            subtitle={list.owner.id === user.id ? t('common.you') : list.owner.email}
            right={<Badge variant="light">{t('access.owner')}</Badge>}
          />
          {members.map((member) => (
            <PersonRow
              key={member.userId}
              user={member}
              subtitle={member.userId === user.id ? t('share.youWithEmail', { email: member.email }) : member.email}
              right={
                isOwner ? (
                  <Group gap={4} wrap="nowrap">
                    <PermissionSelect
                      size="xs"
                      value={member.permission}
                      onChange={(permission) => setPermission.mutate({ userId: member.userId, permission })}
                      aria-label={t('share.permissionFor', { name: member.displayName })}
                    />
                    <Tooltip label={t('common.remove')}>
                      <ActionIcon color="red" onClick={() => void handleRemove(member)} aria-label={t('share.removeName', { name: member.displayName })}>
                        <IconUserMinus size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                ) : (
                  <Badge variant="default">{t(`access.${member.permission}`)}</Badge>
                )
              }
            />
          ))}

          {isOwner &&
            pendingEmails.map((invitation) => (
              <PersonRow
                key={invitation.id}
                user={{ displayName: invitation.email ?? '' }}
                subtitle={t('share.invitedOn', { date: formatDate(dayjs(invitation.createdAt), 'dayMonth'), access: t(`access.${invitation.permission}`) })}
                right={
                  <Group gap={4} wrap="nowrap">
                    <Badge variant="outline" color="yellow">
                      {t('share.pending')}
                    </Badge>
                    <Tooltip label={t('share.revokeInvitation')}>
                      <ActionIcon color="gray" onClick={() => revoke.mutate(invitation.id)} aria-label={t('share.revokeInvitation')}>
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
            {t('list.menu.leave')}
          </Button>
        )}
      </Stack>
    </ResponsiveModal>
  );
};
