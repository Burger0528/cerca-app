/**
 * El puente entre las pantallas y los puertos.
 *
 * `presentation` NO puede importar `infrastructure` (lo impide el linter). Recibe los
 * servicios ya construidos por props, desde `src/app/_layout.tsx`, que es el composition
 * root. Por eso un test puede montar una pantalla con gateways falsos sin tocar nada más.
 */
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { Services } from '../../domain/services';

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({
  services,
  children,
}: {
  services: Services;
  children: ReactNode;
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);

  // Falla ruidosamente y en el sitio. Devolver un objeto vacío convertiría un provider
  // olvidado en un "cannot read property search of undefined" a tres pantallas de aquí.
  if (services === null) {
    throw new Error('useServices() fuera de <ServicesProvider>. Falta montar el provider.');
  }

  return services;
}
