import { ActionIcon, Alert, Button, EmptyState, Group, Menu, Stack, Tooltip, UnstyledButton } from '@mantine/core';
import { useDisclosure, useDocumentTitle } from '@mantine/hooks';
import {
  IconCalendarMonth,
  IconDots,
  IconEye,
  IconEyeOff,
  IconLock,
  IconListDetails,
  IconLogout,
  IconPencil,
  IconTrash,
  IconTrashX,
  IconUserPlus,
} from '@tabler/icons-react';
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { canManage, canWrite as canWriteAccess, getListAccess } from '@/domain/permissions';
import { queryTodos, TODO_FILTERS, type TodoFilter } from '@/domain/todoQuery';
import { getErrorMessage } from '@/domain/errors';
import { reminderIdOf, type CreateTodoInput, type ISODateString, type Priority, type Todo, type TodoId, type TodoList, type UpdateTodoInput } from '@/domain/types';
import { useCurrentUser } from '@/features/auth/authStore';
import { useDeleteList, useLeaveList, useListQuery, useUpdateList } from '@/features/lists/api';
import { ListFormModal } from '@/features/lists/components/ListFormModal';
import { ListIconView } from '@/features/lists/components/ListIconView';
import { ShareSheet } from '@/features/lists/components/ShareSheet';
import { useListReminders, useRemoveReminder, useSetReminder } from '@/features/reminders/api';
import { useListViewPrefs, useSettingsStore } from '@/features/settings/settingsStore';
import { haptic } from '@/lib/haptics';
import { AvatarStack, confirm, PageHeader } from '@/shared/ui';
import { useClearCompleted, useCreateTodo, useDeleteTodo, useTodosQuery, useUpdateTodo } from '../api';
import { QuickAddBar } from '../components/QuickAddBar';
import { TodoDetailsSheet } from '../components/TodoDetailsSheet';
import { TodoCalendarView } from '../components/TodoCalendarView';
import { TodoItem } from '../components/TodoItem';
import { TodoListView } from '../components/TodoListView';
import { TodoToolbar } from '../components/TodoToolbar';

const route = getRouteApi('/_authed/lists/$listId');
const NO_TODOS: Todo[] = [];

/** Guards against the list disappearing (deleted, or access revoked) while it's open. */
export const ListPage = () => {
  const { listId } = route.useParams();
  const listQuery = useListQuery(listId);

  if (listQuery.error || !listQuery.data) {
    return (
      <>
        <PageHeader title="List unavailable" onBack={() => window.history.back()} />
        <EmptyState
          icon={<IconLock />}
          variant="light"
          color="gray"
          title="You no longer have access"
          description={listQuery.error ? getErrorMessage(listQuery.error) : undefined}
          py={60}
        >
          <EmptyState.Actions>
            <Button component={Link} to="/">
              Back to my lists
            </Button>
          </EmptyState.Actions>
        </EmptyState>
      </>
    );
  }
  return <ListPageContent list={listQuery.data} />;
};

