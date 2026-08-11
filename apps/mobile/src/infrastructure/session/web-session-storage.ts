/**
 * El almacén de sesión en el NAVEGADOR.
 *
 * ⚠️ NO ES SEGURO, Y NO PRETENDE SERLO. `localStorage` es texto plano legible por cualquier
 * script de la página: un XSS se lleva el refresh token entero. En el teléfono eso no pasa
 * porque el llavero lo cifra el sistema operativo, y el navegador no tiene equivalente.
 *
 * Existe para poder abrir la app en un navegador durante el desarrollo y las demos, que es
 * el único sitio donde corre esta implementación. Antes de que web sea un destino de verdad
 * hay que cambiar el modelo: refresh token en cookie `httpOnly` puesta por el servidor, y
 * el access token solo en memoria. Eso es una decisión de backend, no un parche de aquí.
 */
import type { SessionKeyValueStore } from './session-storage';
import { createSessionStorage } from './session-storage';

/**
 * `localStorage` puede no existir o lanzar aunque el objeto esté: en modo privado de Safari
 * o con las cookies de terceros bloqueadas, `setItem` tira una excepción de cuota. Se
 * comprueba una vez y, si no hay, se cae a un Map en memoria: la sesión no sobrevive a un
 * F5, pero la app arranca en vez de morir en la primera pantalla.
 */
function browserStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;

    const probe = '__cerca_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);

    return localStorage;
  } catch {
    return null;
  }
}

function createBrowserStore(): SessionKeyValueStore {
  const storage = browserStorage();
  const fallback = new Map<string, string>();

  return {
    read: (key) => Promise.resolve(storage?.getItem(key) ?? fallback.get(key) ?? null),

    write: (key, value) => {
      if (storage === null) fallback.set(key, value);
      else storage.setItem(key, value);

      return Promise.resolve();
    },

    remove: (key) => {
      if (storage === null) fallback.delete(key);
      else storage.removeItem(key);

      return Promise.resolve();
    },
  };
}

export function createWebSessionStorage() {
  return createSessionStorage(createBrowserStore());
}
