/**
 * Composition root.
 *
 * ESTE es el único archivo de la app que puede tocar `infrastructure` y `presentation` a
 * la vez: aquí se construyen las implementaciones reales y se inyectan hacia abajo. De
 * `_layout` para dentro, nadie vuelve a nombrar a Expo.
 */
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import '../global.css';

import { createServices } from '../infrastructure/create-services';
import {
  bindAppStateToFocusManager,
  createQueryClient,
} from '../infrastructure/query/query-client';
import { initI18n } from '../presentation/i18n/index';
import { AppProviders } from '../presentation/providers/app-providers';
import { useSession } from '../presentation/providers/session-provider';

// El splash se queda hasta que se sepa si hay sesión. Ese es el mecanismo que evita el
// fotograma de login (o de tabs) mientras se lee el llavero.
void SplashScreen.preventAutoHideAsync();

initI18n();

export default function RootLayout() {
  // `useState` con inicializador y no `useMemo`: aquí hace falta la garantía de que se
  // construye UNA vez. `useMemo` puede recalcular cuando le apetezca a React, y eso serían
  // dos QueryClient y dos gestores de sesión compitiendo por el mismo llavero.
  const [queryClient] = useState(createQueryClient);
  const [services] = useState(() => createServices());

  useEffect(() => bindAppStateToFocusManager(), []);

  return (
    <AppProviders services={services} queryClient={queryClient}>
      {/* Sin esto, los iconos del sistema se quedan en blanco sobre el fondo claro de la
          app y desaparecen. `auto` los pinta según el esquema de color, que es la misma
          señal que decide el color de las superficies en `global.css`. */}
      <StatusBar style="auto" />
      <RootNavigator />
    </AppProviders>
  );
}

/**
 * Va aparte de `RootLayout` porque necesita estar DENTRO de los providers para poder leer
 * la sesión. Un componente no puede consumir un contexto que él mismo monta.
 */
function RootNavigator() {
  const { state } = useSession();
  const isRestoring = state.status === 'restoring';

  // Todos los hooks ANTES de cualquier return: React los identifica por orden de llamada,
  // y un `useMemo` detrás de un early return cambia de posición entre renders.
  const screenOptions = useMemo(() => ({ headerShown: false }), []);

  // La barra de pestañas y las cabeceras las pinta React Navigation con SU tema, que no
  // conoce las variables de `global.css`. Sin esto, en modo oscuro la app va oscura y la
  // barra de abajo se queda blanca.
  const scheme = useColorScheme();

  useEffect(() => {
    if (!isRestoring) void SplashScreen.hideAsync();
  }, [isRestoring]);

  // Mientras se restaura NO se monta ningún grupo de rutas. Devolver `null` aquí es lo que
  // hace imposible ver un fotograma de tabs antes de saber que hay sesión: no es que se
  // pinte y se tape, es que no se pinta.
  if (isRestoring) return null;

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen
          name="city"
          options={{ presentation: 'modal', headerShown: true, title: '' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
