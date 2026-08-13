/**
 * El juego completo de puertos que necesita la app.
 *
 * Vive en `domain` a propósito: `infrastructure` lo IMPLEMENTA y `presentation` lo CONSUME,
 * y ninguno de los dos tiene que conocer al otro. Ese es el truco entero de la regla de
 * dependencia: los dos miran hacia dentro, a este archivo.
 *
 * En un test, esto se rellena con dobles y la pantalla no se entera.
 */
import type { BookingGatewayPort } from './booking/ports';
import type { CategoryGatewayPort, ListingGatewayPort } from './listings/ports';
import type { LocationPort } from './location/location';
import type { ModerationGatewayPort } from './moderation/ports';
import type { LanguagePreferencePort } from './preferences/ports';
import type { ReviewGatewayPort } from './review/ports';
import type { AuthGatewayPort, SessionManagerPort } from './session/ports';

export interface Services {
  readonly authGateway: AuthGatewayPort;
  readonly sessionManager: SessionManagerPort;
  readonly listingGateway: ListingGatewayPort;
  readonly bookingGateway: BookingGatewayPort;
  readonly reviewGateway: ReviewGatewayPort;
  readonly categoryGateway: CategoryGatewayPort;
  readonly moderationGateway: ModerationGatewayPort;
  readonly location: LocationPort;
  readonly languagePreference: LanguagePreferencePort;

  /** El reloj, también inyectado: un test que dependa de `Date.now()` real es un test lento. */
  readonly now: () => number;
  readonly newIdempotencyKey: () => string;
}
