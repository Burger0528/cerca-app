/**
 * OWNER: Salvador.
 *
 * Jorge deja el arranque y la detección de idioma; Salvador se lleva las claves, los
 * plurales `_one` / `_other`, la interpolación y el tipado de claves.
 *
 * Regla del sprint: NINGÚN texto de usuario fuera de `en.json` y `es.json`.
 */
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: SupportedLanguage = 'es';

/**
 * El idioma del teléfono, no una preferencia guardada.
 *
 * `getLocales()[0]` es el primer idioma de la lista del sistema. El locale COMPLETO
 * (`es-MX`, `de-DE`) hace falta aparte para `Intl`: el precio en alemán se escribe
 * `1.299,90 MX$` aunque los textos estén en inglés.
 */
export function deviceLanguage(): SupportedLanguage {
  const code = getLocales()[0]?.languageCode ?? FALLBACK_LANGUAGE;
  return isSupported(code) ? code : FALLBACK_LANGUAGE;
}

export function deviceLocale(): string {
  return getLocales()[0]?.languageTag ?? 'es-MX';
}

function isSupported(code: string): code is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some((language) => language === code);
}

export function initI18n(): typeof i18n {
  if (i18n.isInitialized) return i18n;

  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: deviceLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    // React ya escapa lo que pinta; volver a escapar aquí produce &amp;amp; en pantalla.
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  return i18n;
}

export default i18n;
