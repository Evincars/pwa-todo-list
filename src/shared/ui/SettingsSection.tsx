import { Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

export interface SettingsSectionProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
}

export const SettingsSection = ({ title, description, icon, children }: SettingsSectionProps) => (
  <Stack gap="xs">
    <Group gap={8} px={4}>
      {icon}
      <div>
        <Title order={2} fz="sm" tt="uppercase" c="dimmed" lts={0.5}>
          {title}
        </Title>
        {description && (
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        )}
      </div>
    </Group>
    <Paper withBorder p="md" radius="lg">
      <Stack gap="md">{children}</Stack>
    </Paper>
  </Stack>
);

export interface SettingsRowProps {
  label: ReactNode;
  description?: ReactNode;
  /** Control rendered on the right (Switch, Select…). */
  control: ReactNode;
}

export const SettingsRow = ({ label, description, control }: SettingsRowProps) => (
  <Group justify="space-between" wrap="nowrap" gap="md">
    <div style={{ minWidth: 0 }}>
      <Text size="sm" fw={500}>
        {label}
      </Text>
      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}
    </div>
    <div style={{ flexShrink: 0 }}>{control}</div>
  </Group>
);
