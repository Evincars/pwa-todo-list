import { Input, SegmentedControl, type SegmentedControlProps } from '@mantine/core';
import type { ReactNode } from 'react';

export interface SegmentedFieldOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedFieldProps<T extends string>
  extends Omit<SegmentedControlProps, 'data' | 'value' | 'onChange' | 'label'> {
  label?: ReactNode;
  description?: ReactNode;
  data: readonly SegmentedFieldOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Type-safe `SegmentedControl` with optional label/description. */
export const SegmentedField = <T extends string>({
  label,
  description,
  data,
  value,
  onChange,
  ...props
}: SegmentedFieldProps<T>) => (
  <Input.Wrapper label={label} description={description} inputWrapperOrder={['label', 'description', 'input']}>
    <SegmentedControl
      mt={label || description ? 6 : 0}
      data={data.map((item) => ({ ...item, label: item.label }))}
      value={value}
      onChange={(next) => onChange(next as T)}
      {...props}
    />
  </Input.Wrapper>
);
