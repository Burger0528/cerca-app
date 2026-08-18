/**
 * Aquí se enchufan los cables.
 *
 * Es el único archivo donde se decide que el almacén seguro es expo-secure-store y que la
 * ubicación es expo-location. Cambiar cualquiera de las dos cosas se hace aquí y en ningún
 * sitio más: ni `application` ni `presentation` nombran nunca a Expo.
 */
import { randomUUID } from 'expo-crypto';

import type { Services } from '../domain/services';

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

export interface CreateServicesOptions {
  /** Se dispara cuando el refresh token muere: la app tiene que mandar a login. */
  readonly onSessionLost?: () => void;
}

export function createServices(options: CreateServicesOptions = {}): Services {
  const now = Date.now;

  const sessionManager = createSessionManager({
    storage: createSecureSessionStorage(),
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
