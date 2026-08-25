import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useCan, useHasCapacity } from '../../presentation/auth/use-can';
import { Icon } from '../../presentation/components/icon';
import type { IconName } from '../../presentation/components/icon';
import { useSession } from '../../presentation/providers/session-provider';

/**
 * El icono de una pestaña, atenuado cuando no está activa.
 *
 * Va como función suelta y no en línea: `tabBarIcon` recibe `{ focused }` y devolver un
 * componente nuevo en cada render dentro del JSX hace que React lo remonte en cada cambio
 * de pestaña.
 */
function tabIcon(name: IconName) {
  return function TabIcon({ focused }: { focused: boolean }) {
    return <Icon name={name} size={24} className={focused ? 'text-brand' : 'text-muted'} />;
  };
}

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
    <Tabs
      // El color activo lo pone el `ThemeProvider` del layout raíz; aquí solo se ajusta el
      // peso de la etiqueta para que no compita con el icono.
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('search.tabTitle'), tabBarIcon: tabIcon('search') }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: t('bookings.title'), tabBarIcon: tabIcon('bookings') }}
      />
      <Tabs.Screen
        name="(provider)"
        options={{
          title: t('provider.tabTitle'),
          href: isProvider ? undefined : null,
          tabBarIcon: tabIcon('listings'),
        }}
      />
      <Tabs.Screen
        name="(moderation)"
        options={{
          title: t('moderation.tabTitle'),
          href: isModerator ? undefined : null,
          tabBarIcon: tabIcon('moderation'),
        }}
      />
      {/* El detalle conserva la barra de pestañas pero no ES una pestaña. */}
      <Tabs.Screen name="listings" options={{ href: null }} />
      <Tabs.Screen
        name="account"
        options={{ title: t('account.tabTitle'), tabBarIcon: tabIcon('account') }}
      />
    </Tabs>
  );
}
