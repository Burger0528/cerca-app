import type { Report, ReportResolution } from '@cerca/contract';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from './button';

export interface ReportRowProps {
  readonly report: Report;
  readonly isBusy: boolean;
  readonly onResolve: (report: Report, resolution: ReportResolution) => void;
}

function ReportRowComponent({ report, isBusy, onResolve }: ReportRowProps) {
  const { t } = useTranslation();
  const isOpen = report.status === 'open';

  return (
    <View
      className="gap-2 border-b border-subtle px-4 py-4"
      accessible
      accessibilityLabel={t('moderation.reports.a11y.row', {
        reason: report.reason,
        status: t(`moderation.reports.status.${report.status}`),
      })}
    >
      <Text className="text-base font-semibold text-foreground">{report.reason}</Text>

      <Text className="text-sm text-muted">{t(`moderation.reports.status.${report.status}`)}</Text>

      {isOpen ? (
        <View className="flex-row flex-wrap gap-2">
          <Button variant="danger" isLoading={isBusy} onPress={() => onResolve(report, 'remove')}>
            {t('moderation.reports.action.remove')}
          </Button>

          <Button
            variant="secondary"
            isLoading={isBusy}
            onPress={() => onResolve(report, 'dismiss')}
          >
            {t('moderation.reports.action.dismiss')}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

export const ReportRow = memo(ReportRowComponent);
