import { SUPPORTED_CURRENCIES } from '@cerca/contract';
import type { UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { NewListingForm } from '../../../domain/listings/new-listing-form';
import { PRICING_MODELS } from '../../../domain/listings/new-listing-form';
import { Chip } from '../chip';
import { TextField } from '../text-field';

export function PricingStep({ form }: { form: UseFormReturn<NewListingForm> }) {
  const { t } = useTranslation();
  const model = useWatch({ control: form.control, name: 'model' });
  const currency = useWatch({ control: form.control, name: 'currency' });

  // A presupuesto no se pide importe, así que tampoco se conserva el que hubiera escrito
  // antes de cambiar de modelo: se enviaría un suelo que nadie ha decidido poner.
  const selectModel = (next: (typeof PRICING_MODELS)[number]) => {
    form.setValue('model', next, { shouldValidate: true });
    if (next === 'quote') form.setValue('amount', '');
  };

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-sm font-medium text-muted">
          {t('provider.newListing.pricing.model')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {PRICING_MODELS.map((option) => (
            <Chip
              key={option}
              label={t(`provider.newListing.pricing.models.${option}`)}
              isSelected={model === option}
              onPress={() => selectModel(option)}
            />
          ))}
        </View>
      </View>

      {model === 'quote' ? (
        <Text className="text-base text-muted">{t('provider.newListing.pricing.quoteHint')}</Text>
      ) : (
        <>
          <View className="gap-2">
            <Text className="text-sm font-medium text-muted">
              {t('provider.newListing.pricing.currency')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SUPPORTED_CURRENCIES.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  isSelected={currency === option}
                  onPress={() => form.setValue('currency', option, { shouldValidate: true })}
                />
              ))}
            </View>
          </View>

          <TextField
            control={form.control}
            name="amount"
            label={t('provider.newListing.pricing.amount')}
            placeholder="450"
            keyboardType="decimal-pad"
          />
        </>
      )}

      {model === 'hourly' ? (
        <TextField
          control={form.control}
          name="minimumHours"
          label={t('provider.newListing.pricing.minimumHours')}
          keyboardType="number-pad"
        />
      ) : null}
    </View>
  );
}
