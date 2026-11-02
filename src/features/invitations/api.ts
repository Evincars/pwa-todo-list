import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { CreateInvitationInput, Invitation, InvitationId, ListId } from '@/domain/types';
import { queryKeys } from '@/lib/queryKeys';
import { useLiveInvalidation } from '@/lib/useLiveInvalidation';
import { useServices } from '@/services/ServicesContext';
import type { Services } from '@/services/types';

export const invitationQueryOptions = (services: Services, invitationId: InvitationId) =>
  queryOptions({
    queryKey: queryKeys.invitations.detail(invitationId),
    queryFn: () => services.invitations.getInvitation(invitationId),
  });

const useInvitationsLive = () => {
  const { invitations } = useServices();
  useLiveInvalidation(
    queryKeys.invitations.all,
    useCallback((cb: () => void) => invitations.watchInvitations(cb), [invitations]),
  );
};

export const useMyInvitationsQuery = () => {
  const { invitations } = useServices();
  useInvitationsLive();
  return useQuery({ queryKey: queryKeys.invitations.mine(), queryFn: () => invitations.getMyInvitations() });
};

export const useListInvitationsQuery = (listId: ListId, enabled: boolean) => {
  const { invitations } = useServices();
  useInvitationsLive();
  return useQuery({
    queryKey: queryKeys.invitations.byList(listId),
    queryFn: () => invitations.getListInvitations(listId),
    enabled,
  });
};

export const useCreateInvitation = (listId: ListId) => {
  const { invitations } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvitationInput) => invitations.createInvitation(listId, input),
    onSuccess: (invitation) =>
      queryClient.setQueryData<Invitation[]>(queryKeys.invitations.byList(listId), (current = []) => [
        invitation,
        ...current,
      ]),
  });
};

export const useRevokeInvitation = (listId: ListId) => {
  const { invitations } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: InvitationId) => invitations.revokeInvitation(invitationId),
    onSuccess: (_void, invitationId) =>
      queryClient.setQueryData<Invitation[]>(queryKeys.invitations.byList(listId), (current) =>
        current?.filter((invitation) => invitation.id !== invitationId),
      ),
    meta: { successMessage: 'Invitation revoked' },
  });
};

export const useAcceptInvitation = () => {
  const { invitations } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: InvitationId) => invitations.acceptInvitation(invitationId),
    onSuccess: (list) => {
      queryClient.setQueryData(queryKeys.lists.detail(list.id), list);
      void queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all });
    },
  });
};

export const useDeclineInvitation = () => {
  const { invitations } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: InvitationId) => invitations.declineInvitation(invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all }),
  });
};

/** The app uses hash history, so links work on any static host without rewrites. */
export const buildInviteUrl = (invitationId: InvitationId) => {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = `/invite/${invitationId}`;
  return url.toString();
};
