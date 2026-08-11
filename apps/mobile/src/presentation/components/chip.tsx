/**
 * OWNER: Salvador.
 *
 * Chip de selección del modal de filtros.
 *
 * Es un botón con estado, no un adorno: lleva `accessibilityRole="radio"` y su `checked`,
 * para que un lector de pantalla anuncie "seleccionado" en vez de leer una palabra suelta
 * sin contexto.
 */
import { cva } from 'class-variance-authority';
import { Text, Pressable } from 'react-native';

import { cn } from './cn';

const chip = cva('min-h-touch justify-center rounded-full border px-4', {
  variants: {
    isSelected: {
      true: 'border-brand bg-brand',
      false: 'border-subtle bg-surface active:bg-surface-raised',
    },
  },
  defaultVariants: { isSelected: false },
});

const chipLabel = cva('text-sm font-medium', {
  variants: {
    isSelected: {
      true: 'text-brand-foreground',
      false: 'text-foreground',
    },
  },
  defaultVariants: { isSelected: false },
});

export interface ChipProps {
  readonly label: string;
  readonly isSelected: boolean;
  readonly onPress: () => void;
  readonly className?: string;
}

export function Chip({ label, isSelected, onPress, className }: ChipProps) {
  return (
    <Pressable
      className={cn(chip({ isSelected }), className)}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
    >
      <Text className={chipLabel({ isSelected })} numberOfLines={1} maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
    </Pressable>
  );
}
