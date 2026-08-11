/**
 * OWNER: Salvador.
 *
 * El modal de filtros.
 *
 * Trabaja sobre un BORRADOR y solo devuelve los filtros al pulsar "ver resultados". Si cada
 * chip aplicara al instante, tocar cuatro filtros serían cuatro búsquedas y tres listas que
 * nadie llegó a mirar — además de que cancelar dejaría de significar nada.
 *
 * Son DOS filtros y no cuatro porque son los dos que `searchListingsQuerySchema` del backend
 * acepta. La valoración mínima y el precio máximo no existen en la API: ofrecerlos sería un
 * control que el usuario mueve y no cambia nada. Punto 6 de `docs/contract-delta.md`.
 */
import type { Category, ListingSearchFilters } from '@cerca/contract';
import { EMPTY_LISTING_FILTERS, formatDistance } from '@cerca/contract';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, Text, View } from 'react-native';

import { Button } from './button';
import { Chip } from './chip';

/** Radios ofrecidos, en kilómetros. `null` deja que el servidor aplique su defecto (10). */
const RADIUS_OPTIONS: readonly (number | null)[] = [null, 1, 5, 10, 25, 50];

export interface FiltersModalProps {
  readonly isVisible: boolean;
  readonly filters: ListingSearchFilters;
  readonly categories: readonly Category[];
  readonly locale: string;
  readonly onApply: (filters: ListingSearchFilters) => void;
  readonly onClose: () => void;
}

export function FiltersModal({
  isVisible,
  filters,
  categories,
  locale,
  onApply,
  onClose,
}: FiltersModalProps) {
  const { t } = useTranslation();

  /**
   * El borrador nace de lo aplicado y no se vuelve a sincronizar.
   *
   * Quien monta este componente le pasa una `key` que cambia al abrirlo, así que cada
   * apertura es una instancia nueva y este `useState` ya parte del valor correcto. Un
   * `useEffect` que reescribiera el borrador al abrir haría lo mismo pagando un render de
   * más — y sería un `setState` dentro de un efecto, que es de lo que avisa el linter.
   */
  const [draft, setDraft] = useState(filters);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      // En Android el botón físico de atrás tiene que cerrar el modal, no salir de la app.
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-surface">
        <View className="flex-row items-center justify-between border-b border-subtle px-4 py-3">
          <Text className="text-xl font-bold text-foreground">{t('search.filters.title')}</Text>
          <Button variant="ghost" onPress={onClose} accessibilityLabel={t('common.close')}>
            {t('common.close')}
          </Button>
        </View>

        <ScrollView contentContainerClassName="gap-6 px-4 py-5">
          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">{t('search.filters.category')}</Text>
            <View className="flex-row flex-wrap gap-2">
              <Chip
                label={t('search.filters.anyCategory')}
                isSelected={draft.categoryId === null}
                onPress={() => setDraft({ ...draft, categoryId: null })}
              />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  // `name` viene ya traducido del servidor. Ver el punto 5 del delta.
                  label={category.name}
                  isSelected={draft.categoryId === category.id}
                  onPress={() => setDraft({ ...draft, categoryId: category.id })}
                />
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">{t('search.filters.radius')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {RADIUS_OPTIONS.map((kilometers) => (
                <Chip
                  key={kilometers === null ? 'any-radius' : `radius-${kilometers}`}
                  label={
                    kilometers === null
                      ? t('search.filters.anyRadius')
                      : t('search.filters.radiusValue', {
                          distance: formatDistance({ meters: kilometers * 1000 }, locale),
                        })
                  }
                  isSelected={draft.radiusKm === kilometers}
                  onPress={() => setDraft({ ...draft, radiusKm: kilometers })}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View className="gap-2 border-t border-subtle px-4 py-4">
          <Button onPress={() => onApply(draft)}>{t('search.filters.showResults')}</Button>
          <Button
            variant="secondary"
            // Limpiar respeta el texto tecleado: el usuario quiso quitar los FILTROS, no
            // borrar lo que estaba buscando.
            onPress={() => setDraft({ ...EMPTY_LISTING_FILTERS, query: draft.query })}
          >
            {t('search.filters.clear')}
          </Button>
        </View>
      </View>
    </Modal>
  );
}
