/**
 * OWNER: Salvador.
 
 */
import type { TFunction } from 'i18next';
import { type Control, type FieldValues, type Path, useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

import { isValidationMessageKey } from '../i18n/message-keys';

import { cn } from './cn';

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
  | 'multiline'
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

  const errorMessage = translateFieldError(fieldState.error?.message, t);
  const hasError = errorMessage !== null;

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-muted">{label}</Text>

      <TextInput
        className={cn(
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
