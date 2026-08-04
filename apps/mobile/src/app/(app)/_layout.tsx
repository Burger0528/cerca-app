import { Redirect, Stack } from 'expo-router';

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

  if (state.status !== 'signed-in') {
    return <Redirect href="/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
