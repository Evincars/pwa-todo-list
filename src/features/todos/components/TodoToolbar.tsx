import { ActionIcon, Chip, CloseButton, Group, TextInput, Tooltip } from '@mantine/core';
import { IconArrowsSort, IconSearch } from '@tabler/icons-react';
import { TODO_FILTERS, TODO_SORT_KEYS, type TodoFilter, type TodoSortKey } from '@/domain/todoQuery';
import { useTranslation } from '@/i18n';
import { SelectMenu } from '@/shared/ui';

export interface TodoToolbarProps {
  search: string;
  onSearchChange: (search: string) => void;
  filter: TodoFilter;
  onFilterChange: (filter: TodoFilter) => void;
  sort: TodoSortKey;
  onSortChange: (sort: TodoSortKey) => void;
  counts: Partial<Record<TodoFilter, number>>;
}

export const TodoToolbar = ({ search, onSearchChange, filter, onFilterChange, sort, onSortChange, counts }: TodoToolbarProps) => {
  const { t } = useTranslation();
  return (
    <>
      <Group gap="xs" wrap="nowrap">
        <TextInput
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder={t('todos.search')}
          leftSection={<IconSearch size={16} />}
          rightSection={search ? <CloseButton size="sm" onClick={() => onSearchChange('')} aria-label={t('todos.clearSearch')} /> : null}
          radius="xl"
          style={{ flex: 1 }}
          aria-label={t('todos.search')}
        />
        <SelectMenu
          label={t('sort.label')}
          options={TODO_SORT_KEYS.map((key) => ({ value: key, label: t(`sort.${key}`) }))}
          value={sort}
          onChange={onSortChange}
          width={260}
          target={
            <Tooltip label={search.trim() ? t('sort.relevance') : t('sort.tooltip', { sort: t(`sort.${sort}`) })}>
              <ActionIcon size="lg" variant="default" radius="xl" aria-label={t('sort.aria')}>
                <IconArrowsSort size={18} />
              </ActionIcon>
            </Tooltip>
          }
        />
      </Group>
      <Chip.Group<false, TodoFilter> value={filter} onChange={onFilterChange}>
        <div className="scroll-row">
          {TODO_FILTERS.map((key) => (
            <Chip key={key} value={key} size="sm" variant="light" color={key === 'overdue' ? 'red' : undefined} style={{ flexShrink: 0 }}>
              {t(`filter.${key}`)}
              {counts[key] ? ` · ${counts[key]}` : ''}
            </Chip>
          ))}
        </div>
      </Chip.Group>
    </>
  );
};
