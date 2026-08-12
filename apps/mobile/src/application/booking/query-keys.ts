export const bookingKeys = {
  all: ['bookings'] as const,

  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (role: 'customer' | 'provider') => [...bookingKeys.lists(), role] as const,

  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (bookingId: string) => [...bookingKeys.details(), bookingId] as const,
} as const;
