# Cerca · app móvil

Monorepo del sprint 1. El enunciado completo está en [docs/sprint-1.md](docs/sprint-1.md)
(y el PDF original en [docs/sprint-1.pdf](docs/sprint-1.pdf)).

```
cerca-app/
├── apps/mobile          Expo SDK 57, development build. La app.
├── packages/contract    @cerca/contract. Lo que comparte el backend.
├── scripts/verify.sh    La única puerta a main. Lo mismo que corre en CI.
└── docs/                El enunciado del sprint.
```

## Arrancar

```bash
npm install
cp apps/mobile/.env.example apps/mobile/.env.local   # y pon la IP de tu backend

# Development build, NO Expo Go: a partir del día 2 hay código nativo de terceros
# (expo-secure-store, expo-location) que Expo Go no trae compilado.
npm run -w mobile ios       # o :android — compila e instala la dev build
npm run mobile              # el servidor de Metro, para el día a día
```

`expo run:ios` / `expo run:android` generan las carpetas `ios/` y `android/` la primera
vez. Están en `.gitignore` a propósito: se regeneran desde `app.json` con
`npm run -w mobile prebuild`, y versionarlas es la forma más rápida de que los dos
tengamos configuraciones nativas distintas sin saberlo.

## Solo Android

Decisión de producto: **la app se entrega en Android**. No hay bloque `ios` en `app.json`
ni perfiles de iOS en `eas.json`, y no se mantiene el proyecto de Xcode.

El motivo es práctico: iOS exige una cuenta de Apple Developer de pago y los UDID de cada
iPhone donde se instale, y eso no estaba disponible. Volver a iOS es añadir el bloque `ios`
a `app.json` y regenerar; nada del código de la app cambia.

Si tienes una carpeta `apps/mobile/ios/` de antes, es basura de un prebuild anterior. Está
en `.gitignore` y se puede borrar.

## Instalar una build de QA

`eas.json` tiene tres perfiles: `development` (dev client), `preview` (APK instalable por
enlace) y `production` (bundle para Play). Falta un paso que necesita cuenta:

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli init                 # crea el proyecto y escribe extra.eas.projectId
npx eas-cli env:create --name EXPO_PUBLIC_API_URL --value https://tu-backend/v1
npx eas-cli build --profile preview --platform android   # da el enlace y el QR
```

Dos cosas que hay que saber antes de la primera build:

- **La URL de la API no está en `eas.json` a propósito.** Una IP de red local caduca en
  cuanto cambias de wifi, y committeada engaña. Va como variable de entorno de EAS.
- **`usesCleartextTraffic` está activado** en `app.json`. Sin eso, el APK de preview contra
  un backend `http://` instala, abre y no carga nada, sin error visible. Para producción,
  el backend va en HTTPS y esto se quita.

Las actualizaciones por OTA (`expo-updates`) quedan pendientes: necesitan el `projectId`
que crea `eas init`, así que se instalan después de ese paso.

## Verificar

```bash
./scripts/verify.sh    # format + lint + typecheck + test + auditoría de EXPO_PUBLIC_
```

Es lo que corre en `pre-push` y en CI, el mismo archivo. Ahora mismo tarda ~6 s, con
presupuesto de 60. `pre-commit` solo pasa lint-staged sobre lo tocado.

Nada entra a `main` sin esto en verde.

## La arquitectura, en cuatro líneas

```
src/app            rutas de expo-router + composition root. Ve todo.
src/presentation   React. Ve domain y application. NO ve infrastructure.
src/infrastructure fetch, Keychain, GPS. Ve domain y application.
src/application    casos de uso. Solo ve domain.
src/domain         entidades y puertos. No ve nada. Ni React.
```

No es una convención de buena voluntad: está en
[`eslint.config.mjs`](eslint.config.mjs) como `import/no-restricted-paths`. Un import que
apunte hacia fuera hace fallar el lint y el PR no entra. Se comprueba así:

```bash
echo "import { View } from 'react-native';" > apps/mobile/src/domain/probe.ts
npx eslint apps/mobile/src/domain/probe.ts   # falla, como debe
rm apps/mobile/src/domain/probe.ts
```

`presentation` no puede tocar `infrastructure` porque recibe los puertos ya construidos
desde `src/app/_layout.tsx`, que es el único sitio donde se decide que el almacén seguro
es expo-secure-store. Eso es lo que permite montar una pantalla en un test con gateways
falsos sin tocar nada más.

## Convenciones

- **El código, en inglés**: identificadores, archivos, ramas, commits, tests y claves de
  i18n. Los comentarios y la documentación van en castellano, que es como hablamos.
- **El texto que ve el usuario vive en `en.json` y `es.json`.** Ni una cadena suelta en un
  componente.
- **Ni un `as`.** El tipo lo demuestra el `parse` de un schema de `@cerca/contract`, no lo
  afirma una aserción. La regla está en el linter; `as const` sí está permitido.
- **El hexadecimal solo vive en `tailwind.config.js`.** En los componentes, colores
  semánticos: `bg-surface`, `text-status-removed`.
- **`main` protegida**, sin push directo.
- Si no lo puedes explicar línea a línea, no lo entregas.
