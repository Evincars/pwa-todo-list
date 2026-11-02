import { Menu, type MenuProps } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { ReactElement, ReactNode } from 'react';

export interface SelectMenuOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

export interface SelectMenuProps<T extends string> extends Pick<MenuProps, 'position' | 'width'> {
  target: ReactElement;
  label?: ReactNode;
  options: readonly SelectMenuOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Dropdown menu acting as a single-choice select (e.g. "Sort by"). */
export const SelectMenu = <T extends string>({
  target,
  label,
  options,
  value,
  onChange,
  position = 'bottom-end',
  width = 240,
}: SelectMenuProps<T>) => (
  <Menu position={position} width={width} shadow="md">
    <Menu.Target>{target}</Menu.Target>
    <Menu.Dropdown>
      {label && <Menu.Label>{label}</Menu.Label>}
      {options.map((option) => (
        <Menu.Item
          key={option.value}
          leftSection={option.icon}
          rightSection={option.value === value ? <IconCheck size={16} /> : null}
          onClick={() => onChange(option.value)}
          fw={option.value === value ? 600 : undefined}
        >
          {option.label}
        </Menu.Item>
      ))}
    </Menu.Dropdown>
  </Menu>
);
