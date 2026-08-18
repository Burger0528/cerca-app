/**
 * Icono y color de cada estado de reserva, en un solo sitio.
 *
 * Lo usan la fila de la lista y la cabecera del detalle. Si viviera duplicado, un día la
 * lista diría "cancelada" en gris y el detalle en rojo, y el usuario tendría que decidir
 * cuál de las dos pantallas miente.
 *
 * El color NUNCA va solo: siempre acompaña al texto del estado. Un significado que solo
 * viaja en el color no llega a quien no distingue esos dos tonos.
 */
import type { BookingResponse } from '@cerca/contract';

import type { IconName } from './icon';

export interface BookingStatusStyle {
  readonly icon: IconName;
  /** Token semántico, nunca un color literal. */
  readonly color: string;
}

export const BOOKING_STATUS_STYLE: Record<BookingResponse['status'], BookingStatusStyle> = {
  requested: { icon: 'requested', color: 'text-status-paused' },
  accepted: { icon: 'accepted', color: 'text-status-published' },
  completed: { icon: 'completed', color: 'text-status-published' },
  declined: { icon: 'declined', color: 'text-status-removed' },
  cancelled: { icon: 'cancelled', color: 'text-muted' },
};
