import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useCan, useHasCapacity } from '../../presentation/auth/use-can';
import { useSession } from '../../presentation/providers/session-provider';

/**
 * Guarda del grupo privado.
 *
 * Va en el `_layout` y no en cada pantalla a propósito: expo-router monta el layout ANTES
 * que la ruta hija, así que una URL escrita a mano —`cerca://listing/42`, un deep link, un
 * enlace de un correo— pasa por aquí antes de renderizar nada. Guardar pantalla a pantalla
 * significa que la próxima que se añada se olvide.
 *
 * `restoring` no se maneja aquí: el layout raíz no monta este grupo hasta que la sesión
 * está resuelta, así que aquí el estado ya es definitivo.
 */
export default function AppLayout() {
  const { state } = useSession();
  const { t } = useTranslation();
  const isProvider = useHasCapacity('provider');
  const isModerator = useCan('report:resolve');

  if (state.status !== 'signed-in') {
    return <Redirect href="/sign-in" />;
  }

  return (
    // Sin `tabBarIcon` la barra pinta un glifo de relleno que en Android sale como caja
    // vacía. La app no usa librería de iconos: las pestañas se distinguen por su texto.
    <Tabs screenOptions={{ headerShown: false, tabBarIcon: () => null }}>
      <Tabs.Screen name="index" options={{ title: t('search.tabTitle') }} />
      <Tabs.Screen
        name="(provider)"
        options={{ title: t('provider.tabTitle'), href: isProvider ? undefined : null }}
      />
      <Tabs.Screen
        name="(moderation)"
        options={{ title: t('moderation.tabTitle'), href: isModerator ? undefined : null }}
      />
      <Tabs.Screen name="account" options={{ title: t('account.tabTitle') }} />
    </Tabs>
  );
}
