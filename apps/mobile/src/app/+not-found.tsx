import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

/**
 * Un deep link roto o una ruta que ya no existe acaban aquí, no en pantalla negra.
 */
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <View className="flex-1 items-center justify-center gap-3 bg-surface px-6">
        <Text className="text-base text-muted">Esta pantalla no existe.</Text>
        <Link href="/" className="min-h-touch text-base font-semibold text-brand">
          Volver al inicio
        </Link>
      </View>
    </>
  );
}
