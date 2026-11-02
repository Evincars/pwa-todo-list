import { createContext, use, type PropsWithChildren } from 'react';
import type { Services } from './types';

const ServicesContext = createContext<Services | null>(null);

export const ServicesProvider = ({ services, children }: PropsWithChildren<{ services: Services }>) => (
  <ServicesContext value={services}>{children}</ServicesContext>
);

export const useServices = (): Services => {
  const services = use(ServicesContext);
  if (!services) throw new Error('useServices must be used within <ServicesProvider>');
  return services;
};
