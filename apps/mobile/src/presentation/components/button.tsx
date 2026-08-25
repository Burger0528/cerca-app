/**
 * OWNER: Salvador.
 *
 * El botón de acción de la app: acceso, registro, búsqueda y el modal de filtros.
 *
 * Las variantes van en `cva` y no en ternarios dentro del JSX: `VariantProps<typeof button>`
 * saca de ahí el tipo de `variant`, así que añadir una no obliga a tocar las props.
 *
 * `isLoading` cubre el criterio de `docs/sprint-1.md`: botón de envío bloqueado mientras la
 * petición está en vuelo.
 */
import { type VariantProps, cva } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { cn } from './cn';
import { Icon } from './icon';
import type { IconName } from './icon';

/** El icono hereda el color de la etiqueta: mismo `label()`, misma variante, un solo sitio. */
const ICON_SIZE = 18;

const button = cva(
  // `min-h-touch` son los 44 pt de área táctil mínima (HIG y Material), definidos en
  // `tailwind.config.js`. Va en la base y no en cada variante: así ninguna combinación de
  // props puede quedar por debajo.
  'min-h-touch flex-row items-center justify-center gap-2 rounded-xl px-5',
  {
    variants: {
      // Tokens semánticos, nunca un color literal. Los valores claro/oscuro viven en
      // `src/global.css`; el tema funciona precisamente por no escribir el color aquí.
      variant: {
        primary: 'bg-brand active:opacity-80',
        secondary: 'border border-subtle bg-surface active:bg-surface-raised',
        ghost: 'active:bg-surface-raised',
        danger: 'bg-danger active:opacity-80',
      },
      isDisabled: {
        // Solo opacidad, sin tocar la caja: pasar de deshabilitado a habilitado no desplaza
        // lo que hay alrededor.
        true: 'opacity-40',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', isDisabled: false },
  },
);

/**
 * Clases de la etiqueta, en su propio `cva` porque cada `cva` da una sola cadena y aquí hay
 * dos elementos. `primary` y `danger` pintan sobre fondo saturado y necesitan el color de
 * contraste; `ghost` no tiene fondo, así que el color de marca lo lleva el texto.
 */
const label = cva('text-base font-semibold', {
  variants: {
    variant: {
      primary: 'text-brand-foreground',
      secondary: 'text-foreground',
      ghost: 'text-brand',
      danger: 'text-brand-foreground',
    },
  },
  defaultVariants: { variant: 'primary' },
});

/** `variant` no está en esta interfaz: la aporta `VariantProps<typeof button>`. */
export interface ButtonProps extends VariantProps<typeof button> {
  /** Texto ya traducido: las claves de i18n se resuelven en la pantalla, que conoce el contexto. */
  readonly children: ReactNode;

  /** Opcional para poder envolver el botón en un `Link` de expo-router con `asChild`. */
  readonly onPress?: () => void;

  /** Petición en vuelo: muestra el indicador y bloquea el pulsado. Se le pasa el `isSubmitting`. */
  readonly isLoading?: boolean;

  /**
   * Bloqueado por otra razón, como un formulario incompleto. Separado de `isLoading` porque
   * solo esa última justifica mostrar el indicador.
   */
  readonly isDisabled?: boolean;

  /** Clases de la pantalla, normalmente de flujo o de anchura. */
  readonly className?: string;

  /** Para cuando el texto visible no basta: un icono o una abreviatura, como la X del modal. */
  readonly accessibilityLabel?: string;

  /**
   * Icono a la izquierda de la etiqueta. Acompaña al texto, nunca lo sustituye: un botón
   * que solo es un símbolo obliga a adivinar, y el lector de pantalla no tiene qué leer.
   */
  readonly icon?: IconName;
}

export function Button({
  children,
  onPress,
  variant,
  isLoading = false,
  isDisabled = false,
  className,
  accessibilityLabel,
  icon,
}: ButtonProps) {
  // Dos entradas distintas para quien llama, un solo estado para el pulsado. Unificarlas cierra
  // el doble envío: sin esto, un segundo toque con la petición en vuelo la manda otra vez.
  const blocked = isDisabled || isLoading;

  return (
    <Pressable
      // El `className` de fuera va el último a propósito: `cn` resuelve los conflictos de
      // Tailwind por el último valor, y así la pantalla puede pisar una clase de la variante.
      className={cn(button({ variant, isDisabled: blocked }), className)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // Va además de `disabled`, no en su lugar: `disabled` corta el pulsado pero no cambia lo
      // que anuncia el lector, que seguiría describiendo un botón operable. `busy` hace lo
      // mismo para la carga.
      accessibilityState={{ disabled: blocked, busy: isLoading }}
      disabled={blocked}
      onPress={onPress}
    >
      {/* Oculto al lector: `busy` ya lo dice, y anunciarlo dos veces retrasa la etiqueta. */}
      {isLoading ? <ActivityIndicator accessibilityElementsHidden /> : null}

      {/* El icono cede el sitio al indicador: los dos a la vez son dos cosas girando. */}
      {icon !== undefined && !isLoading ? (
        <Icon name={icon} size={ICON_SIZE} className={label({ variant })} />
      ) : null}

      <Text
        className={cn(label({ variant }), 'py-3')}
        // Una sola línea: al 200 % del sistema la etiqueta se corta a media palabra. 1,5 crece
        // de verdad y se sigue leyendo entera.
        numberOfLines={1}
        maxFontSizeMultiplier={1.5}
      >
        {children}
      </Text>
    </Pressable>
  );
}
