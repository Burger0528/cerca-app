/**
 * OWNER: Salvador.
 *
 * Campo de formulario con etiqueta y error, cableado a React Hook Form.
 *
 * Recibe el `control` en vez de un `value`/`onChange` sueltos: con `Controller`, teclear
 * en un campo no vuelve a renderizar el formulario entero, que es la mitad de la razón
 * para usar RHF en móvil.
 */
import type { TFunction } from 'i18next';
import { type Control, type FieldValues, type Path, useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

import { isValidationMessageKey } from '../i18n/message-keys';

import { cn } from './cn';

/**
 * El mensaje de un campo puede venir de un schema nuestro (una clave conocida) o de
 * cualquier otra regla que alguien añada mañana. Lo primero se traduce; lo segundo cae en
 * un mensaje genérico antes que enseñar la clave cruda en pantalla.
 */
function translateFieldError(message: string | undefined, t: TFunction): string | null {
  if (message === undefined) return null;
  if (isValidationMessageKey(message)) return t(message);

  return t('errors.unknown');
}

export interface TextFieldProps<TValues extends FieldValues> extends Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'autoCorrect'
  | 'keyboardType'
  | 'secureTextEntry'
  | 'textContentType'
  | 'returnKeyType'
  | 'onSubmitEditing'
> {
  readonly control: Control<TValues>;
  readonly name: Path<TValues>;
  readonly label: string;
  readonly placeholder?: string;
}

export function TextField<TValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  ...inputProps
}: TextFieldProps<TValues>) {
  const { t } = useTranslation();
  const { field, fieldState } = useController({ control, name });

  /**
   * El mensaje del schema es una CLAVE de i18n (`validation.email.invalid`), no texto.
   * Se traduce aquí, en el borde de la pantalla: si el schema llevara la frase dentro, el
   * formulario solo hablaría un idioma.
   */
  const errorMessage = translateFieldError(fieldState.error?.message, t);
  const hasError = errorMessage !== null;

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-muted">{label}</Text>

      <TextInput
        className={cn(
          // El color del placeholder va por clase y no por `placeholderTextColor`: esa prop
          // pide un color literal, y un literal en un componente es justo lo que el sprint
          // prohíbe. Por clase, el token semántico sigue mandando en los dos temas.
          'min-h-touch rounded-xl border px-4 text-base text-foreground placeholder:text-muted',
          hasError ? 'border-danger' : 'border-subtle',
        )}
        placeholder={placeholder}
        value={field.value ?? ''}
        onChangeText={field.onChange}
        // La validación se dispara al SALIR del campo, no en cada tecla: marcar en rojo un
        // correo a medio escribir es regañar a alguien por no haber terminado de teclear.
        onBlur={field.onBlur}
        // El error entra en la ETIQUETA del campo, no solo en el `Text` de debajo.
        // `accessibilityState` no tiene `invalid` en React Native, así que sin esto VoiceOver
        // lee "Correo" y se queda tan ancho: quien no ve el texto rojo no se entera de que
        // hay algo que corregir hasta que el envío falla.
        accessibilityLabel={hasError ? `${label}. ${errorMessage}` : label}
        {...inputProps}
      />

      {hasError ? (
        <Text className="text-sm text-danger" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
