/**
 * OWNER: Salvador.
 *
 * Espejo de `moneySchema` del backend.
 *
 * El dinero nunca es un `number` suelto. `amountMinor` es un entero en la unidad menor de
 * la divisa (centavos en MXN, yenes enteros en JPY, milésimas en KWD) y siempre viaja
 * pegado a su `currency`. Dividir entre 100 a mano es el bug que este tipo existe para
 * hacer imposible — y además está mal en general: el peso colombiano tiene 0 decimales.
 *
 * El servidor NUNCA formatea dinero. Emite `{ amountMinor, currency }` y el cliente lo
 * escribe para su locale, que es lo que hace `formatMoney`.
 */
import { z } from 'zod';

export const moneySchema = z
  .object({
    amountMinor: z.int().nonnegative(),
    currency: z
      .string()
      .length(3)
      .regex(/^[A-Z]{3}$/, 'validation.currency.invalid'),
  })
  .strict();

export type Money = z.infer<typeof moneySchema>;

/**
 * Cómo se cobra un anuncio. Unión discriminada, igual que en el backend, donde vive como
 * JSONB validado por este mismo schema.
 *
 * Hoy solo llega en el detalle de un anuncio (`GET /v1/listings/:id`), no en la búsqueda:
 * la lista recibe únicamente `priceFrom`. Ver el punto 4 de `docs/contract-delta.md`.
 */
export const pricingSchema = z.discriminatedUnion('model', [
  z.object({ model: z.literal('fixed'), price: moneySchema }).strict(),
  z
    .object({
      model: z.literal('hourly'),
      hourlyRate: moneySchema,
      minimumHours: z.int().min(1).max(12),
    })
    .strict(),
  z.object({ model: z.literal('quote'), startingFrom: moneySchema.optional() }).strict(),
]);

export type Pricing = z.infer<typeof pricingSchema>;
