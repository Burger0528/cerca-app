import type { Report, ReportResolution } from '@cerca/contract';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/button';
import { ReportRow } from '../components/report-row';
import { useReports, useResolveReport } from '../hooks/use-reports';
import { messageKeyForError } from '../i18n/error-message-key';

export function ReportsScreen() {
  const { t } = useTranslation();
  const queue = useReports();
  const decision = useResolveReport();

  const decidingId = decision.isPending ? decision.variables.report.id : null;

  const { mutate } = decision;

  const resolve = useCallback(
    (report: Report, resolution: ReportResolution) => mutate({ report, resolution }),
    [mutate],
  );

  const keyExtractor = useCallback((report: Report) => report.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Report }) => (
      <ReportRow report={item} isBusy={item.id === decidingId} onResolve={resolve} />
    ),
    [decidingId, resolve],
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <Text className="px-4 py-3 text-3xl font-bold text-foreground">
        {t('moderation.reports.title')}
      </Text>

      {queue.isPending ? <ActivityIndicator className="py-8" /> : null}

      {queue.isError ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Text className="text-center text-base text-muted">
            {t(messageKeyForError(queue.error))}
          </Text>
          <Button variant="secondary" onPress={() => void queue.refetch()}>
            {t('common.retry')}
          </Button>
        </View>
      ) : null}

      {!queue.isPending && !queue.isError && queue.reports.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-center text-lg font-semibold text-foreground">
            {t('moderation.reports.empty.title')}
          </Text>
          <Text className="text-center text-base text-muted">
            {t('moderation.reports.empty.body')}
          </Text>
        </View>
      ) : null}

      {queue.reports.length > 0 ? (
        <FlatList
          data={queue.reports}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          removeClippedSubviews
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (queue.hasNextPage && !queue.isFetchingNextPage) void queue.fetchNextPage();
          }}
          ListFooterComponent={
            queue.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : null
          }
        />
      ) : null}
    </SafeAreaView>
  );
}
