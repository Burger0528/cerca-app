# Cerca · App móvil · Sprint 1 · Cimientos, contrato y búsqueda

> Transcripción del enunciado. El original firmado está en [sprint-1.pdf](./sprint-1.pdf).
> Jorge y Salvador. Dos semanas.

Al final del sprint la app se instala, alguien inicia sesión, la sesión sobrevive a un reinicio, y se
buscan servicios cerca con filtros, con los cuatro estados cubiertos y sin que se caiga al negar la
ubicación.

## Qué se demuestra al cerrar el sprint

Con el teléfono en la mano: entro, cierro la app, la reabro y sigo dentro. Busco "fontanero" cerca de
mí, los resultados salen ordenados por distancia, hago scroll largo sin tirones, aprieto filtros hasta
que no queda nada y la pantalla me ofrece limpiarlos. Deniego la ubicación en Ajustes y la app me deja
elegir ciudad. El mismo precio se ve bien con el teléfono en español de México, inglés de Estados
Unidos y alemán.

Historias que cierran: **US-01** (sesión persistente), **US-02** (búsqueda con filtros), **US-08** (sin
permiso de ubicación) y la parte de **US-07** que toca a la tarjeta de resultado.

### Día cero, los dos juntos, medio día

Antes de escribir una línea: levantar el backend y pegarle con Postman a `/auth/sign-in`, `/listings` y
`/bookings`. Comparar la forma real de las respuestas con la del enunciado. Si no coinciden, se ajusta
el plan ese día, no en el sprint 3. De esa sesión sale la primera versión de `@cerca/contract`, y los
dos deben salir de ahí sabiendo qué campos vienen, cuáles son opcionales y qué manda el servidor en un 403.

## Reparto

El corte no es por capas. Si uno hace dominio y el otro UI, nadie termina nada solo y todo se bloquea.
Cada uno se lleva piezas completas de arriba a abajo y tocan archivos distintos.

| Bloque   | Jorge                         | Salvador                            |
| -------- | ----------------------------- | ----------------------------------- |
| Base     | Proyecto y arquitectura       | Contrato compartido e i18n          |
| Producto | Sesión y capa de datos        | Autenticación y lista de resultados |
| Nativo   | `expo-location` y degradación | `expo-image` y virtualización       |

### Jorge

- Proyecto con Expo SDK 57 en _development build_, no Expo Go: a partir del día 2 hay código nativo de
  terceros y Expo Go deja de servir. TypeScript en estricto.
- Estructura de carpetas de Clean Architecture (`domain`, `application`, `infrastructure`,
  `presentation`) y la regla de dependencia ejecutable con `import/no-restricted-paths` en ESLint.
- Calidad: ESLint, Prettier, Husky, lint-staged, `scripts/verify.sh` y el mismo archivo corriendo en CI.
  Presupuesto de hooks: pre-commit menos de 5 s, pre-push menos de 60 s.
- Cliente HTTP: cabecera `Authorization: Bearer`, lectura de errores `application/problem+json` con su
  campo `reason`, y paginación por cursor.
- Sesión: `expo-secure-store` para el token, `POST /auth/sign-in`, `/refresh` y `/sign-out`, `GET /me`,
  contexto de sesión con el `Actor`.
- Navegación: grupos `(auth)` y `(app)`, guarda en cada `_layout`, y el estado de carga inicial mientras
  se lee el token para que no parpadee el login.
- Capa de datos: TanStack Query, `listingKeys` jerárquicas, `snapToGrid` para redondear coordenadas
  antes de la clave, hook de búsqueda con cursor, `retry: false` para 401 y 403.
- Gateway de listings y categorías validando con `schema.parse(raw)` en el límite. Ni un `as`.
- `expo-location` con permiso, denegación y selector de ciudad como alternativa.

### Salvador

- Paquete `@cerca/contract`: `Actor`, `Capacity`, `PlatformRole`, las tablas `CAPACITY_PERMISSIONS` y
  `PLATFORM_PERMISSIONS` con la matriz completa del enunciado, y las funciones `has()` y `can()`.
- Dinero: `Money` con `amountMinor` entero, `minorUnitDigits` (JPY 0, MXN 2, KWD 3) y `formatMoney` con
  `Intl.NumberFormat`. Formateo de distancia en kilómetros o millas según locale.
- Schemas de Zod de auth, categoría y anuncio, con mensajes de error como claves de i18n, no como texto.
- i18next con `en.json` y `es.json`: plurales con `_one` y `_other`, interpolación y claves tipadas.
- Pantallas de _sign in_ y _sign up_ con React Hook Form y `zodResolver`.
- `ListingCard` con sus tres niveles de jerarquía: título semibold, precio en su propio nivel
  tipográfico, distancia y valoración atenuadas. Badge de estado con texto, precio con su contexto,
  valoración con su recuento.
- Tema de NativeWind: colores semánticos (`bg-surface`, `text-status-removed`), `min-h-touch` de 44
  puntos, `twMerge` y `cva` para las variantes. El hexadecimal solo vive en el tema.
