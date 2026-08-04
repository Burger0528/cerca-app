/**
 * ANDAMIO DE JORGE — Salvador lo sustituye.
 *
 * Deja cableados los cuatro estados y el scroll con cursor para que la capa de datos se
 * pueda probar hoy. Lo que falta es todo lo suyo: `ListingCard`, `getItemLayout`, el
 * skeleton con forma de tarjeta, `expo-image` con blurhash y el modal de filtros.
 *
 * Salvador: crea `search-screen.tsx` y cambia el import de `src/app/(app)/index.tsx`.
 */
import type { ListingSearchFilters } from '@cerca/contract';
import { EMPTY_LISTING_FILTERS, hasActiveFilters } from '@cerca/contract';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import {
  ContractViolationError,
  HttpError,
  NetworkError,
  TimeoutError,
} from '../../domain/errors/app-error';
import { useListingSearch } from '../hooks/use-listing-search';
import { useSearchOrigin } from '../providers/search-origin-provider';

import { LocationGate } from './location-gate';

export function SearchPlaceholder() {
  const { t } = useTranslation();
  const { origin, blocker, isResolving } = useSearchOrigin();
  const [query, setQuery] = useState('');

  // TODO(salvador): debounce del texto antes de que llegue a los filtros, para que teclear
  // no dispare una petición por letra.
  const filters = useMemo<ListingSearchFilters>(
    () => ({ ...EMPTY_LISTING_FILTERS, query }),
    [query],
  );

  const search = useListingSearch(filters);

  // Sin origen no hay búsqueda posible: se enseña la salida, no una lista vacía.
  if (origin.kind === 'unset') {
    if (isResolving) return <FullScreenSpinner />;
    if (blocker !== null) return <LocationGate blocker={blocker} />;
  }

  return (
    <View className="flex-1 bg-surface">
      <TextInput
        className="min-h-touch mx-4 my-3 rounded-xl border border-subtle px-4 text-base text-foreground"
        placeholder={t('search.placeholder')}
        value={query}
        onChangeText={setQuery}
      />

      {/* ESTADO 1 · cargando. TODO(salvador): skeleton con forma de tarjeta, no un spinner. */}
      {search.isPending ? <FullScreenSpinner /> : null}

      {/* ESTADO 2 · error, en lenguaje llano y con reintento. */}
      {search.isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="text-center text-base text-muted">{t(messageKeyFor(search.error))}</Text>
          <Pressable
            className="min-h-touch items-center justify-center rounded-xl border border-subtle px-6 active:bg-surface-raised"
            accessibilityRole="button"
            onPress={() => void search.refetch()}
          >
            <Text className="py-3 text-base font-semibold text-foreground">
              {t('common.retry')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* ESTADOS 3 y 4 · vacío inicial y vacío por filtro son distintos, y la salida también. */}
      {!search.isPending && !search.isError && search.listings.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters(filters)} />
      ) : null}

      {!search.isPending && !search.isError && search.listings.length > 0 ? (
        <FlatList
          data={search.listings}
          keyExtractor={(listing) => listing.id}
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage();
          }}
          ListFooterComponent={search.isFetchingNextPage ? <ActivityIndicator /> : null}
          renderItem={({ item }) => (
            // TODO(salvador): <ListingCard listing={item} /> con sus tres niveles de jerarquía.
            <Text className="px-4 py-3 text-base text-foreground">{item.title}</Text>
          )}
        />
      ) : null}
    </View>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const { t } = useTranslation();

  // TODO(salvador): copy definitivo en en.json/es.json, y los dos botones.
  //   sin filtros → "ampliar el radio"
  //   con filtros → "limpiar filtros"
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-center text-base text-muted">
        {hasFilters
          ? 'TODO(salvador): vacío por filtro + limpiar'
          : 'TODO(salvador): vacío inicial + ampliar radio'}
      </Text>
      <Text className="pt-2 text-center text-sm text-muted">{t('common.loading')}</Text>
    </View>
  );
}

function FullScreenSpinner() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator />
    </View>
  );
}

/**
 * Traduce el TIPO del error a una clave de i18n.
 *
 * Por tipo y no por mensaje: el mensaje del servidor cambia sin avisar, y encadenar
 * `includes('network')` es cómo se acaba enseñando "Failed to fetch" a un usuario.
 */
function messageKeyFor(error: unknown): string {
  if (error instanceof NetworkError) return 'errors.network';
  if (error instanceof TimeoutError) return 'errors.timeout';
  if (error instanceof ContractViolationError) return 'errors.contract';
  if (error instanceof HttpError) return error.status >= 500 ? 'errors.server' : 'errors.unknown';
  return 'errors.unknown';
}
