// Metro en monorepo: por defecto solo mira la carpeta de la app, así que hay que decirle
// dónde vive el workspace o `@cerca/contract` no se resuelve y no se recarga al editarlo.
const path = require('node:path');

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Vigilar todo el monorepo: si Salvador toca el contrato, Fast Refresh se entera.
config.watchFolders = [workspaceRoot];

// 2. Resolver primero en la app y después en la raíz, que es donde npm hoistea.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Una sola copia de cada dependencia. Dos Reacts o dos zods rompen de formas muy feas.
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: './src/global.css' });
