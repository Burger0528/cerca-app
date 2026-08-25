/**
 * Denunciar un anuncio (`POST /listings/{id}/report`).
 *
 * El backend acepta `reason` como TEXTO LIBRE, entre 3 y 500 caracteres. Aquí se ofrecen
 * motivos cerrados más un detalle opcional, y se manda `codigo: detalle`.
 *
 * Se manda el CÓDIGO del motivo (`spam`), no su traducción: quien lee la cola es un
 * moderador, y no tiene por qué recibir el motivo en el idioma que tuviera puesto quien
 * denunció. El detalle sí va tal cual lo escribió la persona.
 */
import { REPORT_REASONS } from '@cerca/contract';
import type { ReportReason } from '@cerca/contract';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';

import { useReportListing } from '../hooks/use-report-listing';
import { messageKeyForError } from '../i18n/error-message-key';

import { Button } from './button';
import { Chip } from './chip';

/** El tope del backend. Se corta aquí para que no lo rechace con un 400. */
const MAX_REASON = 500;

function buildReason(reason: ReportReason, detail: string): string {
  const trimmed = detail.trim();
  const composed = trimmed.length === 0 ? reason : `${reason}: ${trimmed}`;

  return composed.slice(0, MAX_REASON);
}

export interface ReportListingProps {
  readonly listingId: string;
}

export function ReportListing({ listingId }: ReportListingProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [detail, setDetail] = useState('');
  const report = useReportListing(listingId);

  // El anuncio NO desaparece al denunciarlo: sigue publicado hasta que un moderador decida.
  // Decir "hecho" y dejarlo en pantalla es lo honesto; esconderlo sería prometer de más.
  if (report.isSuccess) {
    return (
      <Text className="text-center text-sm text-muted" accessibilityLiveRegion="polite">
        {t('listing.report.success')}
      </Text>
    );
  }

  if (!isOpen) {
    return (
      <Button variant="ghost" icon="moderation" onPress={() => setIsOpen(true)}>
        {t('listing.report.open')}
      </Button>
    );
  }

  return (
    <View className="gap-3 rounded-card border border-subtle bg-surface-raised p-4">
      <Text className="text-base font-semibold text-foreground">{t('listing.report.title')}</Text>

      <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
        {REPORT_REASONS.map((value) => (
          <Chip
            key={value}
            label={t(`listing.report.reason.${value}`)}
            isSelected={value === reason}
            onPress={() => setReason(value)}
          />
        ))}
      </View>

      <TextInput
        className="min-h-touch rounded-xl border border-subtle px-4 py-3 text-base text-foreground placeholder:text-muted"
        placeholder={t('listing.report.detailPlaceholder')}
        value={detail}
        onChangeText={setDetail}
        maxLength={MAX_REASON}
        multiline
        accessibilityLabel={t('listing.report.detailPlaceholder')}
      />

      <Button
        isLoading={report.isPending}
        onPress={() => report.mutate({ reason: buildReason(reason, detail) })}
      >
        {t('listing.report.submit')}
      </Button>

      <Button variant="secondary" onPress={() => setIsOpen(false)}>
        {t('common.cancel')}
      </Button>

      {report.isError ? (
        <Text className="text-center text-sm text-danger" accessibilityLiveRegion="polite">
          {t(messageKeyForError(report.error))}
        </Text>
      ) : null}
    </View>
  );
}
