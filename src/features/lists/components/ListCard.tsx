import { Badge, Card, Group, Progress, Skeleton, Text } from '@mantine/core';
import { IconAlertCircle, IconUsers } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import type { CSSProperties } from 'react';
import { getListAccess } from '@/domain/permissions';
import { isOverdue } from '@/domain/todoQuery';
import type { TodoList, UserId } from '@/domain/types';
import { useTodosQuery } from '@/features/todos/api';
import { useTranslation } from '@/i18n';
import { AvatarStack } from '@/shared/ui';
import classes from './ListCard.module.css';
import { ListIconView } from './ListIconView';

export interface ListCardProps {
  list: TodoList;
  currentUserId: UserId;
}

export const ListCard = ({ list, currentUserId }: ListCardProps) => {
  const { t } = useTranslation();
  const { data: todos } = useTodosQuery(list.id);
  const access = getListAccess(list, currentUserId);
  const members = Object.values(list.members);
  const total = todos?.length ?? 0;
  const done = todos?.filter((todo) => todo.completed).length ?? 0;
  const overdue = todos?.filter((todo) => isOverdue(todo)).length ?? 0;

  return (
    <Card
      renderRoot={(props) => <Link to="/lists/$listId" params={{ listId: list.id }} {...props} />}
      withBorder
      radius="lg"
      padding="md"
      className={classes.card}
      style={{ '--list-color': `var(--mantine-color-${list.color}-filled)` } as CSSProperties}
    >
      <Group wrap="nowrap" align="flex-start">
        <div className={classes.icon}>
          <ListIconView icon={list.icon} color={list.color} size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Text fw={600} lineClamp={1}>
              {list.title}
            </Text>
            {access !== 'owner' && (
              <Badge size="xs" variant="light" color={access === 'write' ? 'teal' : 'gray'}>
                {t(`access.${access}`)}
              </Badge>
            )}
          </Group>
          {todos ? (
            <Text size="xs" c="dimmed">
              {total === 0 ? t('lists.card.noTasks') : t('lists.card.progress', { done, total })}
            </Text>
          ) : (
            <Skeleton h={10} w={80} mt={6} />
          )}
          <Progress value={total ? (done / total) * 100 : 0} size="sm" mt="xs" color={list.color} radius="xl" />
          <Group justify="space-between" mt="sm" gap="xs">
            <Group gap={6}>
              {overdue > 0 && (
                <Badge size="sm" color="red" variant="light" leftSection={<IconAlertCircle size={12} />}>
                  {t('lists.card.overdue', { count: overdue })}
                </Badge>
              )}
              {access !== 'owner' && (
                <Text size="xs" c="dimmed">
                  {t('lists.card.by', { name: list.owner.displayName })}
                </Text>
              )}
            </Group>
            {members.length > 0 ? (
              <AvatarStack users={[list.owner, ...members]} size="sm" />
            ) : (
              <IconUsers size={16} color="var(--mantine-color-dimmed)" aria-label={t('lists.card.notShared')} style={{ opacity: 0.4 }} />
            )}
          </Group>
        </div>
      </Group>
    </Card>
  );
};
