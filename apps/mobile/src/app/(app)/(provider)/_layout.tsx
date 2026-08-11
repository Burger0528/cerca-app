import { Stack } from 'expo-router';

import { withCapacity } from '../../../presentation/auth/with-capacity';

function ProviderLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default withCapacity('provider', ProviderLayout);
