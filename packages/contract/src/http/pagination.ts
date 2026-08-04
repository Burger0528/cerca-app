/**
 * OWNER: Jorge.
 *
 * Paginación por cursor. No hay `page` ni `total`: con resultados ordenados por distancia
 * y un mapa que se mueve, los offsets duplican y saltan filas. El servidor manda el cursor
 * de la página siguiente, o `null` cuando se acabó.
 */
import { z } from 'zod';

/** Envuelve el schema de un item en la página que devuelve el servidor. */
export function cursorPageSchema<TItem extends z.ZodType>(item: TItem) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().min(1).nullable(),
  });
}

export interface CursorPage<TItem> {
  readonly items: TItem[];
  readonly nextCursor: string | null;
}

export const DEFAULT_PAGE_SIZE = 20;
