import { isAppError } from '@/domain/errors';
import type { InvitationStatus } from '@/domain/types';
import { t } from './i18n';

const INVITATION_STATUSES: readonly string[] = ['pending', 'accepted', 'declined', 'revoked'] satisfies InvitationStatus[];
const isInvitationStatus = (value: string | undefined): value is InvitationStatus => !!value && INVITATION_STATUSES.includes(value);

/** Localized, user-facing message for any thrown value. */
export const getErrorMessage = (error: unknown): string => {
  if (isAppError(error)) {
    const params: Record<string, string> = { ...error.params };
    // Statuses are data values; translate them before interpolating.
    if (error.reason === 'invitationStatus' && isInvitationStatus(params.status)) params.status = t(`invitations.status.${params.status}`);
    return t(`errors.${error.reason}`, { replace: params });
  }
  return error instanceof Error && error.message ? error.message : t('errors.generic');
};
