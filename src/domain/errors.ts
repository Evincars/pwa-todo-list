export type AppErrorCode =
  | 'unauthenticated'
  | 'permission-denied'
  | 'not-found'
  | 'invalid-argument'
  | 'failed-precondition'
  | 'cancelled';

/**
 * Machine-readable reason of a failure. The UI translates it (`errors.<reason>`), so the data layer
 * never produces user-facing text – the same way a backend would only send codes.
 */
export type AppErrorReason =
  | 'signInRequired'
  | 'accountPickerUnavailable'
  | 'signInCancelled'
  | 'taskTitleRequired'
  | 'taskNotFound'
  | 'listNotFound'
  | 'listNameRequired'
  | 'memberNotFound'
  | 'ownerCannotLeave'
  | 'invalidReminderTime'
  | 'invalidEmail'
  | 'alreadyOwner'
  | 'alreadyMember'
  | 'alreadyInvited'
  | 'invitationNotForYou'
  | 'invitationStatus'
  | 'invitationExpired'
  | 'invitationForOther'
  | 'invitationNotFound'
  | 'documentNotFound'
  | 'noAccess'
  | 'readOnly'
  | 'ownerOnly'
  | 'unauthorizedDomain'
  | 'providerDisabled'
  | 'popupBlocked'
  | 'accountExistsWithOtherProvider'
  | 'offline';

/** Error codes intentionally mirror Firebase error codes to ease the migration. */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly reason: AppErrorReason;
  /** Interpolation values for the translated message. */
  readonly params: Readonly<Record<string, string>>;

  constructor(code: AppErrorCode, reason: AppErrorReason, params: Record<string, string> = {}) {
    super(`${code}: ${reason}`);
    this.name = 'AppError';
    this.code = code;
    this.reason = reason;
    this.params = params;
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

export const isCancelled = (error: unknown): boolean => isAppError(error) && error.code === 'cancelled';
