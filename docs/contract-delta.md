# Delta de contrato · app ↔ backend

`@cerca/contract` de la app es ahora un **espejo** del contrato de
[cerca-api](https://github.com/xXAreizaXx/cerca-api). Cuando los dos no coincidían, cedió la
app: el servidor es la autoridad.

Este documento es lo que queda: lo que la app **no puede arreglar sola** y lo que se decidió
por el camino. No sale de una sesión de Postman —el día cero no se llegó a hacer— sino de
leer el código de los dos lados.

## Resuelto en la app

|                             | Cómo quedó                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------- |
| Prefijo `/v1` y puerto 3333 | En `EXPO_PUBLIC_API_URL`, no en los gateways. Ver `.env.example`.                       |
| Respuesta de auth plana     | `authResultSchema` = `{ accessToken, refreshToken, actor }`.                            |
| `Actor`                     | `{ id, capacities, platformRole }`, sin nombre ni correo.                               |
| Categoría                   | `{ id, slug, name }`, con `name` ya traducido por el servidor.                          |
| Resultado de búsqueda       | `{ id, title, categoryId, priceFrom, status, ratingAvg, ratingCount, distanceMeters }`. |
| Estados de anuncio          | Los cinco del backend, incluidos `draft` y `under_review`.                              |
| Parámetros de búsqueda      | `query`, `categoryId`, `radiusKm`, `lat`, `lng`, `cursor`, `limit`.                     |
| `Money`                     | `.strict()`, `amountMinor` entero no negativo.                                          |
| `Pricing`                   | La unión `fixed` / `hourly` / `quote`, igual que el backend.                            |

## 1. `expiresIn` · resuelto con un rodeo

El backend no manda cuándo caduca el access token. La app lo saca del claim `exp` del propio
JWT ([access-token.ts](../apps/mobile/src/domain/session/access-token.ts)), con un respaldo
corto de 5 min si el token no se puede leer.

Funciona y está probado, pero **es un rodeo**. Que el servidor mandara `expiresIn: 900` sería
una línea suya y ahorraría a la app un decodificador de base64 escrito a mano. Merece la pena
pedirlo.

## 2. El Actor no trae nombre ni correo

`toActorResponse` devuelve tres campos. La app no puede saludar a nadie por su nombre ni
enseñar el correo en un perfil.

No bloquea el sprint 1 —no hay pantalla de perfil— pero hay que decidirlo antes del 2:
o el backend los expone, o la pantalla de perfil se diseña sin ellos.

## 3. La búsqueda no manda precio completo ni fotos · el más caro

`listingSearchItemSchema` trae `priceFrom: Money | null` y nada más sobre el precio. Sin el
modelo (`hourly`, `fixed`, `quote`) la tarjeta **no puede** escribir `$450 / hora · mínimo 2 h`:
no sabe si esos 450 son la hora, el día o el trabajo entero.

**Consecuencia real:** el criterio de aceptación de US-07 no se cumple como está escrito. La
tarjeta enseña hoy `Desde $450`, que es lo único cierto con este dato.

La lógica completa **ya está escrita y probada** en `pricingLabel`, contra la unión `Pricing`
del contrato. El día que `toSearchItem` incluya `pricing` —una línea en el backend, el dato ya
está en la fila— la tarjeta cambia una llamada y el criterio se cumple tal cual.

Lo mismo con las fotos: sin `images[]`, `expo-image` con `cachePolicy: "memory-disk"` y
blurhash **no tiene nada que pintar**, y es un entregable declarado del sprint. La tarjeta va
hoy sin miniatura.

## 4. Dos filtros no existen en la API

`searchListingsQuerySchema` no acepta `minRating` ni `maxPrice`. Se han quitado del contrato y
del modal: un control que el usuario mueve y no cambia nada es peor que no tenerlo.

El modal ofrece categoría y distancia, que son los dos que el backend sí filtra.

## 5. Las categorías las traduce el servidor

`name` viene ya traducido. Es una decisión del backend y la app la respeta, pero tiene un
coste que conviene tener escrito: el idioma de las categorías depende de lo que el servidor
tenga guardado, no del idioma del teléfono. Un teléfono en inglés puede acabar viendo
"Fontanería".

## 6. Todo lo que entra es `.strict()`

Un campo de más en un body o un parámetro de más en la query **es un 400**, no un campo
ignorado. Por eso `toQueryString` no manda ni uno de sobra. Tenedlo en cuenta al añadir
filtros: hay que tocar los dos lados a la vez.

## El problema de fondo, que sigue ahí

Hay **dos paquetes llamados `@cerca/contract`** con contenidos distintos. Hoy están alineados
porque alguien los alineó a mano, leyendo archivo por archivo. Nada impide que vuelvan a
separarse en el próximo PR del backend, y la app no se enteraría hasta que un `parse` reviente
en un teléfono.

El backend exporta OpenAPI (`apps/api/scripts/export-openapi.ts`). Generar los tipos de la app
desde ahí convierte "se nos ha desincronizado" en un fallo de compilación. Es la conversación
que hay que tener antes del sprint 2.
