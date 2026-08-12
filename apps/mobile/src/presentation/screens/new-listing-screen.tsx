import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NewListingForm } from '../../domain/listings/new-listing-form';
import {
  EMPTY_NEW_LISTING_FORM,
  newListingFormSchema,
  toCreateListingRequest,
} from '../../domain/listings/new-listing-form';
import { coordinatesOf } from '../../domain/location/location';
import { Button } from '../components/button';
import { CategoryStep } from '../components/new-listing/category-step';
import { DetailsStep } from '../components/new-listing/details-step';
import { LocationStep } from '../components/new-listing/location-step';
import { PricingStep } from '../components/new-listing/pricing-step';
import { useCreateListing } from '../hooks/use-create-listing';
import { messageKeyForError } from '../i18n/error-message-key';
import { useSearchOrigin } from '../providers/search-origin-provider';

const STEPS = ['category', 'details', 'pricing', 'location'] as const;

type Step = (typeof STEPS)[number];

const FIELDS_BY_STEP: Readonly<Record<Step, readonly (keyof NewListingForm)[]>> = {
  category: ['categoryId'],
  details: ['title', 'description'],
  pricing: ['amount', 'minimumHours'],
  location: [],
};

export function NewListingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { origin } = useSearchOrigin();
  const create = useCreateListing();
  const [step, setStep] = useState<Step>('category');

  const form = useForm<NewListingForm>({
    resolver: zodResolver(newListingFormSchema),
    defaultValues: EMPTY_NEW_LISTING_FORM,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const stepIndex = STEPS.indexOf(step);
  const isLastStep = stepIndex === STEPS.length - 1;
  const coordinates = coordinatesOf(origin);

  // El paso se guarda por nombre y no por índice: con `noUncheckedIndexedAccess`, indexar el
  // array devuelve `Step | undefined` y el tipo obliga a tratar un paso que no existe.
  const goToStep = (offset: number) => {
    const next = STEPS[stepIndex + offset];
    if (next !== undefined) setStep(next);
  };

  const goNext = async () => {
    if (await form.trigger(FIELDS_BY_STEP[step])) goToStep(1);
  };

  const publish = form.handleSubmit(async (values) => {
    if (coordinates === null) return;

    const request = toCreateListingRequest(values, {
      lat: coordinates.latitude,
      lng: coordinates.longitude,
    });
    if (request === null) return;

    await create.mutateAsync(request);
    router.replace('/my-listings');
  });

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="gap-6 px-6 py-4" keyboardShouldPersistTaps="handled">
          <View className="gap-1">
            <Text className="text-sm font-medium text-muted">
              {t('provider.newListing.step', { current: stepIndex + 1, total: STEPS.length })}
            </Text>
            <Text className="text-3xl font-bold text-foreground">
              {t(`provider.newListing.${step}.heading`)}
            </Text>
          </View>

          {step === 'category' ? <CategoryStep form={form} /> : null}
          {step === 'details' ? <DetailsStep form={form} /> : null}
          {step === 'pricing' ? <PricingStep form={form} /> : null}
          {step === 'location' ? <LocationStep /> : null}

          {create.isError ? (
            <Text className="text-base text-danger" accessibilityLiveRegion="polite">
              {t(messageKeyForError(create.error))}
            </Text>
          ) : null}

          <View className="flex-row gap-3">
            {stepIndex > 0 ? (
              <Button variant="secondary" onPress={() => goToStep(-1)}>
                {t('provider.newListing.back')}
              </Button>
            ) : null}

            {isLastStep ? (
              <Button
                className="flex-1"
                isDisabled={coordinates === null}
                isLoading={form.formState.isSubmitting}
                onPress={() => void publish()}
              >
                {form.formState.isSubmitting
                  ? t('provider.newListing.publishing')
                  : t('provider.newListing.publish')}
              </Button>
            ) : (
              <Button className="flex-1" onPress={() => void goNext()}>
                {t('provider.newListing.next')}
              </Button>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
