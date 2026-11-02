import { ActionIcon, Affix, Button, EmptyState, SimpleGrid, Skeleton, Stack, Title } from '@mantine/core';
import { useDisclosure, useDocumentTitle } from '@mantine/hooks';
import { IconListCheck, IconPlus } from '@tabler/icons-react';
import { Link, useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { TodoList } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/authStore';
import { InvitationsInbox } from '@/features/invitations/components/InvitationsInbox';
import { PageHeader, QueryView, UserAvatar } from '@/shared/ui';
import { useCreateList, useMyListsQuery } from '../api';
import { ListCard } from '../components/ListCard';
import { ListFormModal } from '../components/ListFormModal';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
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
  useDocumentTitle('My lists · Shared Todo');
  const user = useCurrentUser();
  const listsQuery = useMyListsQuery();
  const createList = useCreateList();
  const navigate = useNavigate();
  const [formOpened, form] = useDisclosure(false);

  return (
    <>
      <PageHeader
        title="My lists"
        subtitle={`${greeting()}, ${user.displayName.split(' ')[0]}`}
        actions={
          <ActionIcon component={Link} to="/settings" size="lg" radius="xl" aria-label="Profile & settings">
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
                  title="No lists yet"
                  description="Create your first list and invite others to collaborate."
                  py="xl"
                >
                  <EmptyState.Actions>
                    <Button leftSection={<IconPlus size={18} />} onClick={form.open}>
                      Create a list
                    </Button>
                  </EmptyState.Actions>
                </EmptyState>
              ) : (
                <>
                  <ListSection title="My lists" lists={lists.filter((l) => l.owner.id === user.id)} userId={user.id} />
                  <ListSection title="Shared with me" lists={lists.filter((l) => l.owner.id !== user.id)} userId={user.id} />
                </>
              )
            }
          </QueryView>
        </Stack>
      </div>

      <Affix position={{ bottom: 'calc(var(--app-tabbar-height) + env(safe-area-inset-bottom) + 16px)', right: 16 }} zIndex={140}>
        <Button size="lg" radius="xl" leftSection={<IconPlus size={20} />} onClick={form.open} style={{ boxShadow: 'var(--mantine-shadow-lg)' }}>
          New list
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
