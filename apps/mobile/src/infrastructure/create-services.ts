/**
 * Aquí se enchufan los cables.
 *
 * Es el único archivo donde se decide que el almacén seguro es expo-secure-store y que la
 * ubicación es expo-location. Cambiar cualquiera de las dos cosas se hace aquí y en ningún
 * sitio más: ni `application` ni `presentation` nombran nunca a Expo.
 */
import { randomUUID } from 'expo-crypto';
import { Platform } from 'react-native';

import type { Services } from '../domain/services';
import type { SessionStoragePort } from '../domain/session/ports';

import { createHttpBookingGateway } from './booking/http-booking-gateway';
import { createHttpClient } from './http/http-client';
import {
  createHttpCategoryGateway,
  createHttpListingGateway,
} from './listings/http-listing-gateway';
import { createExpoLocationAdapter } from './location/expo-location-adapter';
import { createHttpModerationGateway } from './moderation/http-moderation-gateway';
import { createSecureLanguagePreference } from './preferences/secure-language-preference';
import { createHttpReviewGateway } from './review/http-review-gateway';
import { createHttpAuthGateway } from './session/http-auth-gateway';
import { createSecureSessionStorage } from './session/secure-session-storage';
import { createSessionManager } from './session/session-manager';
import { createWebSessionStorage } from './session/web-session-storage';

export interface CreateServicesOptions {
  /** Se dispara cuando el refresh token muere: la app tiene que mandar a login. */
  readonly onSessionLost?: () => void;
}

/**
 * El llavero solo existe en el teléfono.
 *
 * `expo-secure-store` no tiene implementación web —su build de navegador es un objeto
 * vacío— así que en web la primera lectura de la sesión reventaría antes de pintar nada.
 * La decisión vive aquí porque este es el único archivo que elige implementaciones; ni
 * `application` ni `presentation` saben que web existe.
 *
 * OJO: el almacén de web NO es seguro. Está para desarrollo y demos en navegador. Lo
 * explica `web-session-storage.ts`.
 */
function createPlatformSessionStorage(): SessionStoragePort {
  return Platform.OS === 'web' ? createWebSessionStorage() : createSecureSessionStorage();
}

export function createServices(options: CreateServicesOptions = {}): Services {
  const now = Date.now;

  const sessionManager = createSessionManager({
    storage: createPlatformSessionStorage(),
    now,
    ...(options.onSessionLost === undefined ? {} : { onSessionLost: options.onSessionLost }),
  });

  // El cliente pregunta el token al manager en cada petición en vez de recibir una copia.
  // Con una copia, el token renovado hace cinco minutos no llegaría nunca a esta función.
  const http = createHttpClient({
    getAccessToken: () => sessionManager.getAccessToken(),
    refreshAccessToken: () => sessionManager.refresh(),
  });

  return {
    sessionManager,
    authGateway: createHttpAuthGateway({ http, now }),
    listingGateway: createHttpListingGateway(http),
    bookingGateway: createHttpBookingGateway(http),
    reviewGateway: createHttpReviewGateway(http),
    categoryGateway: createHttpCategoryGateway(http),
    moderationGateway: createHttpModerationGateway(http),
    location: createExpoLocationAdapter(),
    languagePreference: createSecureLanguagePreference(),
    now,
    newIdempotencyKey: randomUUID,
  };
}
