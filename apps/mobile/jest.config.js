const expoPreset = require('jest-expo/jest-preset');

/**
 * Se parte del preset de Expo y solo se AÑADE.
 *
 * Sobrescribir `transformIgnorePatterns` a mano deja fuera media docena de paquetes de Expo
 * que sí necesitan pasar por Babel, y el resultado es un `Cannot use import statement
 * outside a module` que no dice de dónde viene.
 *
 * `@cerca/contract` no hace falta añadirlo: es un symlink del workspace y Jest resuelve la
 * ruta real (`packages/contract/…`), que no está bajo `node_modules`.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  ...expoPreset,
  setupFilesAfterEnv: [...(expoPreset.setupFilesAfterEnv ?? []), '<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    ...(expoPreset.moduleNameMapper ?? {}),
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
