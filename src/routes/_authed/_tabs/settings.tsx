import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';

export const Route = createFileRoute('/_authed/_tabs/settings')({
  component: SettingsPage,
});
