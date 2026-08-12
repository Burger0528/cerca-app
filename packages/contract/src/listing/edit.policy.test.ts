import { describe, expect, it } from 'vitest';

import type { Actor } from '../actor/actor.ts';

import { canEditListing } from './edit.policy.ts';

const OWNER_ID = 'e3fc3353-cbbf-41bd-8935-0aa5d2b5725b';
const SOMEONE_ELSE = '11111111-1111-4111-8111-111111111111';

const provider: Actor = {
  id: OWNER_ID,
  capacities: ['customer', 'provider'],
  platformRole: 'user',
};

const customer: Actor = { id: OWNER_ID, capacities: ['customer'], platformRole: 'user' };

describe('canEditListing', () => {
  it('lets the owner edit a listing that is still theirs to change', () => {
    for (const status of ['draft', 'published', 'paused'] as const) {
      expect(canEditListing(provider, { ownerId: OWNER_ID, status })).toEqual({ ok: true });
    }
  });

  it('hides the control on someone else’s listing', () => {
    expect(canEditListing(provider, { ownerId: SOMEONE_ELSE, status: 'published' })).toEqual({
      ok: false,
      kind: 'hidden',
      reason: 'not_owner',
    });
  });

  it('hides it from an account that does not sell', () => {
    expect(canEditListing(customer, { ownerId: OWNER_ID, status: 'published' })).toEqual({
      ok: false,
      kind: 'hidden',
      reason: 'no_capacity',
    });
  });

  it('disables it, with a reason, while the listing is out of the owner’s hands', () => {
    expect(canEditListing(provider, { ownerId: OWNER_ID, status: 'under_review' })).toEqual({
      ok: false,
      kind: 'disabled',
      reason: 'under_review',
    });

    expect(canEditListing(provider, { ownerId: OWNER_ID, status: 'removed' })).toEqual({
      ok: false,
      kind: 'disabled',
      reason: 'removed',
    });
  });

  it('checks ownership before status, so another owner never sees a reason', () => {
    expect(canEditListing(provider, { ownerId: SOMEONE_ELSE, status: 'removed' })).toEqual({
      ok: false,
      kind: 'hidden',
      reason: 'not_owner',
    });
  });
});
