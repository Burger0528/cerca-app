/**
 * OWNER: Salvador. Sustituye a `search-placeholder.tsx`.
 *
 * US-02 y la parte de US-07 que toca a la tarjeta.
 *
 * Los CUATRO estados del enunciado son cuatro caminos distintos y excluyentes, no matices
 * del mismo: cargando (esqueleto con forma de tarjeta), error (en lenguaje llano y con
 * reintento), vacío inicial (ofrecer más radio) y vacío por filtro (ofrecer limpiarlos).
 * Los dos vacíos se distinguen porque la salida de cada uno es distinta: ampliar el radio
 * cuando el problema es un filtro no arregla nada.
 */
import type { Listing, ListingSearchFilters } from '@cerca/contract';
import {
  DEFAULT_RADIUS_KM,
  EMPTY_LISTING_FILTERS,
  formatDistance,
  hasActiveFilters,
} from '@cerca/contract';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  ContractViolationError,
  HttpError,
  NetworkError,
  TimeoutError,
} from '../../domain/errors/app-error';
import { Button } from '../components/button';
import { FiltersModal } from '../components/filters-modal';
import { ListingCard, listingCardHeight } from '../components/listing-card';
import { ListingListSkeleton } from '../components/listing-card-skeleton';
import { useCategories } from '../hooks/use-categories';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { useListingSearch } from '../hooks/use-listing-search';
import { useLocale } from '../hooks/use-locale';
import type { FeedbackMessageKey } from '../i18n/message-keys';
import { useSearchOrigin } from '../providers/search-origin-provider';

import { LocationGate } from './location-gate';

