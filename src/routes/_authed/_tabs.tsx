import { createFileRoute } from '@tanstack/react-router';
import { TabsLayout } from '@/app/TabsLayout';

export const Route = createFileRoute('/_authed/_tabs')({
  component: TabsLayout,
});
