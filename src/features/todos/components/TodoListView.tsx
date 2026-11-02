import { Collapse, EmptyState, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronRight, IconSparkles } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import type { TodoSections } from '@/domain/todoQuery';
import type { Todo } from '@/domain/types';
import { useTranslation } from '@/i18n';

export interface TodoListViewProps {
  sections: TodoSections;
  /** Total number of todos before filtering – distinguishes "empty list" from "no match". */
  totalCount: number;
  showCompleted: boolean;
  canWrite: boolean;
  renderItem: (todo: Todo) => ReactNode;
}

/** Active tasks plus a collapsible "Completed" section. */
export const TodoListView = ({ sections, totalCount, showCompleted, canWrite, renderItem }: TodoListViewProps) => {
  const { t } = useTranslation();
  const [completedOpen, completedHandlers] = useDisclosure(true);

  if (sections.active.length === 0 && sections.completed.length === 0) {
    return (
      <EmptyState
        icon={<IconSparkles />}
        variant="light"
        title={totalCount === 0 ? t('todos.emptyTitle') : t('todos.noMatch')}
        description={
          totalCount === 0 ? (canWrite ? t('todos.emptyWritable') : t('todos.emptyReadonly')) : t('todos.tryDifferent')
        }
        py="xl"
      />
    );
  }

  return (
    <>
      <Stack gap={6}>{sections.active.map(renderItem)}</Stack>

      {sections.active.length === 0 && sections.completed.length > 0 && (
        <Text ta="center" c="dimmed" size="sm" py="md">
          {t('todos.allDone')}
        </Text>
      )}

      {showCompleted && sections.completed.length > 0 && (
        <Stack gap={6}>
          <UnstyledButton onClick={completedHandlers.toggle} py={6} px={4} aria-expanded={completedOpen}>
            <Group gap={6}>
              <IconChevronRight
                size={16}
                style={{ transform: completedOpen ? 'rotate(90deg)' : undefined, transition: 'transform 150ms ease' }}
              />
              <Text size="sm" fw={600}>
                {t('todos.completed')}
              </Text>
              <Text size="sm" c="dimmed">
                {sections.completed.length}
              </Text>
            </Group>
          </UnstyledButton>
          <Collapse expanded={completedOpen}>
            <Stack gap={6}>{sections.completed.map(renderItem)}</Stack>
          </Collapse>
        </Stack>
      )}
    </>
  );
};