export function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useLocale();
  const { fontScale } = useWindowDimensions();
  const { origin, blocker, isResolving } = useSearchOrigin();

  const [query, setQuery] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<ListingSearchFilters>(EMPTY_LISTING_FILTERS);
  const [isFiltersOpen, setFiltersOpen] = useState(false);

  // El campo responde a cada tecla; la BÚSQUEDA espera a que pares. Teclear "fontanero" es
  // una petición, no nueve.
  const debouncedQuery = useDebouncedValue(query);

  const filters = useMemo<ListingSearchFilters>(
    () => ({ ...appliedFilters, query: debouncedQuery }),
    [appliedFilters, debouncedQuery],
  );

  const search = useListingSearch(filters);
  const categories = useCategories();

  /**
   * La altura de fila es la MISMA función que usa la tarjeta.
   *
   * `getItemLayout` le ahorra a `FlatList` medir cada fila: puede calcular la posición de
   * la 4.000 sin haber pintado las 3.999 anteriores, que es lo que sostiene el scroll de
   * 5.000 tarjetas del criterio. Si esta altura y la real discreparan, el scroll saltaría.
   */
  const rowHeight = listingCardHeight(fontScale);

  const getItemLayout = useCallback(
    (_data: ArrayLike<Listing> | null | undefined, index: number) => ({
      length: rowHeight,
      offset: rowHeight * index,
      index,
    }),
    [rowHeight],
  );

  // Estable entre renders: si esto fuese una lambda nueva cada vez, `memo` en la tarjeta no
  // serviría de nada porque la prop cambiaría siempre.
  const keyExtractor = useCallback((listing: Listing) => listing.id, []);

  // La distancia viaja como parámetro de ruta: el detalle no la recibe del backend y aquí
  // ya se conoce, así que no hace falta volver a pedirla.
  const openListing = useCallback(
    (listing: Listing) =>
      router.push({
        pathname: '/listings/[id]',
        params: { id: listing.id, distanceMeters: String(listing.distanceMeters) },
      }),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => (
      <ListingCard listing={item} locale={locale} height={rowHeight} onPress={openListing} />
    ),
    [locale, rowHeight, openListing],
  );

  // Sin origen no hay búsqueda posible: se enseña la salida, no una lista vacía que parece
  // un fallo.
  if (origin.kind === 'unset') {
    if (isResolving) {
      return (
        <View className="flex-1 items-center justify-center bg-surface">
          <ActivityIndicator />
        </View>
      );
    }
    if (blocker !== null) return <LocationGate blocker={blocker} />;
  }

  const filtersAreActive = hasActiveFilters(filters);
  const isEmpty = !search.isPending && !search.isError && search.listings.length === 0;

  return (
    <View className="flex-1 bg-surface">
      <View className="gap-3 px-4 py-3">
        <TextInput
          className="min-h-touch rounded-xl border border-subtle px-4 text-base text-foreground placeholder:text-muted"
          placeholder={t('search.placeholder')}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={t('search.placeholder')}
        />

        <View className="flex-row items-center justify-between">
          <Button variant="secondary" onPress={() => setFiltersOpen(true)}>
            {filtersAreActive
              ? t('search.filters.activeCount', { count: activeFilterCount(filters) })
              : t('search.filters.open')}
          </Button>

          {search.isPending || search.isError ? null : (
            <Text className="text-sm text-muted">
              {t('search.resultCount', { count: search.listings.length })}
            </Text>
          )}
        </View>
      </View>

      {/* ESTADO 1 · cargando: la silueta de las tarjetas, no un spinner centrado. */}
      {search.isPending ? <ListingListSkeleton fontScale={fontScale} /> : null}

      {/* ESTADO 2 · error, en lenguaje llano y con reintento que de verdad reintenta. */}
      {search.isError ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Text className="text-center text-base text-muted">{t(messageKeyFor(search.error))}</Text>
          <Button variant="secondary" onPress={() => void search.refetch()}>
            {t('common.retry')}
          </Button>
        </View>
      ) : null}

      {/* ESTADOS 3 y 4 · los dos vacíos, con salidas distintas. */}
      {isEmpty ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-center text-lg font-semibold text-foreground">
            {filtersAreActive ? t('search.empty.filtered.title') : t('search.empty.initial.title')}
          </Text>
          <Text className="pb-2 text-center text-base text-muted">
            {filtersAreActive
              ? t('search.empty.filtered.body')
              : t('search.empty.initial.body', {
                  radius: formatDistance(
                    { meters: (filters.radiusKm ?? DEFAULT_RADIUS_KM) * 1000 },
                    locale,
                  ),
                })}
          </Text>

          {filtersAreActive ? (
            <Button onPress={() => setAppliedFilters({ ...EMPTY_LISTING_FILTERS, query })}>
              {t('search.empty.filtered.action')}
            </Button>
          ) : (
            <Button
              onPress={() =>
                setAppliedFilters({
                  ...appliedFilters,
                  radiusKm: widenRadius(filters.radiusKm),
                })
              }
            >
              {t('search.empty.initial.action')}
            </Button>
          )}
        </View>
      ) : null}

      {!search.isPending && !search.isError && search.listings.length > 0 ? (
        <FlatList
          data={search.listings}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          // Sin esto, RN mantiene montadas todas las filas por las que has pasado y la
          // memoria sube en escalera durante un scroll largo.
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage();
          }}
          ListFooterComponent={
            search.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : null
          }
          keyboardDismissMode="on-drag"
        />
      ) : null}

      <FiltersModal
        // La key cambia al abrir: cada apertura monta una instancia nueva, y el borrador
        // arranca de los filtros aplicados sin necesidad de un efecto que lo resincronice.
        key={isFiltersOpen ? 'filters-open' : 'filters-closed'}
        isVisible={isFiltersOpen}
        filters={filters}
        categories={categories.data ?? []}
        locale={locale}
        onApply={(applied) => {
          setAppliedFilters(applied);
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
      />
    </View>
  );
}

/** Cuántos filtros hay puestos, para el botón. El texto no cuenta: no es un filtro. */
function activeFilterCount(filters: ListingSearchFilters): number {
  return [filters.categoryId, filters.radiusKm].filter((value) => value !== null).length;
}

/**
 * Duplica el radio, con un suelo por si no había ninguno puesto y un techo en los 200 km
 * que acepta el backend: pedir más devolvería un 400, no más resultados.
 */
function widenRadius(current: number | null): number {
  return Math.min((current ?? DEFAULT_RADIUS_KM) * 2, 200);
}

/**
 * Traduce el TIPO del error a una clave de i18n.
 *
 * Por tipo y no por mensaje: el mensaje del servidor cambia sin avisar, y encadenar
 * `includes('network')` es cómo se acaba enseñando "Failed to fetch" a un usuario.
 */
function messageKeyFor(error: unknown): FeedbackMessageKey {
  if (error instanceof NetworkError) return 'errors.network';
  if (error instanceof TimeoutError) return 'errors.timeout';
  if (error instanceof ContractViolationError) return 'errors.contract';
  if (error instanceof HttpError) return error.status >= 500 ? 'errors.server' : 'errors.unknown';

  return 'errors.unknown';
}
