/**
 * OWNER: Salvador.
 *
 * Retrasa un valor hasta que deja de cambiar.
 *
 * Sin esto, "fontanero" son nueve peticiones y nueve entradas de caché, ocho de ellas para
 * un texto que el usuario nunca llegó a ver. El campo de texto sigue respondiendo a cada
 * tecla — eso NO se debe retrasar nunca — y lo que se retrasa es solo la consulta.
 */
import { useEffect, useState } from 'react';

export const SEARCH_DEBOUNCE_MS = 300;

export function useDebouncedValue<TValue>(value: TValue, delayMs = SEARCH_DEBOUNCE_MS): TValue {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    // Cada tecla cancela el temporizador anterior: solo sobrevive la última pulsación.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
