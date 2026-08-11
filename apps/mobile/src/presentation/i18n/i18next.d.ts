/**
 * OWNER: Salvador.
 *
 * Claves tipadas. `en.json` ES el tipo: `t('search.titel')` deja de compilar, y renombrar
 * una clave hace que `tsc` te enseñe todos los sitios que hay que tocar.
 *
 * `en` y no `es` a propósito: el inglés es el idioma de respaldo, así que es el único que
 * tiene garantizadas TODAS las claves. Si se tipara con `es`, una clave que solo existe en
 * español compilaría y luego saldría en pantalla como `search.loQueSea` en un teléfono en
 * inglés.
 */
import 'i18next';

import type en from './locales/en.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
    /** Coincide con el `returnNull: false` de `initI18n()`: `t()` devuelve `string`. */
    returnNull: false;
  }
}
