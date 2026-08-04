/**
 * OWNER: Salvador (primera versión del día cero, escrita con Jorge).
 *
 * Los mensajes de error son CLAVES de i18n, nunca texto. `validation.email.invalid` se
 * traduce en la pantalla; si aquí hubiera "Correo inválido" la app solo hablaría español.
 */
import { z } from 'zod';

import { actorSchema } from '../actor/actor.ts';

export const PASSWORD_MIN_LENGTH = 8;

export const signInRequestSchema = z.object({
  email: z.email({ error: 'validation.email.invalid' }),
  password: z.string().min(1, { error: 'validation.password.required' }),
});

export type SignInRequest = z.infer<typeof signInRequestSchema>;

export const signUpRequestSchema = z.object({
  displayName: z.string().min(1, { error: 'validation.displayName.required' }),
  email: z.email({ error: 'validation.email.invalid' }),
  password: z.string().min(PASSWORD_MIN_LENGTH, { error: 'validation.password.tooShort' }),
});

export type SignUpRequest = z.infer<typeof signUpRequestSchema>;

/**
 * Lo que devuelve /auth/sign-in y /auth/refresh.
 * TODO(día cero): confirmar contra Postman si el refresh viaja en el cuerpo o en cookie
 * httpOnly, y si `expiresIn` son segundos o milisegundos.
 */
export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  /** Segundos de vida del access token. */
  expiresIn: z.int().positive(),
});

export type AuthTokens = z.infer<typeof authTokensSchema>;

export const authSessionSchema = z.object({
  tokens: authTokensSchema,
  actor: actorSchema,
});

export type AuthSession = z.infer<typeof authSessionSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
