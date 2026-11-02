import { useMutation } from '@tanstack/react-query';
import type { AuthProviderId } from '@/domain/types';
import { seedWelcomeList } from '@/features/onboarding/seedWelcomeList';
import { useServices } from '@/services/ServicesContext';

export const useSignIn = () => {
  const services = useServices();
  return useMutation({
    mutationFn: async (provider: AuthProviderId) => {
      const result = await services.auth.signIn(provider);
      if (result.isNewUser) await seedWelcomeList(services);
      return result;
    },
  });
};

export const useSignOut = () => {
  const { auth } = useServices();
  return useMutation({ mutationFn: () => auth.signOut() });
};
