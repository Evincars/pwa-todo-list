import { Button, Input, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { LIST_COLORS, type CreateListInput, type TodoList } from '@/domain/types';
import { ResponsiveModal, SwatchPicker } from '@/shared/ui';
import { EmojiPicker } from './EmojiPicker';

export interface ListFormModalProps {
  opened: boolean;
  onClose: () => void;
  /** When provided, the form edits this list. */
  list?: TodoList;
  loading?: boolean;
  onSubmit: (values: CreateListInput) => void;
}

const DEFAULT_VALUES: CreateListInput = { title: '', emoji: '📝', color: 'blue' };

export const ListFormModal = ({ opened, onClose, list, loading, onSubmit }: ListFormModalProps) => {
  const form = useForm<CreateListInput>({
    initialValues: DEFAULT_VALUES,
    validate: { title: (value) => (value.trim() ? null : 'Give your list a name') },
  });

  // Re-initialize every time the modal opens.
  useEffect(() => {
    if (opened) form.setValues(list ? { title: list.title, emoji: list.emoji, color: list.color } : DEFAULT_VALUES);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, list]);

  return (
    <ResponsiveModal opened={opened} onClose={onClose} title={list ? 'Edit list' : 'New list'}>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="Name"
            placeholder="e.g. Groceries"
            data-autofocus
            maxLength={60}
            leftSection={<span style={{ fontSize: 18 }}>{form.values.emoji}</span>}
            {...form.getInputProps('title')}
          />
          <Input.Wrapper label="Icon">
            <EmojiPicker value={form.values.emoji} onChange={(emoji) => form.setFieldValue('emoji', emoji)} />
          </Input.Wrapper>
          <Input.Wrapper label="Color">
            <SwatchPicker
              values={LIST_COLORS}
              value={form.values.color}
              onChange={(color) => form.setFieldValue('color', color)}
              aria-label="List color"
              size={28}
            />
          </Input.Wrapper>
          <Button type="submit" loading={loading} fullWidth mt="xs" size="md">
            {list ? 'Save changes' : 'Create list'}
          </Button>
        </Stack>
      </form>
    </ResponsiveModal>
  );
};
