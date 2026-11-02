import { Select, type SelectProps } from '@mantine/core';
import type { MemberPermission } from '@/domain/types';
import { useTranslation } from '@/i18n';

export const PERMISSIONS: readonly MemberPermission[] = ['read', 'write'];

export interface PermissionSelectProps extends Omit<SelectProps, 'data' | 'value' | 'onChange'> {
  value: MemberPermission;
  onChange: (permission: MemberPermission) => void;
}

export const PermissionSelect = ({ value, onChange, ...props }: PermissionSelectProps) => {
  const { t } = useTranslation();
  return (
    <Select
      data={PERMISSIONS.map((permission) => ({ value: permission, label: t(`access.${permission}`) }))}
      value={value}
      onChange={(next) => next && onChange(next as MemberPermission)}
      allowDeselect={false}
      checkIconPosition="right"
      w={124}
      comboboxProps={{ withinPortal: true, zIndex: 1000 }}
      {...props}
    />
  );
};
