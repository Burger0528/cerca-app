import type { UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import type { NewListingForm } from '../../../domain/listings/new-listing-form';
import { useCategories } from '../../hooks/use-categories';
import { Chip } from '../chip';

export function CategoryStep({ form }: { form: UseFormReturn<NewListingForm> }) {
  const { t } = useTranslation();
  const categories = useCategories();
  const selected = useWatch({ control: form.control, name: 'categoryId' });

  return (
    <View className="gap-3">
      <Text className="text-sm font-medium text-muted">
        {t('provider.newListing.category.label')}
      </Text>

      {categories.isPending ? <ActivityIndicator /> : null}

      <View className="flex-row flex-wrap gap-2">
        {(categories.data ?? []).map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            isSelected={selected === category.id}
            onPress={() => form.setValue('categoryId', category.id, { shouldValidate: true })}
          />
        ))}
      </View>
    </View>
  );
}
