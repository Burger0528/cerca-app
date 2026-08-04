# Salvador, puedes empezar

Todo lo de la columna "Jorge" del sprint está montado y `./scripts/verify.sh` está en
verde. Esto es lo que te toca, dónde está y qué NO tienes que tocar.

Antes de nada: `npm install`, `cp apps/mobile/.env.example apps/mobile/.env.local`,
`npm run -w mobile ios`. Si algo de eso falla, es un bug mío, dímelo y lo arreglo.

## Lo que te dejo hecho, para que no lo rehagas

- El monorepo con workspaces de npm, y `@cerca/contract` enlazado desde la app. Editas el
  contrato y Metro recarga la app sin compilar nada.
- La estructura de Clean Architecture, con la regla de dependencia **en el linter**. Si
  importas `infrastructure` desde una pantalla, el lint falla. No es opinión mía, es CI.
- `verify.sh` (formato, lint, tipos, tests, auditoría de `EXPO_PUBLIC_`) y los hooks de
  Husky. `pre-commit` solo mira lo tocado.
- El cliente HTTP: `Bearer`, timeout, `problem+json` con su `reason`, y **validación con
  schema en el límite**. Le pasas un schema y te devuelve el tipo demostrado.
- La sesión completa: llavero, `sign-in` / `refresh` / `sign-out` / `me`, refresh con
  single-flight, y las guardas de `(auth)` / `(app)`.
- La capa de datos: `listingKeys` jerárquicas, `snapToGrid`, `useListingSearch` con cursor,
  y `retry: false` para 401 y 403.
- `expo-location` con los cuatro motivos de bloqueo distinguidos y el selector de ciudad.
- El cableado de NativeWind y de i18next. Los tokens y las claves son tuyos.

## Lo tuyo, archivo por archivo

### 1. `packages/contract` — el contrato

| Archivo                                                     | Qué falta                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/actor/permissions.ts`                                  | La matriz completa del enunciado en `CAPACITY_PERMISSIONS` y `PLATFORM_PERMISSIONS`, y `has()` / `can()`. Hoy lanzan `TODO(salvador)` a propósito: es más ruidoso que devolver `false` en silencio. Sustituye también el `type Permission = string` por la unión literal. |
| `src/money/format.ts`                                       | `minorUnitDigits()` y `formatMoney()` con `Intl.NumberFormat`.                                                                                                                                                                                                            |
| `src/money/distance.ts`                                     | `formatDistance()`, km o millas según locale.                                                                                                                                                                                                                             |
| `src/actor/permissions.test.ts`, `src/money/format.test.ts` | Están escritos con `it.todo`, uno por criterio de aceptación del enunciado. Quita el `.todo` según los vayas cerrando.                                                                                                                                                    |

Los schemas de `auth`, `category` y `listing` ya tienen una **primera versión del día cero**
que la app está consumiendo hoy. Son tuyos: extiéndelos, renómbralos, pártelos. Lo único
que pido es que el cambio se coordine, porque los comparte el backend, y que `listing.ts`
siga teniendo lo que la tarjeta necesita para leerse "$450 / hora · mínimo 2 h" y
"4,8 · 200 reseñas" (`price.unit`, `price.minimumUnits`, `rating.count`).

Hay dos `TODO(día cero)` marcados en `schemas/auth.ts`: si el refresh viaja en el cuerpo o
en cookie, y si `expiresIn` son segundos o milisegundos. Los resolvemos con Postman
delante antes de que ninguno de los dos siga.

### 2. `apps/mobile/tailwind.config.js` — el tema

Está el cableado y `min-h-touch` de 44 pt. Falta tu paleta semántica con su variante
oscura. Los cuatro colores que hay son de relleno para que la app no salga en blanco.

**El hexadecimal solo vive ahí.** Lo miro en la revisión.

### 3. `apps/mobile/src/presentation/i18n/` — los textos

`initI18n()` ya arranca y detecta el idioma del teléfono. `en.json` y `es.json` tienen las
claves mínimas que usan mis pantallas. Faltan los plurales `_one` / `_other`, la
interpolación y el tipado de claves.

Ojo con una distinción que te va a hacer falta: `deviceLanguage()` devuelve `'es'` (para
i18next) y `deviceLocale()` devuelve `'es-MX'` (para `Intl`). El precio en alemán se
escribe `1.299,90 MX$` aunque los textos estén en inglés.

### 4. Las pantallas

Hay dos andamios míos, marcados en la primera línea del archivo. Existen para poder probar
la sesión y la capa de datos hoy; se borran en tu PR.

| Andamio                                        | Lo sustituyes por                                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `presentation/screens/sign-in-placeholder.tsx` | `sign-in-screen.tsx` y `sign-up-screen.tsx` con React Hook Form + `zodResolver`.                                |
| `presentation/screens/search-placeholder.tsx`  | `search-screen.tsx`: `FlatList` con `getItemLayout`, `ListingCard`, skeleton, cuatro estados, modal de filtros. |

Los archivos de ruta (`src/app/(auth)/sign-in.tsx`, `src/app/(app)/index.tsx`) son de una
línea a propósito: cambias el `export` y ya está. Así no chocamos.

**No toques** `presentation/screens/city-picker-screen.tsx` ni `location-gate.tsx` sin
avisarme: son US-08 y su comportamiento está atado a criterios de aceptación míos. El
acabado visual sí es tuyo, hablémoslo.

## La API que te dejo lista

```ts
// Búsqueda con cursor. Ya trae los cuatro estados distinguibles.
const search = useListingSearch(filters);
search.listings; // Listing[] ya aplanado de todas las páginas
search.isPending; // → tu skeleton con forma de tarjeta
search.isError; // → tu error en lenguaje llano
search.error; // instancia de NetworkError | TimeoutError | HttpError | ContractViolationError
search.refetch; // → tu botón de reintentar
search.fetchNextPage; // → onEndReached
search.hasNextPage;
search.isFetchingNextPage;

// Las categorías del modal de filtros.
const categories = useCategories();

// Distinguir el vacío inicial del vacío por filtro. Son dos estados, no uno.
import { hasActiveFilters, EMPTY_LISTING_FILTERS } from '@cerca/contract';

// Sesión.
const { state, signIn, signUp, signOut } = useSession();
// state: { status: 'restoring' } | { status: 'signed-out' } | { status: 'signed-in', actor }

// Origen de la búsqueda.
const { origin, blocker, isResolving, chooseCity } = useSearchOrigin();
```

Un detalle que te ahorra trabajo con `console.count("ListingCard")`: `useListingSearch`
aplana las páginas con el `select` de TanStack Query, que aplica _structural sharing_. Las
tarjetas que no han cambiado conservan su identidad entre renders, así que con un
`memo` en `ListingCard` y un `keyExtractor` por `id` no deberías ver re-renders al teclear.
Si los ves, dímelo: probablemente el bug es mío.

## Lo que pido en tu PR

Lo mismo que me vas a pedir tú: `./scripts/verify.sh` en verde, y que lo pueda reproducir
con el teléfono en la mano y la lista de [docs/sprint-1.md](docs/sprint-1.md) delante.
