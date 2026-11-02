import { Button, Input, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { LIST_COLORS, type CreateListInput, type TodoList } from '@/domain/types';
import { useTranslation } from '@/i18n';
import { ResponsiveModal, SwatchPicker } from '@/shared/ui';
import { DEFAULT_LIST_ICON } from '../listIcons';
import { ListIconPicker } from './ListIconPicker';
import { ListIconView } from './ListIconView';

export interface ListFormModalProps {
  opened: boolean;
  onClose: () => void;
  /** When provided, the form edits this list. */
  list?: TodoList;
  loading?: boolean;
  onSubmit: (values: CreateListInput) => void;
}

const DEFAULT_VALUES: CreateListInput = { title: '', icon: DEFAULT_LIST_ICON, color: 'blue' };

export const ListFormModal = ({ opened, onClose, list, loading, onSubmit }: ListFormModalProps) => {
  const { t } = useTranslation();
  const form = useForm<CreateListInput>({
    initialValues: DEFAULT_VALUES,
    validate: { title: (value) => (value.trim() ? null : t('lists.form.nameRequired')) },
  });

  // Re-initialize every time the modal opens.
  useEffect(() => {
    if (opened) form.setValues(list ? { title: list.title, icon: list.icon, color: list.color } : DEFAULT_VALUES);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, list]);

  return (
    <ResponsiveModal opened={opened} onClose={onClose} title={list ? t('lists.editList') : t('lists.newList')}>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label={t('lists.form.name')}
            placeholder={t('lists.form.namePlaceholder')}
            data-autofocus
            maxLength={60}
            leftSection={<ListIconView icon={form.values.icon} color={form.values.color} size={18} />}
            {...form.getInputProps('title')}
          />
          <Input.Wrapper label={t('lists.form.icon')}>
            <ListIconPicker value={form.values.icon} color={form.values.color} onChange={(icon) => form.setFieldValue('icon', icon)} />
          </Input.Wrapper>
          <Input.Wrapper label={t('lists.form.color')}>
            <SwatchPicker
              values={LIST_COLORS}
              value={form.values.color}
              onChange={(color) => form.setFieldValue('color', color)}
              aria-label={t('lists.form.colorAria')}
              size={28}
            />
          </Input.Wrapper>
          <Button type="submit" loading={loading} fullWidth mt="xs" size="md">
            {list ? t('lists.form.save') : t('lists.form.create')}
          </Button>
        </Stack>
      </form>
    </ResponsiveModal>
  );
};
