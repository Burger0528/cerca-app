/**
 * OWNER: Salvador.
 *
 * Campo de texto con etiqueta y mensaje de error, conectado a React Hook Form. Lo usan las
 * pantallas de acceso y registro.
 *
 * Recibe el `control` y no un par `value`/`onChange`: con `useController` la suscripción vive
 * dentro del campo y solo él se re-renderiza al teclear. Con el valor en la pantalla, cada
 * tecla re-renderizaría el formulario entero.
 *
 * Cubre el criterio de `docs/sprint-1.md` de un error por campo al enviar vacío: el mensaje
 * sale del `fieldState` del propio campo, sin que la pantalla recopile nada.
 */
import type { TFunction } from 'i18next';
import { type Control, type FieldValues, type Path, useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

import { isValidationMessageKey } from '../i18n/message-keys';

import { cn } from './cn';

/**
 * El `message` de un error de campo, listo para pintar.
 *
 * Para el compilador es un `string`, pero viene de dos sitios: los schemas de
 * `@cerca/contract`, que por convención escriben claves de i18n, o cualquier otra regla que se
 * añada más adelante. La lista blanca los distingue sin la aserción de tipo que el linter no
 * permite. Lo conocido se traduce; lo demás cae en el genérico, mejor que enseñar
 * `validation.email.invalid` en pantalla.
 */
function translateFieldError(message: string | undefined, t: TFunction): string | null {
  if (message === undefined) return null;
  if (isValidationMessageKey(message)) return t(message);

  return t('errors.unknown');
}

/**
 * Las props de teclado se toman con `Pick` y no extendiendo `TextInputProps` entero: así
 * `value`, `onChangeText` y `onBlur` quedan fuera y nadie puede desconectar el campo del
 * formulario desde la pantalla.
 */
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
  | 'multiline'
> {
  /** El `control` del `useForm` de la pantalla, la vía de acceso al estado del campo. */
  readonly control: Control<TValues>;

  /** `Path<TValues>` lo restringe a rutas reales: un nombre mal escrito no compila. */
  readonly name: Path<TValues>;

  /** Etiqueta visible, ya traducida por la pantalla. */
  readonly label: string;

  /** Ejemplo, ya traducido. Complementa a la etiqueta, no la sustituye: se va al escribir. */
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

  // La clave del schema se traduce aquí, en el borde de la presentación. Es lo que permite que
  // `@cerca/contract` no tenga idioma propio y lo compartan app y backend.
  const errorMessage = translateFieldError(fieldState.error?.message, t);
  const hasError = errorMessage !== null;

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-muted">{label}</Text>

      <TextInput
        className={cn(
          // El color del ejemplo por clase y no con `placeholderTextColor`, que exige un color
          // literal: así sale del token semántico y sigue cambiando con el tema.
          'min-h-touch rounded-xl border px-4 text-base text-foreground placeholder:text-muted',
          // El borde nunca es el único indicio del error: van con él el mensaje de abajo y la
          // etiqueta de accesibilidad.
          hasError ? 'border-danger' : 'border-subtle',
        )}
        placeholder={placeholder}
        // Un `TextInput` que recibe `value: undefined` deja de obedecer a `value` y pasa a
        // guardarse el texto por su cuenta. Desde ese momento, un `reset()` del formulario ya
        // no vacía lo que se ve en pantalla. El `?? ''` es lo que impide ese `undefined`.
        value={field.value ?? ''}
        onChangeText={field.onChange}
        // "blur" es el momento en que el campo deja de estar activo: tocas otro campo o cierras
        // el teclado. React Hook Form no se entera por su cuenta, hay que avisarle, y ese aviso
        // es lo que marca el campo como ya visitado y lanza su validación (`mode: 'onBlur'` en
        // las pantallas). Validar en cada tecla marcaría en rojo un correo a medio escribir.
        onBlur={field.onBlur}
        // El error va también en la etiqueta porque `accessibilityState` de React Native no
        // tiene `invalid`. Sin esto VoiceOver diría solo "Correo" y quien no ve el borde rojo
        // no se entera hasta que falle el envío.
        accessibilityLabel={hasError ? `${label}. ${errorMessage}` : label}
        // Las heredadas al final para que la pantalla ajuste el teclado. `Pick` garantiza que
        // entre ellas no viaja nada que pise el cableado de arriba.
        {...inputProps}
      />

      {hasError ? (
        // `polite` espera a que el lector termine lo que estuviera diciendo; `assertive`
        // interrumpiría a quien ya está escribiendo en el campo siguiente.
        <Text className="text-sm text-danger" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
