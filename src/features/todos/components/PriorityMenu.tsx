import { ActionIcon, Box, Button, Tooltip } from '@mantine/core';
import { IconFlag, IconFlagFilled } from '@tabler/icons-react';
import { forwardRef } from 'react';
import { PRIORITY_META, PRIORITY_ORDER } from '@/domain/priority';
import type { Priority } from '@/domain/types';
import { useTranslation } from '@/i18n';
import { SelectMenu } from '@/shared/ui';

export const PriorityFlag = ({ priority, size = 18 }: { priority: Priority; size?: number }) =>
  priority === 'none' ? (
    <IconFlag size={size} color="var(--mantine-color-dimmed)" />
  ) : (
    <IconFlagFilled size={size} color={`var(--mantine-color-${PRIORITY_META[priority].color}-filled)`} />
  );

export interface PriorityMenuProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  /** `icon` = compact flag button, `button` = labelled chip. */
  variant?: 'icon' | 'button';
  disabled?: boolean;
}

const PriorityTrigger = forwardRef<HTMLButtonElement, { value: Priority; variant: 'icon' | 'button'; disabled?: boolean }>(
  ({ value, variant, disabled, ...rest }, ref) => {
    const { t } = useTranslation();
    return variant === 'icon' ? (
      <Tooltip label={t('priority.tooltip', { priority: t(`priority.${value}`) })} openDelay={500}>
        <ActionIcon ref={ref} size="lg" color="gray" aria-label={t('priority.set')} disabled={disabled} {...rest}>
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
        {value === 'none' ? t('priority.label') : t(`priority.${value}`)}
      </Button>
    );
  },
);
PriorityTrigger.displayName = 'PriorityTrigger';

export const PriorityMenu = ({ value, onChange, variant = 'icon', disabled }: PriorityMenuProps) => {
  const { t } = useTranslation();
  if (disabled) {
    // Read-only: a plain indicator instead of a greyed-out button.
    return value === 'none' ? null : (
      <Box p={8} display="flex" aria-label={t('priority.tooltip', { priority: t(`priority.${value}`) })}>
        <PriorityFlag priority={value} />
      </Box>
    );
  }
  return (
    <SelectMenu
      label={t('priority.label')}
      width={200}
      options={PRIORITY_ORDER.map((priority) => ({
        value: priority,
        label: t(`priority.${priority}`),
        icon: <PriorityFlag priority={priority} size={16} />,
      }))}
      value={value}
      onChange={onChange}
      target={<PriorityTrigger value={value} variant={variant} />}
    />
  );
};
