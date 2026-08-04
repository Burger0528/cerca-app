import path from 'node:path';

import js from '@eslint/js';
import expoConfig from 'eslint-config-expo/flat.js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

const root = import.meta.dirname;
const mobileSrc = path.join(root, 'apps', 'mobile', 'src');
const layer = (name) => path.join(mobileSrc, name);

/**
 * La regla de dependencia de Clean Architecture, ejecutable.
 *
 *   src/app            → routing y composition root. Puede ver todo.
 *   src/presentation   → domain, application. NO infrastructure.
 *   src/infrastructure → domain, application.
 *   src/application    → domain.
 *   src/domain         → nada. Ni siquiera React.
 *
 * Las flechas apuntan siempre hacia dentro. Cada zona prohíbe las que apuntan hacia fuera;
 * si aparece una, el lint falla y el PR no entra. Esto es lo que hace que la arquitectura
 * sea una regla y no un párrafo en el README que nadie relee.
 */
const dependencyRuleZones = [
  {
    target: layer('domain'),
    from: [layer('application'), layer('infrastructure'), layer('presentation'), layer('app')],
    message:
      'domain no depende de nadie. Si necesitas algo de fuera, o ese algo pertenece al dominio, o el dominio no lo necesita.',
  },
  {
    target: layer('application'),
    from: [layer('infrastructure'), layer('presentation'), layer('app')],
    message:
      'application solo mira hacia domain. Para hablar con la red o el disco, define un puerto en domain y que lo implemente infrastructure.',
  },
  {
    target: layer('infrastructure'),
    from: [layer('presentation'), layer('app')],
    message: 'infrastructure no importa pantallas. Los datos suben, la UI no baja.',
  },
  {
    target: layer('presentation'),
    from: [layer('infrastructure')],
    message:
      'presentation no importa infrastructure. El cableado se hace en src/app (composition root) y llega por contexto o por props.',
  },
];

/** Lo que el dominio no puede tocar, por mucho que compile. */
const frameworksBannedInDomain = [
  { group: ['react', 'react/*'], message: 'domain no conoce React.' },
  { group: ['react-native', 'react-native/*'], message: 'domain no conoce React Native.' },
  { group: ['expo', 'expo-*', '@expo/*'], message: 'domain no conoce Expo.' },
  { group: ['@tanstack/*'], message: 'domain no conoce TanStack Query.' },
  { group: ['nativewind', 'i18next', 'react-i18next'], message: 'domain no conoce la UI.' },
];

const importRules = {
  'import/no-restricted-paths': ['error', { zones: dependencyRuleZones }],
  // Ruidosa con librerías cuyo export por defecto es un objeto con métodos (i18next).
  // Lo que de verdad importa —no importar dos veces el mismo módulo— lo cubre
  // `import/no-duplicates`, que sigue encendida.
  'import/no-named-as-default-member': 'off',
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      pathGroups: [{ pattern: '@cerca/**', group: 'internal', position: 'before' }],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
    },
  ],
};

const importResolverSettings = {
  'import/resolver': {
    typescript: {
      alwaysTryTypes: true,
      // Dos tsconfig porque son dos workspaces con reglas distintas. La alternativa
      // (project references) no aporta nada aquí y añade un paso de build.
      noWarnOnMultipleProjects: true,
      project: ['apps/mobile/tsconfig.json', 'packages/contract/tsconfig.json'],
    },
  },
};

/**
 * `eslint-config-expo` ya registra el plugin `import`, y ESLint no deja registrar dos veces
 * el mismo nombre. Por eso su configuración se acota a `apps/mobile` y el plugin se declara
 * a mano solo para lo que queda fuera: sin solape, sin colisión.
 */
const expoForMobile = expoConfig.map((config) =>
  Object.keys(config).length === 1 && config.ignores !== undefined
    ? config
    : { ...config, files: ['apps/mobile/**/*.{js,jsx,ts,tsx}'] },
);

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.expo/**',
      'apps/mobile/ios/**',
      'apps/mobile/android/**',
      'apps/mobile/expo-env.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Reglas transversales del monorepo, sin tocar el plugin `import`.
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // "Ni un `as`". El tipo lo da el `parse` del schema; una aserción lo tira a la basura
      // y convierte un error de contrato en un crash tres pantallas después.
      // `as const` sí: no afirma nada, solo estrecha.
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
      'no-restricted-syntax': [
        'error',
        // `as Algo`, salvo `as const`.
        {
          selector:
            'TSAsExpression[typeAnnotation.type="TSTypeReference"][typeAnnotation.typeName.name!="const"]',
          message:
            'Ni un `as`. Si el tipo no sale solo, valida con un schema de @cerca/contract o estrecha con un type guard.',
        },
        // `as string`, `as number`, `as unknown`, `as Foo[]`… todo lo que no es una referencia.
        {
          selector: 'TSAsExpression[typeAnnotation.type!="TSTypeReference"]',
          message:
            'Ni un `as`. Si el tipo no sale solo, valida con un schema de @cerca/contract o estrecha con un type guard.',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },

  // La app: reglas de Expo / React Native. Registran el plugin `import`.
  ...expoForMobile,

  // La regla de dependencia, encima de la configuración de Expo.
  {
    files: ['apps/mobile/**/*.{js,jsx,ts,tsx}'],
    settings: importResolverSettings,
    rules: importRules,
  },

  // Fuera de la app no hay configuración de Expo, así que el plugin se declara aquí.
  {
    files: ['packages/**/*.{ts,tsx}', 'scripts/**/*.{js,mjs,cjs}', '*.{js,mjs,cjs}'],
    plugins: { import: importPlugin },
    settings: importResolverSettings,
    rules: importRules,
  },

  // El dominio, aislado de los frameworks.
  {
    files: ['apps/mobile/src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: frameworksBannedInDomain }],
    },
  },

  // Los tests pueden mentir un poco: mocks parciales y aserciones puntuales.
  {
    files: ['**/*.test.{ts,tsx}', '**/__mocks__/**', '**/test/**', '**/*.setup.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  },

  // Los ficheros de configuración corren en Node, no en el bundle.
  {
    files: ['**/*.config.{js,mjs,cjs,ts}', 'scripts/**'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },

  // Prettier al final: apaga todo lo que sea formato.
  prettierConfig,
);
