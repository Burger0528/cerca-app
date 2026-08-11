/**
 * OWNER: Salvador.
 *
 * Une clases de Tailwind resolviendo los conflictos por el ÚLTIMO valor.
 *
 * Sin esto, `"p-4" + " p-2"` deja las dos en la cadena y gana la que Tailwind haya puesto
 * antes en la hoja, no la que escribió quien llama. Con `twMerge`, la de la derecha gana
 * siempre — que es lo que cualquiera espera al pasar `className` a un componente para
 * pisarle un estilo.
 */
import { twMerge } from 'tailwind-merge';

export function cn(...classes: (string | false | null | undefined)[]): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
