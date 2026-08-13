/**
 * Los idiomas que la app sabe hablar.
 *
 * Vive en `domain` y no en `presentation/i18n` porque el puerto de preferencias necesita
 * nombrar el tipo, y `domain` no puede mirar hacia fuera. i18next lo consume desde aquí.
 */
export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: SupportedLanguage = 'es';

export function isSupportedLanguage(code: string): code is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some((language) => language === code);
}
