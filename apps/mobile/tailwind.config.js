/**
 * OWNER: Salvador.
 *
 * Jorge deja el cableado (preset de NativeWind, rutas de `content`, el token `min-h-touch`
 * de 44 pt). Salvador pone la paleta semántica: `bg-surface`, `text-status-removed`, etc.
 *
 * Regla del sprint: el hexadecimal solo vive aquí. Ningún `#fff` en un componente.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // TODO(salvador): paleta semántica completa, con su variante oscura.
        // Nada de `blue-500` en los componentes: `bg-surface`, `text-muted`, `border-subtle`.
        surface: '#FFFFFF',
        'surface-raised': '#F5F6F8',
        foreground: '#101418',
        muted: '#5B6572',
        subtle: '#E2E5EA',
        brand: '#208AEF',
        danger: '#C7382B',
        'status-published': '#1B7F4F',
        'status-paused': '#8A6A12',
        'status-removed': '#8A2F27',
      },
      minHeight: {
        // Área táctil mínima de las HIG y de Material. Un botón por debajo de esto se falla en review.
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
