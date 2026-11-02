import { createFileRoute } from '@tanstack/react-router';
import type { InvitationId } from '@/domain/types';
import { AcceptInvitationPage } from '@/features/invitations/pages/AcceptInvitationPage';

export const Route = createFileRoute('/_authed/invite/$invitationId')({
  params: {
    parse: ({ invitationId }) => ({ invitationId: invitationId as InvitationId }),
    stringify: ({ invitationId }) => ({ invitationId }),
  },
  component: AcceptInvitationPage,
});
