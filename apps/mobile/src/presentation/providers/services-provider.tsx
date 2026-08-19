/**
 * El puente entre las pantallas y los puertos.
 *
 * `presentation` NO puede importar `infrastructure` (lo impide el linter). Recibe los
 * servicios ya construidos por props, desde `src/app/_layout.tsx`, que es el composition
 * root. Por eso un test puede montar una pantalla con gateways falsos sin tocar nada más.
 */
import type { ReactNode } from 'react';

import type { Services } from '../../domain/services';

import { createRequiredContext } from './create-required-context';

const [ServicesContext, useServices] = createRequiredContext<Services>('useServices()');

export { useServices };

export function ServicesProvider({
  services,
  children,
}: {
  services: Services;
  children: ReactNode;
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}
