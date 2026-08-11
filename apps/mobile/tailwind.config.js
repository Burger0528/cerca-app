/**
 * OWNER: Salvador.
 *
 * El mapa de nombre semántico → variable CSS. Los valores viven en `src/global.css`, que
 * es donde cada token tiene su pareja clara y oscura; aquí solo se les pone nombre.
 *
 * Regla del sprint: en un componente no se escribe un color. Ni `#fff`, ni `blue-500`, ni
 * `dark:`. Se escribe `bg-surface`, `text-muted`, `border-subtle`, y el tema decide.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        surface: withOpacity('--color-surface'),
        'surface-raised': withOpacity('--color-surface-raised'),
        'surface-sunken': withOpacity('--color-surface-sunken'),

        foreground: withOpacity('--color-foreground'),
        muted: withOpacity('--color-muted'),
        subtle: withOpacity('--color-subtle'),

        brand: withOpacity('--color-brand'),
        'brand-foreground': withOpacity('--color-brand-foreground'),
        danger: withOpacity('--color-danger'),

        'status-published': withOpacity('--color-status-published'),
        'status-published-surface': withOpacity('--color-status-published-surface'),
        'status-paused': withOpacity('--color-status-paused'),
        'status-paused-surface': withOpacity('--color-status-paused-surface'),
        'status-removed': withOpacity('--color-status-removed'),
        'status-removed-surface': withOpacity('--color-status-removed-surface'),
      },
      minHeight: {
        // Área táctil mínima de las HIG y de Material. Un botón por debajo se falla en review.
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};

/**
 * Envuelve la variable para que la utilidad con opacidad (`bg-surface/60`) siga
 * funcionando: Tailwind sustituye `<alpha-value>` por el número de la clase, y si el color
 * fuese la variable pelada no habría dónde meterlo.
 */
function withOpacity(variable) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}
