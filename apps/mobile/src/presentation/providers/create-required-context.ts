/**
 * Un contexto SIN valor por defecto, y su hook de lectura.
 *
 * El valor por defecto de `createContext` es una trampa: si nadie monta el provider, el
 * componente recibe ese valor y sigue como si nada, hasta que revienta tres pantallas más
 * allá con un "cannot read property search of undefined" que no señala a nada.
 *
 * Aquí el defecto es `null` y el hook falla en el sitio y con el nombre del hook que se
 * llamó. Estaba copiado en los tres providers; ahora es esta función.
 */
import { createContext, useContext } from 'react';
import type { Context } from 'react';

export function createRequiredContext<T>(hookName: string): [Context<T | null>, () => T] {
  const context = createContext<T | null>(null);

  function useRequiredContext(): T {
    const value = useContext(context);

    if (value === null) {
      throw new Error(`${hookName} fuera de su provider. Falta montarlo.`);
    }

    return value;
  }

  return [context, useRequiredContext];
}
