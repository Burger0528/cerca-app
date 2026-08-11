/**
 * OWNER: Salvador.
 *
 * Registro. Mismo patrón que `sign-in-screen`, con un campo más y el mínimo de contraseña
 * que impone `signUpRequestSchema`.
 */
import type { SignUpRequest } from '@cerca/contract';
import { signUpRequestSchema } from '@cerca/contract';
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

export function SignUpScreen() {
  const { t } = useTranslation();
  const { signUp } = useSession();
  const [submitError, setSubmitError] = useState<FeedbackMessageKey | null>(null);

  const form = useForm<SignUpRequest>({
    resolver: zodResolver(signUpRequestSchema),
    defaultValues: { displayName: '', email: '', password: '' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = form.handleSubmit(async (request) => {
    setSubmitError(null);
    try {
      await signUp(request);
    } catch (error) {
      setSubmitError(messageKeyFor(error));
    }
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center gap-4 px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-foreground">{t('auth.signUp.title')}</Text>

        <TextField
          control={form.control}
          name="displayName"
          label={t('auth.fields.displayName')}
          placeholder={t('auth.fields.displayNamePlaceholder')}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />

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
          // `new-password` y no `password`: es lo que hace que el llavero del sistema
          // ofrezca generar una, en vez de intentar rellenar una que no existe.
          autoComplete="new-password"
          secureTextEntry
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
        />

        {submitError === null ? null : (
          <Text className="text-base text-danger" accessibilityLiveRegion="polite">
            {t(submitError)}
          </Text>
        )}

        <Button onPress={() => void onSubmit()} isLoading={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('auth.signUp.submitting') : t('auth.signUp.submit')}
        </Button>

        <Link href="/sign-in" asChild>
          <View className="items-center">
            <Text className="min-h-touch py-3 text-base font-semibold text-brand">
              {t('auth.signUp.toSignIn')}
            </Text>
          </View>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function messageKeyFor(error: unknown): FeedbackMessageKey {
  if (error instanceof HttpError) {
    // 409: el correo ya existe. Merece su propio mensaje, no un "algo ha ido mal".
    if (error.status === 409) return 'auth.errors.emailTaken';
    if (error.status >= 500) return 'errors.server';

    return messageKeyForReason(error.reason);
  }
  return 'errors.network';
}
