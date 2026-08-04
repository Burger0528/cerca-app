/**
 * OWNER: Salvador (primera versión del día cero, escrita con Jorge).
 */
import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string().min(1),
  /** Clave de i18n, no el texto. `category.plumbing` → "Fontanería" / "Plumbing". */
  nameKey: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.string().min(1).nullable().default(null),
});

export type Category = z.infer<typeof categorySchema>;