- Pantalla de búsqueda: `FlatList` virtualizada con `getItemLayout` y `keyExtractor` estable,
  `expo-image` con `cachePolicy: "memory-disk"` y blurhash, skeleton con la forma de las tarjetas, los
  cuatro estados y el modal de filtros.

## Criterios de aceptación · QA antes del PR

El PR lo revisa el otro, con la app corriendo en un teléfono y esta lista en la mano. Si el revisor no
puede reproducir un punto, el PR se devuelve.

### Jorge

- [ ] Cierro la app por completo, la reabro, y sigo dentro sin pasar por login.
- [ ] Borro el token del almacenamiento seguro, abro la app y caigo en login sin que se vea ni un
      fotograma de la pantalla de tabs.
- [ ] Sin sesión, escribo a mano una ruta de `(app)` y me redirige a login.
- [ ] Muevo el mapa unos metros y no se dispara una petición nueva. Se comprueba en la pestaña de red,
      no a ojo.
- [ ] Deniego la ubicación en los Ajustes del sistema, abro la app y me ofrece un selector de ciudad en
      vez de quedarse en blanco.
- [ ] Apago el wifi a mitad de scroll, sale el estado de error con reintento, y el reintento funciona al
      volver la red.
- [ ] Cambio a mano un campo obligatorio de la respuesta del backend y la app falla en el `parse`, con
      un mensaje que dice qué campo, no tres pantallas después.
- [ ] Un 403 no se reintenta tres veces.
- [ ] Meto `import { View } from 'react-native'` dentro de `src/domain/` y el linter falla.
- [ ] Busco `EXPO_PUBLIC_` dentro del bundle compilado y confirmo que no hay ninguna credencial
      sensible.
- [ ] `./scripts/verify.sh` en verde, y en CI también.

### Salvador

- [ ] `formatMoney({ amountMinor: 129990, currency: 'MXN' }, locale)` devuelve `$1,299.90` en `es-MX`,
      `MX$1,299.90` en `en-US` y `1.299,90 MX$` en `de-DE`, con test.
- [ ] Un importe en JPY no se divide entre 100 y uno en KWD se divide entre 1000. Con test.
- [ ] No existe ningún `number` que represente dinero fuera de `Money`. Búsqueda en el repo durante la
      revisión.
- [ ] Test de `can()` con al menos una fila por capacidad y una por rol de plataforma, tomadas de la
      matriz.
- [ ] Una cuenta con las dos capacidades pasa `has(actor, 'customer')` y `has(actor, 'provider')` a la
      vez. No existe ningún campo `role: 'both'`.
- [ ] Enviar el formulario de registro vacío muestra un error por campo, y el botón queda deshabilitado
      mientras la petición vuela.
- [ ] Con 5.000 tarjetas mockeadas, el scroll no baja de 55 FPS en un Android de gama media, medido con
      el monitor de rendimiento. En el emulador no cuenta.
- [ ] La memoria se mantiene estable durante un scroll largo, sin escalera creciente.
- [ ] `console.count("ListingCard")` no se dispara mientras tecleo en el buscador.
- [ ] El índice del array no se usa como `key` en ningún sitio.
- [ ] Los cuatro estados existen y son distintos: skeleton con forma de tarjeta (no un spinner), error
      en lenguaje llano con reintento, vacío inicial con opción de ampliar el radio, y vacío por filtro
      con botón de limpiarlos.
- [ ] El precio se lee "$450 / hora · mínimo 2 h", no "$450". La valoración se lee "4,8 · 200 reseñas",
      con plural correcto en 0, 1 y 2.
- [ ] Un anuncio pausado se distingue por badge con texto, no solo por gris.
- [ ] Ningún `style={{ backgroundColor: '#fff' }}` en componentes. Los colores salen del tema.
- [ ] Pulsar una tarjeta da feedback visible con `active:`.

## Fuera de alcance de este sprint

Publicar anuncios, reservas, reseñas, moderación y la build de preview. Si sobra tiempo, va a
profundidad de lo que ya hay: más estados cubiertos, mejor comportamiento con red mala, accesibilidad de
la tarjeta. No a funciones nuevas.

## Reglas del juego, para los dos

- El código en inglés: identificadores, archivos, ramas, commits, tests y claves de i18n. El texto que ve
  el usuario vive en `en.json` y `es.json`.
- Nada entra a `main` sin `verify.sh` en verde. `main` protegida, sin push directo.
- Si no lo pueden explicar línea a línea, no lo entregan. Hay examen oral aleatorio y una función propia
  que no se sabe explicar cuenta como no entregada, por bien que funcione.
- El contrato no se toca a la ligera: los schemas de `@cerca/contract` los comparte el backend. Cambiar
  una forma se coordina.
- Ninguna comprobación de permiso en el cliente protege nada. La autoridad es el servidor; el cliente la
  refleja.
