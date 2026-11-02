import { Select, type SelectProps } from '@mantine/core';
import type { MemberPermission } from '@/domain/types';

export const PERMISSION_OPTIONS: { value: MemberPermission; label: string }[] = [
  { value: 'read', label: 'Can view' },
  { value: 'write', label: 'Can edit' },
];

export interface PermissionSelectProps extends Omit<SelectProps, 'data' | 'value' | 'onChange'> {
  value: MemberPermission;
  onChange: (permission: MemberPermission) => void;
}

export const PermissionSelect = ({ value, onChange, ...props }: PermissionSelectProps) => (
  <Select
    data={PERMISSION_OPTIONS}
    value={value}
    onChange={(next) => next && onChange(next as MemberPermission)}
    allowDeselect={false}
    checkIconPosition="right"
    w={124}
    comboboxProps={{ withinPortal: true, zIndex: 1000 }}
    {...props}
  />
);
