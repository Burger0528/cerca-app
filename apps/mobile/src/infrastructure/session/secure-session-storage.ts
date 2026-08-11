/**
 * El llavero. Keychain en iOS, Keystore en Android.
 *
 * Va aquí y no en AsyncStorage porque AsyncStorage es un archivo en claro dentro del
 * sandbox: en un teléfono con root, o en un backup sin cifrar, el refresh token se lee con
 * un editor de texto.
 */
import * as SecureStore from 'expo-secure-store';

import type { SessionKeyValueStore } from './session-storage';
import { createSessionStorage } from './session-storage';

function createSecureStore(): SessionKeyValueStore {
  return {
    read: (key) => SecureStore.getItemAsync(key),

    write: (key, value) =>
      SecureStore.setItemAsync(key, value, {
        // Sin esto, el token acabaría en el backup de iCloud y en otro dispositivo.
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),

    remove: (key) => SecureStore.deleteItemAsync(key),
  };
}

export function createSecureSessionStorage() {
  return createSessionStorage(createSecureStore());
}
