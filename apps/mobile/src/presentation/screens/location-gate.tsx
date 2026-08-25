/**
 * OWNER: Jorge.
 *
 * Lo que se enseña cuando NO hay desde dónde buscar. Nunca una pantalla en blanco: cada
 * motivo trae su propia salida, y siempre hay al menos dos caminos hacia delante.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { OriginBlocker } from '../../application/location/resolve-origin';
import { Button } from '../components/button';
import { Icon } from '../components/icon';
import { useSearchOrigin } from '../providers/search-origin-provider';

export function LocationGate({ blocker }: { blocker: OriginBlocker }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { requestDeviceLocation, openSystemSettings, isResolving } = useSearchOrigin();

  // Con el permiso ya denegado, el diálogo del sistema NO vuelve a salir: pedirlo otra vez
  // sería un botón que no hace nada. Ahí el camino son los Ajustes.
  const canAskAgain = blocker === 'permission-undetermined' || blocker === 'position-unavailable';

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-surface px-6">
      <Icon name="distance" size={56} className="text-muted" />

      <Text className="text-center text-lg font-semibold text-foreground">
        {t('location.title')}
      </Text>
      <Text className="text-center text-base text-muted">{t(`location.blocked.${blocker}`)}</Text>

      {canAskAgain ? (
        <Button
          className="w-full"
          icon="location"
          isLoading={isResolving}
          onPress={() => void requestDeviceLocation()}
        >
          {t('location.useMyLocation')}
        </Button>
      ) : (
        <Button className="w-full" variant="secondary" onPress={() => void openSystemSettings()}>
          {t('location.openSettings')}
        </Button>
      )}

      {/* Siempre disponible: sin permiso, sin GPS y sin red se puede seguir usando la app. */}
      <Button className="w-full" variant="secondary" onPress={() => router.push('/city')}>
        {t('location.chooseCity')}
      </Button>
    </View>
  );
}
