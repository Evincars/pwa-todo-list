import { createFileRoute } from '@tanstack/react-router';
import { myListsQueryOptions } from '@/features/lists/api';
import { ListsPage } from '@/features/lists/pages/ListsPage';

export const Route = createFileRoute('/_authed/_tabs/')({
  loader: ({ context: { queryClient, services } }) => queryClient.ensureQueryData(myListsQueryOptions(services)),
  component: ListsPage,
});
