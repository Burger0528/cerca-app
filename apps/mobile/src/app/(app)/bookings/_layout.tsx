import { Stack } from 'expo-router';

/**
 * El detalle vive en su propio stack para que las pestañas lo vean como UNA ruta llamada
 * `bookings`, y no como `bookings/[id]`. Sin este layout, la barra pinta una pestaña de más
 * con el nombre del archivo, y entrar en ella sin reserva elegida deja la pantalla de error.
 */
export default function BookingsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
