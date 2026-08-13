import { Stack } from 'expo-router';

/**
 * Stack propio para que la pestaña se llame `bookings` y la reseña cuelgue de ella. Sin
 * este layout, `bookings/[id]/review` se convertiría en una pestaña más.
 */
export default function BookingsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
