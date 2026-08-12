import { Stack } from 'expo-router';

/**
 * El detalle vive en su propio stack para que las pestañas lo vean como UNA ruta llamada
 * `listings`, y no como `listings/[id]`. Sin este layout, la barra pinta una pestaña de más
 * con el nombre del archivo, y declararla con `href: null` deja la pantalla en blanco.
 */
export default function ListingsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
