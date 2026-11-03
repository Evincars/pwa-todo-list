import { Button, type ButtonProps } from '@mantine/core';
import type { AuthProviderId } from '@/domain/types';
import { useTranslation } from '@/i18n';
import { ProviderLogo } from './ProviderLogos';

export const PROVIDER_LABEL: Record<AuthProviderId, string> = { google: 'Google', facebook: 'Facebook', apple: 'Apple' };

/** Brand colors per the providers' button guidelines (Google: neutral, Facebook: #1877F2, Apple: black). */
const BRAND_STYLES: Partial<Record<AuthProviderId, { backgroundColor: string; color: string }>> = {
  facebook: { backgroundColor: '#1877F2', color: '#fff' },
  apple: { backgroundColor: '#000', color: '#fff' },
};

export interface ProviderButtonProps extends Omit<ButtonProps, 'children'> {
  provider: AuthProviderId;
  onClick: () => void;
}

/** Brand-compliant "Continue with …" buttons. */
export const ProviderButton = ({ provider, ...props }: ProviderButtonProps) => {
  const { t } = useTranslation();
  const brand = BRAND_STYLES[provider];
  return (
    <Button
      size="lg"
      radius="xl"
      fullWidth
      variant={brand ? 'filled' : 'default'}
      leftSection={<ProviderLogo provider={provider} />}
      styles={brand ? { root: brand } : undefined}
      {...props}
    >
      {t('auth.continueWith', { provider: PROVIDER_LABEL[provider] })}
    </Button>
  );
};
