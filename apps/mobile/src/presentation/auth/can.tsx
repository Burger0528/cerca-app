import type { Permission } from '@cerca/contract';
import type { ReactNode } from 'react';

import { useCan } from './use-can';

export interface CanProps {
  readonly permission: Permission;
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const allowed = useCan(permission);

  return <>{allowed ? children : fallback}</>;
}
