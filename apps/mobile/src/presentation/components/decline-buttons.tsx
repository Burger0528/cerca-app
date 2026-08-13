/**
 * OWNER: Salvador.
 *
 * Tres motivos fijos (`declineReasonSchema` del contrato), sin selector genérico: el
 * proveedor elige uno de tres botones, no escribe texto libre.
 */
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from './button';

export type DeclineReason = 'unavailable' | 'not_a_fit' | 'other';

export interface DeclineButtonsProps {
  readonly isBusy: boolean;
  readonly isLoading: boolean;
  readonly onDecline: (reason: DeclineReason) => void;
}

export function DeclineButtons({ isBusy, isLoading, onDecline }: DeclineButtonsProps) {
  const { t } = useTranslation();
  const reasons: readonly DeclineReason[] = ['unavailable', 'not_a_fit', 'other'];

  return (
    <View className="gap-2">
      <Text className="text-sm text-muted">{t('bookings.actions.declineHeading')}</Text>
      {reasons.map((reason) => (
        <Button
          key={reason}
          variant="secondary"
          isLoading={isLoading}
          isDisabled={isBusy}
          onPress={() => onDecline(reason)}
        >
          {t(`bookings.declineReason.${reason}`)}
        </Button>
      ))}
    </View>
  );
}
