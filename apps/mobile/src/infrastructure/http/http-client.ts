/**
 * El único sitio de la app que habla con `fetch`.
 *
 * Hace cuatro cosas y ninguna más: pone el `Authorization`, corta por timeout, traduce el
 * fallo a uno de los errores del dominio, y VALIDA la respuesta contra un schema antes de
 * devolverla. Ese último punto es el que hace que no haga falta ni un `as` en toda la app:
 * el tipo no se afirma, se demuestra.
 */
import { PROBLEM_CONTENT_TYPE, problemDetailsSchema } from '@cerca/contract';
import type { ProblemDetails } from '@cerca/contract';
import type { ZodType } from 'zod';

import {
  ContractViolationError,
  HttpError,
  NetworkError,
  TimeoutError,
} from '../../domain/errors/app-error';

import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './api-config';

export type QueryValue = string | number | boolean | null | undefined;

export interface HttpRequest {
  readonly path: string;
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  /** `false` para los endpoints que no llevan token: sign-in, sign-up, refresh. */
  readonly authenticated?: boolean;
}

export interface HttpClient {
  /** Pide, valida contra el schema y devuelve el tipo ya demostrado. */
  request<T>(request: HttpRequest, schema: ZodType<T>): Promise<T>;
  /** Para los 204 y demás respuestas sin cuerpo. */
  requestVoid(request: HttpRequest): Promise<void>;
}

export interface HttpClientDependencies {
  readonly baseUrl?: string;
  readonly getAccessToken: () => string | null;
  /**
   * Qué hacer ante un 401: renovar y devolver el token nuevo, o `null` si ya no hay nada
   * que renovar. El cliente reintenta UNA vez y solo una.
   */
  readonly refreshAccessToken: () => Promise<string | null>;
  readonly timeoutMs?: number;
  /** Inyectable para poder probar sin red. */
  readonly fetchImpl?: typeof fetch;
}

export function createHttpClient(deps: HttpClientDependencies): HttpClient {
  const baseUrl = deps.baseUrl ?? API_BASE_URL;
  const timeoutMs = deps.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const doFetch = deps.fetchImpl ?? fetch;

  async function send(request: HttpRequest, accessToken: string | null): Promise<Response> {
    const url = buildUrl(baseUrl, request.path, request.query);
    const timeout = withTimeout(timeoutMs, request.signal);

    const headers: Record<string, string> = {
      Accept: `application/json, ${PROBLEM_CONTENT_TYPE}`,
    };
    if (request.body !== undefined) headers['Content-Type'] = 'application/json';
    if (accessToken !== null) headers.Authorization = `Bearer ${accessToken}`;

    try {
      return await doFetch(url, {
        method: request.method ?? 'GET',
        headers,
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        signal: timeout.signal,
      });
    } catch (error) {
      // `fetch` solo rechaza por red o por abort. Un 500 NO rechaza: resuelve con ok=false.
      if (timeout.timedOut) throw new TimeoutError(timeoutMs);
      if (request.signal?.aborted) throw error;
      throw new NetworkError(error);
    } finally {
      timeout.dispose();
    }
  }

  /**
   * Manda, y si vuelve 401 renueva y manda otra vez. Una sola vez.
   *
   * El límite es el punto: sin él, un token que el servidor rechaza siempre produce un
   * bucle infinito de refresh + reintento que se come la batería en silencio.
   */
  async function sendWithRefresh(request: HttpRequest): Promise<Response> {
    const authenticated = request.authenticated ?? true;
    const response = await send(request, authenticated ? deps.getAccessToken() : null);

    if (response.status !== 401 || !authenticated) return response;

    const renewed = await deps.refreshAccessToken();
    if (renewed === null) return response;

    return send(request, renewed);
  }

  async function requestRaw(request: HttpRequest): Promise<Response> {
    const response = await sendWithRefresh(request);
    if (!response.ok) {
      throw new HttpError(
        response.status,
        await readProblem(response),
        buildUrl(baseUrl, request.path),
      );
    }
    return response;
  }

  return {
    async request<T>(request: HttpRequest, schema: ZodType<T>): Promise<T> {
      const response = await requestRaw(request);

      let raw: unknown;
      try {
        raw = await response.json();
      } catch (error) {
        throw new ContractViolationError(request.path, [
          `la respuesta no es JSON válido (${String(error)})`,
        ]);
      }

      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        // Aquí revienta, en el límite, y diciendo QUÉ campo. No tres pantallas después
        // con un "undefined is not an object" en un componente que no tiene la culpa.
        throw new ContractViolationError(
          request.path,
          parsed.error.issues.map(
            (issue) => `${issue.path.join('.') || '(raíz)'}: ${issue.message}`,
          ),
        );
      }

      return parsed.data;
    },

    async requestVoid(request: HttpRequest): Promise<void> {
      await requestRaw(request);
    },
  };
}

/**
 * Lee el cuerpo de error como `application/problem+json`.
 *
 * Devuelve `null` en vez de reventar si el servidor manda HTML o un texto suelto: ya
 * estamos gestionando un error, y fallar aquí taparía el error de verdad con uno de parseo.
 */
async function readProblem(response: Response): Promise<ProblemDetails | null> {
  try {
    const text = await response.text();
    if (text.length === 0) return null;

    const parsed = problemDetailsSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Readonly<Record<string, QueryValue>>,
): string {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (query === undefined) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    // `null` y `undefined` NO viajan: un filtro sin poner no es `?minRating=null`, es
    // un filtro que no aparece en la URL.
    if (value === null || value === undefined) continue;
    params.append(key, String(value));
  }

  const serialized = params.toString();
  return serialized.length === 0 ? url : `${url}?${serialized}`;
}

interface Timeout {
  readonly signal: AbortSignal;
  readonly timedOut: boolean;
  dispose(): void;
}

/**
 * Une el timeout con el `signal` de quien llama.
 *
 * A mano y no con `AbortSignal.any` porque Hermes no lo trae en todas las versiones, y
 * quedarse sin cancelación en release es peor que doce líneas de más aquí.
 */
function withTimeout(milliseconds: number, external?: AbortSignal): Timeout {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, milliseconds);

  const forward = () => controller.abort();
  if (external !== undefined) {
    if (external.aborted) forward();
    else external.addEventListener('abort', forward, { once: true });
  }

  return {
    signal: controller.signal,
    get timedOut() {
      return timedOut;
    },
    dispose() {
      clearTimeout(timer);
      external?.removeEventListener('abort', forward);
    },
  };
}
