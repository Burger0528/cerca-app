/**
 * OWNER: Salvador. Sustituye a `sign-in-placeholder.tsx`.
 *
 * El schema es el MISMO que valida el backend (`signInRequestSchema` de `@cerca/contract`),
 * no una copia parecida. Si el contrato cambia el mínimo de la contraseña, este formulario
 * se entera al compilar.
 */
import type { SignInRequest } from '@cerca/contract';
import { signInRequestSchema } from '@cerca/contract';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { HttpError } from '../../domain/errors/app-error';
import { Button } from '../components/button';
import { TextField } from '../components/text-field';
import type { FeedbackMessageKey } from '../i18n/message-keys';
import { messageKeyForReason } from '../i18n/message-keys';
import { useSession } from '../providers/session-provider';

export function SignInScreen() {
  const { t } = useTranslation();
  const { signIn } = useSession();
  const [submitError, setSubmitError] = useState<FeedbackMessageKey | null>(null);

  const form = useForm<SignInRequest>({
    resolver: zodResolver(signInRequestSchema),
    defaultValues: { email: '', password: '' },
    // Valida al salir del campo y, a partir de ahí, en cada tecla: así el error aparece
    // cuando ya has terminado de escribir, pero desaparece en cuanto lo corriges.
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = form.handleSubmit(async (credentials) => {
    setSubmitError(null);
    try {
      await signIn(credentials);
    } catch (error) {
      setSubmitError(messageKeyFor(error));
    }
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      // Sin esto, en iOS el teclado tapa el botón de entrar y no hay forma de enviar.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center gap-4 px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-foreground">{t('auth.signIn.title')}</Text>

        <TextField
          control={form.control}
          name="email"
          label={t('auth.fields.email')}
          placeholder={t('auth.fields.emailPlaceholder')}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />

        <TextField
          control={form.control}
          name="password"
          label={t('auth.fields.password')}
          placeholder={t('auth.fields.passwordPlaceholder')}
          autoCapitalize="none"
          autoComplete="current-password"
          secureTextEntry
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
        />

        {submitError === null ? null : (
          <Text className="text-base text-danger" accessibilityLiveRegion="polite">
            {t(submitError)}
          </Text>
        )}

        <Button
          onPress={() => void onSubmit()}
          // Deshabilitado MIENTRAS la petición vuela: es el criterio de aceptación, y evita
          // el doble envío que crea dos sesiones.
          isLoading={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
        </Button>

        <Link href="/sign-up" asChild>
          <View className="items-center">
            <Text className="min-h-touch py-3 text-base font-semibold text-brand">
              {t('auth.signIn.toSignUp')}
            </Text>
          </View>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * El error del servidor, traducido por su `reason`, nunca por su prosa.
 *
 * `detail` de un problem+json es texto del backend en un idioma que no controlamos; el
 * `reason` es un código estable que sí podemos traducir.
 */
function messageKeyFor(error: unknown): FeedbackMessageKey {
  if (error instanceof HttpError) {
    // El 401 de un login no es "no autorizado", es "esas credenciales no valen". El usuario
    // necesita saber que puede volver a intentarlo, no que hay un problema de permisos.
    if (error.status === 401) return 'auth.errors.invalidCredentials';
    if (error.status >= 500) return 'errors.server';

    return messageKeyForReason(error.reason);
  }
  return 'errors.network';
}
