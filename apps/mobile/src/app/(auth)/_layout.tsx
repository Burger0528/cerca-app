import { Redirect, Stack } from 'expo-router';

import { useSession } from '../../presentation/providers/session-provider';

/**
 * Guarda del grupo público.
 *
 * La simétrica de la de `(app)`: quien ya tiene sesión no pinta nada en login. Sin esto,
 * volver atrás desde la app aterriza en la pantalla de entrar con la sesión abierta.
 */
export default function AuthLayout() {
  const { state } = useSession();

  if (state.status === 'signed-in') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
