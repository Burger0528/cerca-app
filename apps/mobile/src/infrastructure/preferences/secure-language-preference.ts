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
import { Platform } from 'react-native';

import { isSupportedLanguage } from '../../domain/preferences/language';
import type { SupportedLanguage } from '../../domain/preferences/language';
import type { LanguagePreferencePort } from '../../domain/preferences/ports';

const LANGUAGE_KEY = 'cerca.language';

/** `expo-secure-store` no tiene implementación web: su build de navegador es un objeto vacío. */
const isWeb = Platform.OS === 'web';

async function readRaw(): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(LANGUAGE_KEY) ?? null;

  return SecureStore.getItemAsync(LANGUAGE_KEY);
}

async function writeRaw(value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(LANGUAGE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(LANGUAGE_KEY, value);
}

export function createSecureLanguagePreference(): LanguagePreferencePort {
  return {
    async read(): Promise<SupportedLanguage | null> {
      try {
        const stored = await readRaw();
        return stored !== null && isSupportedLanguage(stored) ? stored : null;
      } catch {
        return null;
      }
    },

    async write(language: SupportedLanguage): Promise<void> {
      await writeRaw(language);
    },
  };
}