const ListPageContent = ({ list }: { list: TodoList }) => {
  const listId = list.id;
  const { task: openTaskId } = route.useSearch();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const todos = useTodosQuery(listId).data ?? NO_TODOS;
  useDocumentTitle(`${list.title} · Shared Todo`);

  const prefs = useListViewPrefs(listId);
  const setListPrefs = useSettingsStore((state) => state.setListPrefs);
  const confirmDelete = useSettingsStore((state) => state.confirmDelete);
  const [search, setSearch] = useState('');
  const [calendarDay, setCalendarDay] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [shareOpened, shareHandlers] = useDisclosure(false);
  const [editOpened, editHandlers] = useDisclosure(false);

  const { createTodo } = useCreateTodo(listId);
  const updateTodo = useUpdateTodo(listId);
  const deleteTodo = useDeleteTodo(listId);
  const clearCompleted = useClearCompleted(listId);
  const updateList = useUpdateList(listId);
  const deleteList = useDeleteList();
  const leaveList = useLeaveList();
  const reminders = useListReminders(listId);
  const { setReminder } = useSetReminder();
  const removeReminder = useRemoveReminder();

  const access = getListAccess(list, user.id);
  const writable = canWriteAccess(access);
  const isOwner = canManage(access);
  const isShared = Object.keys(list.members).length > 0;

  const sections = useMemo(
    () => queryTodos(todos, { filter: prefs.filter, sort: prefs.sort, search }),
    [todos, prefs.filter, prefs.sort, search],
  );

  const counts = useMemo(() => {
    const active = todos.filter((todo) => !todo.completed);
    return Object.fromEntries(
      TODO_FILTERS.filter((filter) => filter !== 'all').map((filter) => [
        filter,
        queryTodos(active, { filter, sort: 'smart', search: '' }).active.length,
      ]),
    ) as Partial<Record<TodoFilter, number>>;
  }, [todos]);

  const openTask = useCallback(
    (todo: Todo) => void navigate({ to: '.', search: { task: todo.id } }),
    [navigate],
  );
  const closeTask = () => void navigate({ to: '.', search: {}, replace: true });

  const handleToggle = useCallback(
    (todo: Todo, completed: boolean) => {
      if (completed) haptic([10, 40, 10]);
      updateTodo.mutate({ todoId: todo.id, input: { completed } });
    },
    [updateTodo],
  );

  const handlePriority = useCallback(
    (todo: Todo, priority: Priority) => updateTodo.mutate({ todoId: todo.id, input: { priority } }),
    [updateTodo],
  );

  const handleUpdate = (todo: Todo, input: UpdateTodoInput) => updateTodo.mutate({ todoId: todo.id, input });

  const handleAdd = (input: CreateTodoInput, remindAt: ISODateString | null) => {
    const todoId = createTodo(input);
    if (remindAt) setReminder({ listId, todoId, remindAt });
  };

  const handleReminderChange = (todo: Todo, remindAt: ISODateString | null) => {
    if (remindAt) setReminder({ listId, todoId: todo.id, remindAt });
    else removeReminder.mutate(reminderIdOf(listId, todo.id));
  };

  const handleDelete = async (todo: Todo) => {
    if (confirmDelete && !(await confirm({ title: 'Delete task?', message: `“${todo.title}” will be permanently deleted.`, confirmLabel: 'Delete', danger: true }))) {
      return;
    }
    closeTask();
    deleteTodo.mutate(todo.id);
    if (reminders.has(todo.id)) removeReminder.mutate(reminderIdOf(listId, todo.id));
  };

  const handleDeleteList = async () => {
    const ok = await confirm({
      title: `Delete “${list.title}”?`,
      message: isShared ? 'All members will lose access. This cannot be undone.' : 'All tasks will be deleted. This cannot be undone.',
      confirmLabel: 'Delete list',
      danger: true,
    });
    if (ok) deleteList.mutate(list.id, { onSuccess: () => void navigate({ to: '/', replace: true }) });
  };

  const handleLeave = async () => {
    const ok = await confirm({ title: 'Leave this list?', confirmLabel: 'Leave', danger: true });
    if (ok) leaveList.mutate(list.id, { onSuccess: () => void navigate({ to: '/', replace: true }) });
  };

  const renderItem = (todo: Todo) => (
    <TodoItem
      key={todo.id}
      todo={todo}
      canWrite={writable}
      showAuthor={isShared}
      reminder={reminders.get(todo.id)}
      onToggle={handleToggle}
      onOpen={openTask}
      onPriorityChange={handlePriority}
    />
  );

  const openTodo = openTaskId ? todos.find((todo) => todo.id === (openTaskId as TodoId)) : undefined;
  const isCalendar = prefs.view === 'calendar';
  const calendarDue =
    isCalendar && calendarDay >= dayjs().format('YYYY-MM-DD')
      ? { dueAt: dayjs(calendarDay).startOf('day').toISOString(), dueHasTime: false }
      : undefined;
  const memberCount = Object.keys(list.members).length + 1;

  return (
    <>
      <PageHeader
        onBack={() => void navigate({ to: '/' })}
        title={
          <>
            <ListIconView icon={list.icon} color={list.color} size={18} style={{ verticalAlign: '-2px' }} /> {list.title}
          </>
        }
        subtitle={isShared ? `${memberCount} people · ${isOwner ? 'Owner' : `Shared by ${list.owner.displayName}`}` : 'Private'}
        actions={
          <Group gap={4} wrap="nowrap">
            <Tooltip label={isCalendar ? 'List view' : 'Calendar view'}>
              <ActionIcon
                size="lg"
                color="gray"
                variant="subtle"
                onClick={() => setListPrefs(listId, { view: isCalendar ? 'list' : 'calendar' })}
                aria-label={isCalendar ? 'Show as list' : 'Show calendar'}
              >
                {isCalendar ? <IconListDetails /> : <IconCalendarMonth />}
              </ActionIcon>
            </Tooltip>
            <UnstyledButton onClick={shareHandlers.open} aria-label="Members and sharing" p={4}>
              {isShared ? (
                <AvatarStack users={[list.owner, ...Object.values(list.members)]} max={3} size="sm" />
              ) : (
                <IconUserPlus size={22} />
              )}
            </UnstyledButton>
            <Menu position="bottom-end" width={220} shadow="md">
              <Menu.Target>
                <ActionIcon size="lg" color="gray" aria-label="List options">
                  <IconDots />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {isOwner && (
                  <Menu.Item leftSection={<IconPencil size={16} />} onClick={editHandlers.open}>
                    Edit list
                  </Menu.Item>
                )}
                <Menu.Item leftSection={<IconUserPlus size={16} />} onClick={shareHandlers.open}>
                  {isOwner ? 'Share & permissions' : 'Members'}
                </Menu.Item>
                <Menu.Item
                  leftSection={prefs.showCompleted ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  onClick={() => setListPrefs(listId, { showCompleted: !prefs.showCompleted })}
                >
                  {prefs.showCompleted ? 'Hide completed' : 'Show completed'}
                </Menu.Item>
                {writable && (
                  <Menu.Item leftSection={<IconTrashX size={16} />} disabled={!todos.some((t) => t.completed)} onClick={() => clearCompleted.mutate()}>
                    Clear completed
                  </Menu.Item>
                )}
                <Menu.Divider />
                {isOwner ? (
                  <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => void handleDeleteList()}>
                    Delete list
                  </Menu.Item>
                ) : (
                  <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={() => void handleLeave()}>
                    Leave list
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        }
      />

      <div className="app-container" style={{ paddingBottom: writable ? 140 : undefined }}>
        <Stack gap="sm">
          {!writable && (
            <Alert variant="light" color="gray" icon={<IconEye size={18} />} radius="md" py="xs">
              View only – ask {list.owner.displayName} for edit access.
            </Alert>
          )}

          {isCalendar ? (
            <TodoCalendarView
              todos={todos}
              day={calendarDay}
              onDayChange={setCalendarDay}
              span={prefs.calendarSpan}
              onSpanChange={(calendarSpan) => setListPrefs(listId, { calendarSpan })}
              showCompleted={prefs.showCompleted}
              canWrite={writable}
              renderItem={renderItem}
              onShowUnscheduled={() => setListPrefs(listId, { view: 'list', filter: 'all' })}
            />
          ) : (
            <>
              <TodoToolbar
                search={search}
                onSearchChange={setSearch}
                filter={prefs.filter}
                onFilterChange={(filter) => setListPrefs(listId, { filter })}
                sort={prefs.sort}
                onSortChange={(sort) => setListPrefs(listId, { sort })}
                counts={counts}
              />
              <TodoListView
                sections={sections}
                totalCount={todos.length}
                showCompleted={prefs.showCompleted}
                canWrite={writable}
                renderItem={renderItem}
              />
            </>
          )}
        </Stack>
      </div>

      {writable && (
        <QuickAddBar
          onAdd={handleAdd}
          defaultDue={calendarDue}
          placeholder={calendarDue ? `Add a task for ${dayjs(calendarDay).format('ddd, D MMM')}` : undefined}
        />
      )}

      <TodoDetailsSheet
        todo={openTodo}
        canWrite={writable}
        onClose={closeTask}
        onUpdate={handleUpdate}
        onDelete={(todo) => void handleDelete(todo)}
        reminder={openTodo ? reminders.get(openTodo.id) : undefined}
        onReminderChange={handleReminderChange}
      />
      <ShareSheet list={list} opened={shareOpened} onClose={shareHandlers.close} />
      {isOwner && (
        <ListFormModal
          opened={editOpened}
          onClose={editHandlers.close}
          list={list}
          loading={updateList.isPending}
          onSubmit={(values) => updateList.mutate(values, { onSuccess: editHandlers.close })}
        />
      )}
    </>
  );
};
