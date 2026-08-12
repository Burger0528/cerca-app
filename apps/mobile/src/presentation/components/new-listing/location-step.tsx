import { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { SearchOrigin } from '../../../domain/location/location';
import { useSearchOrigin } from '../../providers/search-origin-provider';
import { Button } from '../button';

function originLabel(origin: SearchOrigin, t: TFunction): string {
  switch (origin.kind) {
    case 'city':
      return origin.city.name;
    case 'device':
      return t('provider.newListing.location.device');
    case 'unset':
      return t('provider.newListing.location.missing');
  }
}

export function LocationStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const { origin } = useSearchOrigin();

  return (
    <View className="gap-3">
      <Text className="text-sm font-medium text-muted">
        {t('provider.newListing.location.label')}
      </Text>

      <Text className="text-lg font-semibold text-foreground">{originLabel(origin, t)}</Text>

      <Text className="text-base text-muted">{t('provider.newListing.location.hint')}</Text>

      <Button variant="secondary" className="self-start" onPress={() => router.push('/city')}>
        {t('location.chooseCity')}
      </Button>
    </View>
  );
}
