import type { Actor, Capacity, Permission } from '@cerca/contract';
import { can, has } from '@cerca/contract';

import { useSession } from '../providers/session-provider';

export function useActor(): Actor | null {
  const { state } = useSession();

  return state.status === 'signed-in' ? state.actor : null;
}

export function useCan(permission: Permission): boolean {
  const actor = useActor();

  return actor !== null && can(actor, permission);
}

export function useHasCapacity(capacity: Capacity): boolean {
  const actor = useActor();

  return actor !== null && has(actor, capacity);
}
