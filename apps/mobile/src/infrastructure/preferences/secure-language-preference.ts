/**
 * El idioma elegido, guardado en el llavero.
 *
 * No es un secreto, y el llavero no es su sitio natural: lo es porque `expo-secure-store`
 * es el único almacén persistente que el proyecto ya enlaza. Meter AsyncStorage solo para
 * esto obligaría a recompilar el dev client entero.
 *
 * Una lectura que falla NO rompe el arranque: se devuelve `null` y manda el idioma del
 * sistema, que es exactamente el comportamiento de quien nunca ha elegido.
 */
import * as SecureStore from 'expo-secure-store';

import { isSupportedLanguage } from '../../domain/preferences/language';
import type { SupportedLanguage } from '../../domain/preferences/language';
import type { LanguagePreferencePort } from '../../domain/preferences/ports';

const LANGUAGE_KEY = 'cerca.language';

export function createSecureLanguagePreference(): LanguagePreferencePort {
  return {
    async read(): Promise<SupportedLanguage | null> {
      try {
        const stored = await SecureStore.getItemAsync(LANGUAGE_KEY);
        return stored !== null && isSupportedLanguage(stored) ? stored : null;
      } catch {
        return null;
      }
    },

    async write(language: SupportedLanguage): Promise<void> {
      await SecureStore.setItemAsync(LANGUAGE_KEY, language);
    },
  };
}
