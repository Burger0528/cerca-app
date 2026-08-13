import { useCallback } from 'react';
import type { FieldErrors, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo } from 'react-native';

import { isValidationMessageKey } from '../i18n/message-keys';

export function useAnnounceFirstError<TValues extends FieldValues>() {
  const { t } = useTranslation();

  return useCallback(
    (errors: FieldErrors<TValues>) => {
      const firstMessage = Object.values(errors)[0]?.message;
      if (typeof firstMessage === 'string' && isValidationMessageKey(firstMessage)) {
        AccessibilityInfo.announceForAccessibility(t(firstMessage));
      }
    },
    [t],
  );
}
