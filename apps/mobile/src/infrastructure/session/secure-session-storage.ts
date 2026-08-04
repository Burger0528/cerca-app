/**
 * El llavero. Keychain en iOS, Keystore en Android.
 *
 * Va aquí y no en AsyncStorage porque AsyncStorage es un archivo en claro dentro del
 * sandbox: en un teléfono con root, o en un backup sin cifrar, el refresh token se lee con
 * un editor de texto.
 */
import { actorSchema } from '@cerca/contract';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import type { SessionStoragePort } from '../../domain/session/ports';
import type { StoredSession } from '../../domain/session/session';

const SESSION_KEY = 'cerca.session.v1';

/**
 * Lo guardado también se valida al leerlo.
 *
 * Parece paranoia sobre datos propios, pero el llavero sobrevive a las actualizaciones de
 * la app: un registro escrito por la versión anterior sigue ahí después de instalar la
 * nueva. Si el formato cambió, esto lo detecta y lo tira, en vez de arrancar con un objeto
 * a medias. Por eso la clave lleva `.v1`.
 */
const storedSessionSchema = z.object({
  tokens: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresAt: z.number(),
  }),
  actor: actorSchema,
});

export function createSecureSessionStorage(): SessionStoragePort {
  return {
    async read(): Promise<StoredSession | null> {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      if (raw === null) return null;

      const parsed = safeParseJson(raw);
      if (parsed === null) {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        return null;
      }

      const session = storedSessionSchema.safeParse(parsed);
      if (!session.success) {
        // Formato viejo o corrupto: se tira y el usuario pasa por login una vez. Mejor eso
        // que arrastrar un registro inválido por toda la app.
        await SecureStore.deleteItemAsync(SESSION_KEY);
        return null;
      }

      return session.data;
    },

    async write(session: StoredSession): Promise<void> {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
        // Sin esto, el token acabaría en el backup de iCloud y en otro dispositivo.
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    },

    async clear(): Promise<void> {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    },
  };
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
