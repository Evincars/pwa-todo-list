import { AppError } from '@/domain/errors';
import type { UserProfile } from '@/domain/types';
import type { AuthService } from '../types';

export const requireUser = (auth: AuthService): UserProfile => {
  const user = auth.getCurrentUser();
  if (!user) throw new AppError('unauthenticated', 'You need to sign in first');
  return user;
};

export const nowISO = () => new Date().toISOString();
