import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Services } from '../../domain/services';

import { SearchOriginProvider } from './search-origin-provider';
import { ServicesProvider } from './services-provider';
import { SessionProvider } from './session-provider';

/**
 * El orden importa y no es alfabético:
 *
 *   Query   → lo necesita SessionProvider para vaciar la caché al salir.
 *   Services → lo necesitan Session y SearchOrigin para llegar a los puertos.
 *   Session → primero él, porque quién eres decide qué se puede pedir.
 *   Origin  → el último, porque solo afecta a la búsqueda.
 */
export function AppProviders({
  services,
  queryClient,
  children,
}: {
  services: Services;
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ServicesProvider services={services}>
            <SessionProvider>
              <SearchOriginProvider>{children}</SearchOriginProvider>
            </SessionProvider>
          </ServicesProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
