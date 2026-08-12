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

## 1 bis. `GET /me` devuelve los claims del token, no la base de datos · comprobado con el backend delante

Sesión real contra `192.168.0.7:3333`, sprint 2:

| Petición                                   | Respuesta                                |
| ------------------------------------------ | ---------------------------------------- |
| `POST /me/capacities/provider`             | 200 · `capacities: [customer, provider]` |
| `GET /me` acto seguido, con el mismo token | `capacities: [customer]`                 |
| `POST /auth/refresh` y otra vez `GET /me`  | `capacities: [customer, provider]`       |

`/me` refleja el JWT, y las capacidades viajan dentro del JWT. Consecuencias para la app:

- El actor de "hazte proveedor" se lee del **cuerpo del POST**, nunca de un `GET /me` posterior.
- Después hay que **renovar el token**, o el servidor sigue viendo una cuenta sin la capacidad
  y rechaza publicar. Lo hace `becomeProvider()` en `application/session/use-cases.ts`.
- El comentario de `performRefresh` que decía "el actor no cambia al renovar" era falso: al
  renovar es justo cuando cambia.

Lo que habría que pedir al backend: que `/me` lea la fila de la base de datos. Mientras eso no
pase, cualquier cambio de capacidad o de rol de plataforma tarda en verse lo que tarde el
access token en caducar.

## 1 ter. Dos endpoints del enunciado NO EXISTEN en la API · bloquean entregables

Sacado de `/docs-json` del backend, que expone la lista completa: 29 rutas, y entre ellas
no está ninguna de estas dos.

| Ruta del enunciado                        | Realidad | Qué bloquea                              |
| ----------------------------------------- | -------- | ---------------------------------------- |
| `POST /listings/{id}/photos:presign`      | 404      | El paso de fotos de US-03, de Jorge      |
| `POST` y `DELETE /listings/{id}/favorite` | no está  | El favorito optimista de S1, de Salvador |

**Consecuencia para US-03:** el asistente de publicación tiene sus cuatro pasos —categoría,
detalles, precio y zona— pero **no hay paso de fotos**, porque no hay dónde subirlas. El
criterio "las fotos suben" no se puede cumplir sin trabajo del backend. Tampoco sirve de nada
reducir la imagen con `expo-image-manipulator`, así que esa dependencia no se ha añadido.

**Consecuencia para Salvador:** su pieza de mutación optimista con rollback se queda sin el
caso que la iba a demostrar. Hay otro camino: publicar/pausar en "Mis anuncios" ya la usa, y
las acciones de reserva también valen.

Hay que decidirlo con el backend: o aparecen los dos endpoints, o los dos entregables se
declaran fuera de alcance por escrito.

## 1 quater. Lo que sí quedó confirmado con el servidor delante

| Endpoint               | Forma real                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `GET /me/listings`     | `{ items, nextCursor }`, y cada item es el DETALLE completo, no el resumido           |
| `POST /listings`       | Crea con `status: "draft"`; devuelve `listingDetailSchema`                            |
| `POST /listings` body  | `categoryId`, `title` (3–120), `description` (1–4000), `pricing`, `location`          |
| `location`             | `{ lat, lng }` y nada más                                                             |
| `PATCH /listings/{id}` | Solo `title`, `description` y `pricing`. Ni categoría ni ubicación                    |
| Errores de validación  | 422 con `code: VALIDATION_ERROR` y `errors[{ path, message }]`                        |
| Editar lo ajeno        | 403 `LISTING_EDIT_FORBIDDEN` con `reason: not_owner`                                  |
| `GET /reports`         | `{ items, nextCursor }` de `{ id, listingId, reporterId, reason, status, createdAt }` |
| Anuncio retirado       | `GET /listings/{id}` responde **404**, no un anuncio con estado `removed`             |

El último punto es para Salvador: en el detalle, "retirado" y "no existe" son la misma
respuesta del servidor, así que la pantalla no puede distinguirlos.

El backend está en `/Users/usuario/Developer/cerca-api` y su seed
(`apps/api/prisma/seed.ts`) crea `moderator@cerca.app` y `admin@cerca.app`. Sirven para
probar los dos ejes de autorización sin tocar la base de datos.

## 1 quinquies. Las reservas · lo que falta para poder pintarlas bien

`bookingResponseSchema` viaja **plano**: `status` más `requestedAt`, `scheduledFor` y
`completedAt` anulables. Ahí caben estados imposibles —"completada" sin fecha— así que la
app **deshace el aplanado** en el límite y reconstruye la unión discriminada que pide el
enunciado (`packages/contract/src/booking/booking.ts`).

Lo que el servidor no manda, la app no inventa, y por eso su unión es más pobre que la del
enunciado:

| Estado      | El enunciado quiere           | El servidor manda   |
| ----------- | ----------------------------- | ------------------- |
| `accepted`  | `acceptedAt` + `scheduledFor` | solo `scheduledFor` |
| `declined`  | `reason`                      | nada                |
| `cancelled` | `cancelledBy` + `at`          | nada                |

**Y falta lo más visible:** `GET /bookings` devuelve solo `listingId`, sin el título del
anuncio. La lista de reservas **no puede decir qué se reservó** sin una petición por fila.
Hoy enseña estado y fecha. Con `listingTitle` en la respuesta —un join que el servidor ya
tiene— la pantalla diría "Clases de guitarra · aceptada".

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
