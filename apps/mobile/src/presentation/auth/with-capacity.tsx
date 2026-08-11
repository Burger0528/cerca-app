import type { Capacity } from '@cerca/contract';
import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';

import { useHasCapacity } from './use-can';

export function withCapacity<Props extends object>(
  capacity: Capacity,
  Screen: ComponentType<Props>,
): ComponentType<Props> {
  return function CapacityGuard(props: Props) {
    const allowed = useHasCapacity(capacity);

    if (!allowed) return <Redirect href="/" />;

    return <Screen {...props} />;
  };
}
