export type AppErrorCode =
  | 'unauthenticated'
  | 'permission-denied'
  | 'not-found'
  | 'invalid-argument'
  | 'failed-precondition'
  | 'cancelled';

/** Error codes intentionally mirror Firebase error codes to ease the migration. */
export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

export const isCancelled = (error: unknown): boolean => isAppError(error) && error.code === 'cancelled';

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Something went wrong';
