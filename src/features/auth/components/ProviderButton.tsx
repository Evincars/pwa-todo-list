import { Button, type ButtonProps } from '@mantine/core';
import type { AuthProviderId } from '@/domain/types';
import { AppleLogo, GoogleLogo } from './ProviderLogos';

export const PROVIDER_LABEL: Record<AuthProviderId, string> = { google: 'Google', apple: 'Apple' };

export interface ProviderButtonProps extends Omit<ButtonProps, 'children'> {
  provider: AuthProviderId;
  onClick: () => void;
}

/** Brand-compliant "Continue with …" buttons. */
export const ProviderButton = ({ provider, ...props }: ProviderButtonProps) => {
  const isApple = provider === 'apple';
  return (
    <Button
      size="lg"
      radius="xl"
      fullWidth
      variant={isApple ? 'filled' : 'default'}
      color={isApple ? 'dark' : undefined}
      leftSection={isApple ? <AppleLogo /> : <GoogleLogo />}
      styles={isApple ? { root: { backgroundColor: '#000', color: '#fff' } } : undefined}
      {...props}
    >
      Continue with {PROVIDER_LABEL[provider]}
    </Button>
  );
};
