/**
 * OWNER: Jorge. La salida digna cuando no hay ubicación (US-08).
 *
 * Presentación mínima a propósito: el acabado visual es de Salvador. Lo que aquí NO se
 * negocia es el comportamiento: se puede elegir ciudad sin permiso, sin GPS y sin red.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';

import { FALLBACK_CITIES } from '../../domain/location/cities';
import type { City } from '../../domain/location/location';
import { useSearchOrigin } from '../providers/search-origin-provider';

export function CityPickerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { chooseCity } = useSearchOrigin();

  const onPick = (city: City) => {
    chooseCity(city);
    // `back` y no `replace`: se llega aquí como modal desde la búsqueda, y volver es
    // volver a los resultados, ya con el origen puesto.
    router.back();
  };

  return (
    <View className="flex-1 bg-surface px-4 pt-4">
      <Text className="pb-3 text-xl font-semibold text-foreground">
        {t('location.cityPickerTitle')}
      </Text>

      <FlatList
        data={FALLBACK_CITIES}
        // El id, nunca el índice: si mañana la lista se ordena por cercanía, el índice 2
        // pasa a ser otra ciudad y React reutiliza la fila equivocada.
        keyExtractor={(city) => city.id}
        renderItem={({ item }) => (
          <Pressable
            className="min-h-touch justify-center border-b border-subtle active:bg-surface-raised"
            accessibilityRole="button"
            accessibilityLabel={item.name}
            onPress={() => onPick(item)}
          >
            <Text className="py-3 text-base text-foreground">{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
