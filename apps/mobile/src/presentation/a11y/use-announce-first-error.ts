import { useEffect, useRef } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo } from 'react-native';

import type { ValidationMessageKey } from '../i18n/message-keys';
import { isValidationMessageKey } from '../i18n/message-keys';

/**
 * El primer error del formulario, dicho en voz alta al enviar.
 *
 * Con un lector de pantalla, enviar un formulario incompleto no cambia el foco: el borde
 * se pone rojo y aparece un texto debajo, pero quien no ve la pantalla no se entera de
 * nada y solo sabe que el botón "no hizo nada".
 *
 * Se anuncia UNA vez por intento de envío, no en cada tecla: `submitCount` es lo que marca
 * el intento, y `reValidateMode: 'onChange'` haría que los errores cambiaran mientras se
 * corrigen, interrumpiendo al lector a mitad de palabra.
 */
export function useAnnounceFirstError(errors: FieldErrors, submitCount: number): void {
  const { t } = useTranslation();
  const announcedFor = useRef(0);

  useEffect(() => {
    if (submitCount === announcedFor.current) return;
    announcedFor.current = submitCount;

    const key = firstErrorKey(errors);
    if (key !== null) AccessibilityInfo.announceForAccessibility(t(key));
  }, [errors, submitCount, t]);
}

function firstErrorKey(errors: FieldErrors): ValidationMessageKey | null {
  for (const error of Object.values(errors)) {
    const message = error?.message;
    if (typeof message === 'string' && isValidationMessageKey(message)) return message;
  }

  return null;
}
