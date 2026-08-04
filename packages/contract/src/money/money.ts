/**
 * OWNER: Salvador — tipo acordado el día cero.
 *
 * El dinero nunca es un `number` suelto. `amountMinor` es un entero en la unidad menor
 * de la divisa (centavos en MXN, yenes enteros en JPY, milésimas en KWD) y siempre viaja
 * pegado a su `currency`. Dividir entre 100 a mano es el bug que este tipo existe para
 * hacer imposible.
 */
import { z } from 'zod';

export const moneySchema = z.object({
  amountMinor: z.int(),
  currency: z.string().length(3).toUpperCase(),
});

export type Money = z.infer<typeof moneySchema>;

/** Unidad de tiempo a la que se refiere un precio. El texto lo pone i18n, no esto. */
export const PRICE_UNITS = ['hour', 'day', 'job'] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

export const priceSchema = z.object({
  amount: moneySchema,
  unit: z.enum(PRICE_UNITS),
  /** Mínimo facturable, en la misma unidad. `2` con unit `hour` se lee "mínimo 2 h". */
  minimumUnits: z.number().positive().nullable().default(null),
});

export type Price = z.infer<typeof priceSchema>;
