import type { SupportedLanguage } from './language';

/**
 * El idioma ELEGIDO, que no es el del teléfono.
 *
 * `null` significa "nunca eligió": ahí manda el idioma del sistema. Distinguirlo de un
 * valor guardado es lo que permite que un teléfono en inglés siga en inglés hasta que
 * alguien decida otra cosa.
 */
export interface LanguagePreferencePort {
  read(): Promise<SupportedLanguage | null>;
  write(language: SupportedLanguage): Promise<void>;
}
