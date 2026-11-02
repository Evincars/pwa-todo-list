import { ActionIcon, Text, Title } from '@mantine/core';
import { IconChevronLeft } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import classes from './PageHeader.module.css';

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Renders a back button when provided. */
  onBack?: () => void;
  leftSection?: ReactNode;
  actions?: ReactNode;
}

/** Sticky, translucent app bar respecting the iOS safe area. */
export const PageHeader = ({ title, subtitle, onBack, leftSection, actions }: PageHeaderProps) => (
  <header className={classes.root}>
    <div className={classes.inner}>
      {onBack && (
        <ActionIcon size="lg" onClick={onBack} aria-label="Back" color="gray">
          <IconChevronLeft />
        </ActionIcon>
      )}
      {leftSection}
      <div className={classes.title}>
        <Title order={1} fz="lg" lineClamp={1}>
          {title}
        </Title>
        {subtitle && (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {subtitle}
          </Text>
        )}
      </div>
      {actions}
    </div>
  </header>
);
