import { ActionIcon, Affix, Button, EmptyState, SimpleGrid, Skeleton, Stack, Title } from '@mantine/core';
import { useDisclosure, useDocumentTitle } from '@mantine/hooks';
import { IconListCheck, IconPlus } from '@tabler/icons-react';
import { Link, useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { TodoList } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/authStore';
import { InvitationsInbox } from '@/features/invitations/components/InvitationsInbox';
import { useTranslation } from '@/i18n';
import { PageHeader, QueryView, UserAvatar } from '@/shared/ui';
import { useCreateList, useMyListsQuery } from '../api';
import { ListCard } from '../components/ListCard';
import { ListFormModal } from '../components/ListFormModal';

const greetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const ListSection = ({ title, lists, userId }: { title: ReactNode; lists: TodoList[]; userId: TodoList['owner']['id'] }) =>
  lists.length ? (
    <Stack gap="xs">
      <Title order={2} fz="sm" tt="uppercase" c="dimmed" px={4}>
        {title}
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {lists.map((list) => (
          <ListCard key={list.id} list={list} currentUserId={userId} />
        ))}
      </SimpleGrid>
    </Stack>
  ) : null;

export const ListsPage = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('app.pageTitle', { page: t('lists.title') }));
  const user = useCurrentUser();
  const listsQuery = useMyListsQuery();
  const createList = useCreateList();
  const navigate = useNavigate();
  const [formOpened, form] = useDisclosure(false);

  return (
    <>
      <PageHeader
        title={t('lists.title')}
        subtitle={t(`lists.greeting.${greetingKey()}`, { name: user.displayName.split(' ')[0] })}
        actions={
          <ActionIcon component={Link} to="/settings" size="lg" radius="xl" aria-label={t('lists.profileAndSettings')}>
            <UserAvatar user={user} size={32} />
          </ActionIcon>
        }
      />
      <div className="app-container">
        <Stack gap="lg">
          <InvitationsInbox />
          <QueryView
            query={listsQuery}
            loading={
              <Stack gap="sm">
                {[0, 1, 2].map((key) => (
                  <Skeleton key={key} h={112} radius="lg" />
                ))}
              </Stack>
            }
          >
            {(lists) =>
              lists.length === 0 ? (
                <EmptyState
                  icon={<IconListCheck />}
                  variant="light"
                  title={t('lists.emptyTitle')}
                  description={t('lists.emptyDescription')}
                  py="xl"
                >
                  <EmptyState.Actions>
                    <Button leftSection={<IconPlus size={18} />} onClick={form.open}>
                      {t('lists.createFirst')}
                    </Button>
                  </EmptyState.Actions>
                </EmptyState>
              ) : (
                <>
                  <ListSection title={t('lists.mine')} lists={lists.filter((l) => l.owner.id === user.id)} userId={user.id} />
                  <ListSection title={t('lists.shared')} lists={lists.filter((l) => l.owner.id !== user.id)} userId={user.id} />
                </>
              )
            }
          </QueryView>
        </Stack>
      </div>

      <Affix position={{ bottom: 'calc(var(--app-tabbar-height) + env(safe-area-inset-bottom) + 16px)', right: 16 }} zIndex={140}>
        <Button size="lg" radius="xl" leftSection={<IconPlus size={20} />} onClick={form.open} style={{ boxShadow: 'var(--mantine-shadow-lg)' }}>
          {t('lists.newList')}
        </Button>
      </Affix>

      <ListFormModal
        opened={formOpened}
        onClose={form.close}
        loading={createList.isPending}
        onSubmit={(values) =>
          createList.mutate(values, {
            onSuccess: (list) => {
              form.close();
              void navigate({ to: '/lists/$listId', params: { listId: list.id } });
            },
          })
        }
      />
    </>
  );
};
