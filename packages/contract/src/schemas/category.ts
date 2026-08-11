/**
 * OWNER: Salvador.
 *
 * Espejo de `categoryResponseSchema` del backend.
 *
 * `name` viene YA TRADUCIDO por el servidor. No es una clave de i18n, y por eso se pinta
 * tal cual. Es una decisión del backend, no nuestra: significa que el catálogo puede crecer
 * sin publicar una versión de la app, a cambio de que el idioma de las categorías dependa
 * de lo que el servidor tenga guardado. Está anotado en `docs/contract-delta.md`.
 */
import { z } from 'zod';

export const categorySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
});

export type Category = z.infer<typeof categorySchema>;
