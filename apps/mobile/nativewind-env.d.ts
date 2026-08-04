/// <reference types="nativewind/types" />

// El `import '../global.css'` del layout raíz es lo que enciende NativeWind. TypeScript
// no sabe qué es un .css, así que se lo decimos.
declare module '*.css';
