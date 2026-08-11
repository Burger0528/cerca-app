import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHasCapacity } from '../auth/use-can';
import { Button } from '../components/button';
import { messageKeyForError } from '../i18n/error-message-key';
import { useSession } from '../providers/session-provider';

export function AccountScreen() {
  const { t } = useTranslation();
  const { becomeProvider, signOut } = useSession();
  const isProvider = useHasCapacity('provider');

  const upgrade = useMutation({ mutationFn: becomeProvider });

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView contentContainerClassName="gap-6 px-6 py-6">
        <Text className="text-3xl font-bold text-foreground">{t('account.title')}</Text>

        {isProvider ? null : (
          <View className="gap-3 rounded-card border border-subtle p-4">
            <Text className="text-lg font-semibold text-foreground">
              {t('account.becomeProvider.title')}
            </Text>
            <Text className="text-base text-muted">{t('account.becomeProvider.body')}</Text>

            <Button onPress={() => upgrade.mutate()} isLoading={upgrade.isPending}>
              {upgrade.isPending
                ? t('account.becomeProvider.submitting')
                : t('account.becomeProvider.action')}
            </Button>
          </View>
        )}

        {upgrade.isError ? (
          <Text className="text-base text-danger" accessibilityLiveRegion="polite">
            {t(messageKeyForError(upgrade.error))}
          </Text>
        ) : null}

        <Button variant="secondary" onPress={() => void signOut()}>
          {t('session.signOut')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
