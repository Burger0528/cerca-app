/**
 * OWNER: Salvador.
 *
 * Espejo de `auth.schemas.ts` del backend.
 *
 * Los mensajes de error son CLAVES de i18n, nunca texto. `validation.email.invalid` se
 * traduce en la pantalla; si aquí hubiera "Correo inválido" la app solo hablaría español.
 * El backend no los necesita —tiene los suyos— pero sí necesita las MISMAS reglas, que es
 * lo que evita un 400 por algo que el formulario podía haber avisado.
 */
import { z } from 'zod';

import { actorSchema, capacitySchema } from '../actor/actor.ts';

/** El backend acepta de 8 a 200. Por debajo lo rechaza él; por encima, también. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200;
export const DISPLAY_NAME_MAX_LENGTH = 120;

export const signInRequestSchema = z.object({
  email: z.email({ error: 'validation.email.invalid' }),
  password: z
    .string()
    .min(1, { error: 'validation.password.required' })
    .max(PASSWORD_MAX_LENGTH, { error: 'validation.password.tooLong' }),
});

export type SignInRequest = z.infer<typeof signInRequestSchema>;

/**
 * `capacities` va OPCIONAL, no con un `default` copiado del backend. El servidor ya aplica
 * el suyo (`['customer']`), y duplicarlo aquí haría que el tipo de entrada del formulario y
 * el de salida dejaran de coincidir — que es exactamente lo que rompe el resolver de React
 * Hook Form. Se declara porque darse de alta como `provider` es una pantalla del sprint 2 y
 * el campo por el que va a entrar ya existe.
 */
export const signUpRequestSchema = z.object({
  displayName: z
    .string()
    .min(1, { error: 'validation.displayName.required' })
    .max(DISPLAY_NAME_MAX_LENGTH, { error: 'validation.displayName.tooLong' }),
  email: z.email({ error: 'validation.email.invalid' }),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, { error: 'validation.password.tooShort' })
    .max(PASSWORD_MAX_LENGTH, { error: 'validation.password.tooLong' }),
  capacities: z.array(capacitySchema).min(1).max(2).optional(),
});

export type SignUpRequest = z.infer<typeof signUpRequestSchema>;

/**
 * Lo que devuelven `/auth/sign-in`, `/auth/sign-up` y `/auth/refresh`.
 *
 * PLANO, no anidado, y SIN `expiresIn`: el backend conoce la duración del token
 * (`JWT_ACCESS_TTL`) pero no la publica. La app deriva la caducidad del claim `exp` del
 * propio JWT — ver `domain/session/access-token.ts`.
 */
export const authResultSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  actor: actorSchema,
});

export type AuthResult = z.infer<typeof authResultSchema>;

/** El refresh viaja en el CUERPO, no en cookie. En React Native no hay cookie jar fiable. */
export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

export const signOutRequestSchema = refreshRequestSchema;
export type SignOutRequest = z.infer<typeof signOutRequestSchema>;
