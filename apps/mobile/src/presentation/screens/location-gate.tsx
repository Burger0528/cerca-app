/**
 * OWNER: Jorge.
 *
 * Lo que se enseña cuando NO hay desde dónde buscar. Nunca una pantalla en blanco: cada
 * motivo trae su propia salida, y siempre hay al menos dos caminos hacia delante.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { OriginBlocker } from '../../application/location/resolve-origin';
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
      <Text className="text-center text-lg font-semibold text-foreground">
        {t('location.title')}
      </Text>
      <Text className="text-center text-base text-muted">{t(`location.blocked.${blocker}`)}</Text>

      {canAskAgain ? (
        <Pressable
          className="min-h-touch w-full items-center justify-center rounded-xl bg-brand px-4 active:opacity-80"
          accessibilityRole="button"
          disabled={isResolving}
          onPress={() => void requestDeviceLocation()}
        >
          <Text className="py-3 text-base font-semibold text-surface">
            {t('location.useMyLocation')}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          className="min-h-touch w-full items-center justify-center rounded-xl border border-subtle px-4 active:bg-surface-raised"
          accessibilityRole="button"
          onPress={() => void openSystemSettings()}
        >
          <Text className="py-3 text-base font-semibold text-foreground">
            {t('location.openSettings')}
          </Text>
        </Pressable>
      )}

      {/* Siempre disponible: sin permiso, sin GPS y sin red se puede seguir usando la app. */}
      <Pressable
        className="min-h-touch w-full items-center justify-center rounded-xl border border-subtle px-4 active:bg-surface-raised"
        accessibilityRole="button"
        onPress={() => router.push('/city')}
      >
        <Text className="py-3 text-base font-semibold text-foreground">
          {t('location.chooseCity')}
        </Text>
      </Pressable>
    </View>
  );
}
