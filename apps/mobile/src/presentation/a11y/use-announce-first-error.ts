/**
 * OWNER: Salvador.
 *
 * Se llama en el cuerpo del componente con `form.formState.errors` y
 * `form.formState.submitCount`. Cada vez que `submitCount` sube (un intento nuevo de
 * enviar), si sigue habiendo errores, anuncia el primero al lector de pantalla.
 */
import { useEffect } from 'react';
import type { FieldErrors, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo } from 'react-native';

import { isValidationMessageKey } from '../i18n/message-keys';

export function useAnnounceFirstError<TValues extends FieldValues>(
  errors: FieldErrors<TValues>,
  submitCount: number,
): void {
  const { t } = useTranslation();

  useEffect(() => {
    if (submitCount === 0) return;
    const firstMessage = Object.values(errors)[0]?.message;
    if (typeof firstMessage === 'string' && isValidationMessageKey(firstMessage)) {
      AccessibilityInfo.announceForAccessibility(t(firstMessage));
    }
  }, [submitCount, errors, t]);
}
