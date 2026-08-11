/**
 * OWNER: Salvador.
 *
 * El botón. Las variantes se declaran con `cva` en vez de encadenar ternarios en el JSX:
 * así el conjunto de combinaciones válidas está escrito en un sitio y el tipo de `variant`
 * sale solo, sin mantener una unión a mano.
 */
import { type VariantProps, cva } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { cn } from './cn';

const button = cva(
  // `min-h-touch` son los 44 pt de las HIG y de Material. Un botón por debajo se falla en
  // la revisión, así que va en la base y no en una variante donde se pueda olvidar.
  'min-h-touch flex-row items-center justify-center gap-2 rounded-xl px-5',
  {
    variants: {
      variant: {
        primary: 'bg-brand active:opacity-80',
        secondary: 'border border-subtle bg-surface active:bg-surface-raised',
        ghost: 'active:bg-surface-raised',
        danger: 'bg-danger active:opacity-80',
      },
      isDisabled: {
        // Atenuar, no ocultar: el botón sigue donde estaba y no salta la maqueta.
        true: 'opacity-40',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', isDisabled: false },
  },
);

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

export interface ButtonProps extends VariantProps<typeof button> {
  readonly children: ReactNode;
  readonly onPress?: () => void;
  readonly isLoading?: boolean;
  readonly isDisabled?: boolean;
  readonly className?: string;
  readonly accessibilityLabel?: string;
}

export function Button({
  children,
  onPress,
  variant,
  isLoading = false,
  isDisabled = false,
  className,
  accessibilityLabel,
}: ButtonProps) {
  const blocked = isDisabled || isLoading;

  return (
    <Pressable
      className={cn(button({ variant, isDisabled: blocked }), className)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // `accessibilityState` y no solo `disabled`: sin esto, el lector de pantalla anuncia
      // un botón normal y quien lo usa no entiende por qué no pasa nada al pulsarlo.
      accessibilityState={{ disabled: blocked, busy: isLoading }}
      disabled={blocked}
      onPress={onPress}
    >
      {isLoading ? <ActivityIndicator accessibilityElementsHidden /> : null}

      <Text
        className={cn(label({ variant }), 'py-3')}
        numberOfLines={1}
        maxFontSizeMultiplier={1.5}
      >
        {children}
      </Text>
    </Pressable>
  );
}
