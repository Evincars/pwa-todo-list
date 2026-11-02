import { ActionIcon, Chip, CloseButton, Group, TextInput, Tooltip } from '@mantine/core';
import { IconArrowsSort, IconSearch } from '@tabler/icons-react';
import { FILTER_LABEL, SORT_LABEL, TODO_FILTERS, TODO_SORT_KEYS, type TodoFilter, type TodoSortKey } from '@/domain/todoQuery';
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

const SORT_OPTIONS = TODO_SORT_KEYS.map((key) => ({ value: key, label: SORT_LABEL[key] }));

export const TodoToolbar = ({ search, onSearchChange, filter, onFilterChange, sort, onSortChange, counts }: TodoToolbarProps) => (
  <>
    <Group gap="xs" wrap="nowrap">
      <TextInput
        value={search}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
        placeholder="Search tasks"
        leftSection={<IconSearch size={16} />}
        rightSection={search ? <CloseButton size="sm" onClick={() => onSearchChange('')} aria-label="Clear search" /> : null}
        radius="xl"
        style={{ flex: 1 }}
        aria-label="Search tasks"
      />
      <SelectMenu
        label="Sort by"
        options={SORT_OPTIONS}
        value={sort}
        onChange={onSortChange}
        width={260}
        target={
          <Tooltip label={`Sort: ${SORT_LABEL[sort]}`}>
            <ActionIcon size="lg" variant="default" radius="xl" aria-label="Sort tasks">
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
            {FILTER_LABEL[key]}
            {counts[key] ? ` · ${counts[key]}` : ''}
          </Chip>
        ))}
      </div>
    </Chip.Group>
  </>
);
