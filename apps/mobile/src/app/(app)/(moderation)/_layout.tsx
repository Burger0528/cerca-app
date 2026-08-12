import { Redirect, Stack } from 'expo-router';

import { useCan } from '../../../presentation/auth/use-can';

export default function ModerationLayout() {
  const allowed = useCan('report:resolve');

  if (!allowed) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
