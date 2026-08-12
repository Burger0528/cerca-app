/**
 * Puertos de sesión. El dominio dice QUÉ hace falta; infrastructure decide CON QUÉ.
 *
 * Gracias a esto los casos de uso se prueban con un Map en memoria en vez de con el
 * llavero de iOS, y cambiar expo-secure-store por otra cosa no toca ni una línea de
 * application.
 */
import type { Actor, SignInRequest, SignUpRequest } from '@cerca/contract';

import type { StoredSession } from './session';

/** El almacén seguro. En el teléfono es Keychain / Keystore; en un test, un Map. */
export interface SessionStoragePort {
  read(): Promise<StoredSession | null>;
  write(session: StoredSession): Promise<void>;
  clear(): Promise<void>;
}

export interface AuthGatewayPort {
  signIn(credentials: SignInRequest): Promise<StoredSession>;
  signUp(request: SignUpRequest): Promise<StoredSession>;
  /** GET /me con el token que lleve puesto el cliente HTTP. */
  me(signal?: AbortSignal): Promise<Actor>;
  becomeProvider(): Promise<Actor>;
  signOut(refreshToken: string): Promise<void>;
}

/**
 * El único dueño de los tokens vivos: los guarda en memoria, los persiste y los renueva.
 *
 * El cliente HTTP depende de esto y no al revés. El refresh se hace con `fetch` pelado
 * porque no lleva `Authorization`, y así no hay ciclo entre cliente y sesión.
 */
export interface SessionManagerPort {
  /** Token en memoria, sin tocar disco. Se llama en CADA petición. */
  getAccessToken(): string | null;
  /** Lee el llavero. Solo al arrancar. */
  restore(): Promise<StoredSession | null>;
  /**
   * Renueva el access token. Con single-flight: si cinco peticiones reciben 401 a la vez,
   * sale UN refresh y las cinco esperan al mismo, no cinco refreshes en paralelo que se
   * invalidan entre ellos.
   *
   * Devuelve `null` cuando el refresh token ya no vale y hay que echar al usuario.
   */
  refresh(): Promise<string | null>;
  adopt(session: StoredSession): Promise<void>;
  clear(): Promise<void>;
  /**
   * Avisa cuando el refresh token muere y la sesión ya no se puede salvar. Devuelve la
   * función para dejar de escuchar.
   *
   * Es una suscripción y no un callback de construcción porque quien necesita enterarse
   * —el estado de sesión de la UI— se monta después de que los servicios existan.
   */
  onSessionLost(listener: () => void): () => void;
}
