/**
 * La validación de la sesión guardada, separada de DÓNDE se guarda.
 *
 * El llavero del teléfono y el `localStorage` del navegador tienen la misma forma —leer,
 * escribir, borrar una cadena por clave— y las mismas trampas: lo que sacas de ahí lo
 * escribió una versión anterior de la app, no tú. Todo eso vive aquí una sola vez, y cada
 * plataforma solo aporta las tres funciones que de verdad cambian.
 */
import { actorSchema } from '@cerca/contract';
import { z } from 'zod';

import type { SessionStoragePort } from '../../domain/session/ports';
import type { StoredSession } from '../../domain/session/session';

export const SESSION_KEY = 'cerca.session.v1';

/** Lo mínimo que hace falta de un almacén. Ni transacciones ni listados: tres operaciones. */
export interface SessionKeyValueStore {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/**
 * Lo guardado también se valida al leerlo.
 *
 * Parece paranoia sobre datos propios, pero el almacén sobrevive a las actualizaciones de
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

export function createSessionStorage(store: SessionKeyValueStore): SessionStoragePort {
  return {
    async read(): Promise<StoredSession | null> {
      const raw = await store.read(SESSION_KEY);
      if (raw === null) return null;

      const parsed = safeParseJson(raw);
      if (parsed === null) {
        await store.remove(SESSION_KEY);
        return null;
      }

      const session = storedSessionSchema.safeParse(parsed);
      if (!session.success) {
        // Formato viejo o corrupto: se tira y el usuario pasa por login una vez. Mejor eso
        // que arrastrar un registro inválido por toda la app.
        await store.remove(SESSION_KEY);
        return null;
      }

      return session.data;
    },

    async write(session: StoredSession): Promise<void> {
      await store.write(SESSION_KEY, JSON.stringify(session));
    },

    async clear(): Promise<void> {
      await store.remove(SESSION_KEY);
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
