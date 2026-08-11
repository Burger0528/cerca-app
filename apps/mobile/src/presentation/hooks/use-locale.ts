/**
 * OWNER: Salvador.
 *
 * El locale COMPLETO para `Intl` (`es-MX`), no el idioma para i18next (`es`).
 *
 * Son dos cosas distintas y la diferencia se ve en pantalla: un teléfono en alemán con los
 * textos en inglés tiene que escribir el precio `1.299,90 MX$`. El idioma lo decide
 * i18next; el formato del número lo decide esto.
 */
import { useMemo } from 'react';

import { deviceLocale } from '../i18n';

export function useLocale(): string {
  // Sin dependencias: `deviceLocale()` lee el locale del SISTEMA, que no cambia mientras
  // la app está abierta. Cambiar el idioma dentro de la app cambia los textos, no el
  // formato de los números — que es justo la distinción que este hook existe para marcar.
  return useMemo(() => deviceLocale(), []);
}
