/**
 * ANDAMIO DE JORGE — Salvador lo sustituye.
 *
 * Existe solo para poder probar la sesión de punta a punta antes de que estén las pantallas
 * de verdad: entrar, cerrar la app, reabrirla y comprobar que sigo dentro.
 *
 * Salvador: crea `sign-in-screen.tsx` con React Hook Form + zodResolver y cambia el import
 * de `src/app/(auth)/sign-in.tsx`. Este archivo se borra en ese PR. Aquí NO hay validación
 * ni diseño a propósito: no merece la pena pulir lo que se va a tirar.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { HttpError } from '../../domain/errors/app-error';
import { useSession } from '../providers/session-provider';

export function SignInPlaceholder() {
  const { t } = useTranslation();
  const { signIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const onSubmit = async () => {
    setIsSubmitting(true);
    setErrorKey(null);
    try {
      await signIn({ email, password });
    } catch (error) {
      // El `reason` del problem+json es lo que se traduce. `detail` es prosa del servidor
      // y no se enseña nunca tal cual.
      setErrorKey(
        error instanceof HttpError ? (error.reason ?? 'errors.unknown') : 'errors.network',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 justify-center gap-3 bg-surface px-6">
      <Text className="text-2xl font-semibold text-foreground">{t('auth.signIn.title')}</Text>

      <TextInput
        className="min-h-touch rounded-xl border border-subtle px-4 text-base text-foreground"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="min-h-touch rounded-xl border border-subtle px-4 text-base text-foreground"
        autoCapitalize="none"
        secureTextEntry
        placeholder="password"
        value={password}
        onChangeText={setPassword}
      />

      {errorKey !== null ? <Text className="text-danger">{t(errorKey)}</Text> : null}

      <Pressable
        className="min-h-touch items-center justify-center rounded-xl bg-brand active:opacity-80"
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={() => void onSubmit()}
      >
        {isSubmitting ? (
          <ActivityIndicator />
        ) : (
          <Text className="py-3 text-base font-semibold text-surface">
            {t('auth.signIn.submit')}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
