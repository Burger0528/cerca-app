import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { NewListingForm } from '../../../domain/listings/new-listing-form';
import { TextField } from '../text-field';

export function DetailsStep({ form }: { form: UseFormReturn<NewListingForm> }) {
  const { t } = useTranslation();

  return (
    <View className="gap-4">
      <TextField
        control={form.control}
        name="title"
        label={t('provider.newListing.details.title')}
        placeholder={t('provider.newListing.details.titlePlaceholder')}
        returnKeyType="next"
      />

      <TextField
        control={form.control}
        name="description"
        label={t('provider.newListing.details.description')}
        placeholder={t('provider.newListing.details.descriptionPlaceholder')}
        multiline
      />
    </View>
  );
}
