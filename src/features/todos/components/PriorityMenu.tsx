import { ActionIcon, Box, Button, Tooltip } from '@mantine/core';
import { IconFlag, IconFlagFilled } from '@tabler/icons-react';
import { forwardRef } from 'react';
import { PRIORITY_META, PRIORITY_ORDER } from '@/domain/priority';
import type { Priority } from '@/domain/types';
import { SelectMenu, type SelectMenuOption } from '@/shared/ui';

export const PriorityFlag = ({ priority, size = 18 }: { priority: Priority; size?: number }) =>
  priority === 'none' ? (
    <IconFlag size={size} color="var(--mantine-color-dimmed)" />
  ) : (
    <IconFlagFilled size={size} color={`var(--mantine-color-${PRIORITY_META[priority].color}-filled)`} />
  );

export const PRIORITY_OPTIONS: SelectMenuOption<Priority>[] = PRIORITY_ORDER.map((priority) => ({
  value: priority,
  label: PRIORITY_META[priority].label,
  icon: <PriorityFlag priority={priority} size={16} />,
}));

export interface PriorityMenuProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  /** `icon` = compact flag button, `button` = labelled chip. */
  variant?: 'icon' | 'button';
  disabled?: boolean;
}

const PriorityTrigger = forwardRef<HTMLButtonElement, { value: Priority; variant: 'icon' | 'button'; disabled?: boolean }>(
  ({ value, variant, disabled, ...rest }, ref) =>
    variant === 'icon' ? (
      <Tooltip label={`Priority: ${PRIORITY_META[value].label}`} openDelay={500}>
        <ActionIcon ref={ref} size="lg" color="gray" aria-label="Set priority" disabled={disabled} {...rest}>
          <PriorityFlag priority={value} />
        </ActionIcon>
      </Tooltip>
    ) : (
      <Button
        ref={ref}
        size="compact-sm"
        radius="xl"
        variant={value === 'none' ? 'default' : 'light'}
        color={PRIORITY_META[value].color}
        leftSection={<PriorityFlag priority={value} size={14} />}
        disabled={disabled}
        {...rest}
      >
        {value === 'none' ? 'Priority' : PRIORITY_META[value].label}
      </Button>
    ),
);
PriorityTrigger.displayName = 'PriorityTrigger';

export const PriorityMenu = ({ value, onChange, variant = 'icon', disabled }: PriorityMenuProps) => {
  if (disabled) {
    // Read-only: a plain indicator instead of a greyed-out button.
    return value === 'none' ? null : (
      <Box p={8} display="flex" aria-label={`Priority: ${PRIORITY_META[value].label}`}>
        <PriorityFlag priority={value} />
      </Box>
    );
  }
  return (
    <SelectMenu
      label="Priority"
      width={200}
      options={PRIORITY_OPTIONS}
      value={value}
      onChange={onChange}
      target={<PriorityTrigger value={value} variant={variant} />}
    />
  );
};
