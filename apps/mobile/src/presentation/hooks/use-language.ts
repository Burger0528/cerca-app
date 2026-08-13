import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { isSupportedLanguage } from '../../domain/preferences/language';
import type { SupportedLanguage } from '../../domain/preferences/language';
import { deviceLanguage } from '../i18n';
import { useServices } from '../providers/services-provider';

/**
 * Aplica el idioma guardado, una vez, al arrancar.
 *
 * Va en el composition root y no en la pantalla de cuenta: si viviera ahí, la app arrancaría
 * en el idioma del teléfono y solo cambiaría al abrir esa pestaña.
 */
export function useRestoreLanguage(): void {
  const { languagePreference } = useServices();
  const { i18n } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    void languagePreference.read().then((stored) => {
      if (cancelled || stored === null || stored === i18n.language) return;
      void i18n.changeLanguage(stored);
    });

    return () => {
      cancelled = true;
    };
  }, [languagePreference, i18n]);
}

export interface LanguageControl {
  readonly current: SupportedLanguage;
  readonly change: (language: SupportedLanguage) => void;
}

export function useLanguage(): LanguageControl {
  const { languagePreference } = useServices();
  const { i18n } = useTranslation();

  const change = useCallback(
    (language: SupportedLanguage) => {
      // Primero la UI y después el disco: el cambio se ve al instante y guardarlo es lo que
      // puede tardar. Si la escritura falla, la sesión sigue en el idioma elegido.
      void i18n.changeLanguage(language);
      void languagePreference.write(language);
    },
    [i18n, languagePreference],
  );

  const current = isSupportedLanguage(i18n.language) ? i18n.language : deviceLanguage();

  return { current, change };
}
