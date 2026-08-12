import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NewListingForm } from '../../domain/listings/new-listing-form';
import {
  EMPTY_NEW_LISTING_FORM,
  newListingFormSchema,
  toNewListingForm,
  toUpdateListingRequest,
} from '../../domain/listings/new-listing-form';
import { Button } from '../components/button';
import { DetailsStep } from '../components/new-listing/details-step';
import { PricingStep } from '../components/new-listing/pricing-step';
import { useListingDetail, useUpdateListing } from '../hooks/use-edit-listing';
import { messageKeyForError } from '../i18n/error-message-key';

export function EditListingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const listing = useListingDetail(id);
  const update = useUpdateListing(id);

  const form = useForm<NewListingForm>({
    resolver: zodResolver(newListingFormSchema),
    defaultValues: EMPTY_NEW_LISTING_FORM,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { reset } = form;
  const loaded = listing.data;

  useEffect(() => {
    if (loaded !== undefined) reset(toNewListingForm(loaded));
  }, [loaded, reset]);

  const save = form.handleSubmit(async (values) => {
    const request = toUpdateListingRequest(values);
    if (request === null) return;

    await update.mutateAsync(request);
    router.back();
  });

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="gap-6 px-6 py-4" keyboardShouldPersistTaps="handled">
          <Text className="text-3xl font-bold text-foreground">
            {t('provider.editListing.title')}
          </Text>

          {listing.isPending ? <ActivityIndicator /> : null}

          {listing.isError ? (
            <View className="gap-4">
              <Text className="text-base text-muted">{t(messageKeyForError(listing.error))}</Text>
              <Button variant="secondary" onPress={() => void listing.refetch()}>
                {t('common.retry')}
              </Button>
            </View>
          ) : null}

          {loaded === undefined ? null : (
            <>
              <DetailsStep form={form} />
              <PricingStep form={form} />

              {update.isError ? (
                <Text className="text-base text-danger" accessibilityLiveRegion="polite">
                  {t(messageKeyForError(update.error))}
                </Text>
              ) : null}

              <View className="flex-row gap-3">
                <Button variant="secondary" onPress={() => router.back()}>
                  {t('common.cancel')}
                </Button>

                <Button
                  className="flex-1"
                  isLoading={form.formState.isSubmitting}
                  onPress={() => void save()}
                >
                  {form.formState.isSubmitting
                    ? t('provider.editListing.saving')
                    : t('provider.editListing.save')}
                </Button>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
