import type { CreateListingRequest, GeoPoint, Pricing } from '@cerca/contract';
import {
  LISTING_DESCRIPTION_MAX_LENGTH,
  LISTING_TITLE_MAX_LENGTH,
  LISTING_TITLE_MIN_LENGTH,
  SUPPORTED_CURRENCIES,
  moneyFromMajor,
} from '@cerca/contract';
import { z } from 'zod';

import { assertNever } from '../assert-never';

export const PRICING_MODELS = ['fixed', 'hourly', 'quote'] as const;

export type PricingModel = (typeof PRICING_MODELS)[number];

export const MINIMUM_HOURS_MIN = 1;
export const MINIMUM_HOURS_MAX = 12;

const baseSchema = z.object({
  categoryId: z.string().min(1, { error: 'validation.category.required' }),
  title: z
    .string()
    .trim()
    .min(LISTING_TITLE_MIN_LENGTH, { error: 'validation.title.tooShort' })
    .max(LISTING_TITLE_MAX_LENGTH, { error: 'validation.title.tooLong' }),
  description: z
    .string()
    .trim()
    .min(1, { error: 'validation.description.required' })
    .max(LISTING_DESCRIPTION_MAX_LENGTH, { error: 'validation.description.tooLong' }),
  model: z.enum(PRICING_MODELS),
  currency: z.enum(SUPPORTED_CURRENCIES),
  amount: z.string(),
  minimumHours: z.string(),
});

/**
 * Un solo schema para los cuatro pasos. Lo condicional vive aquí y no en la pantalla: el
 * modelo a presupuesto no pide importe, y solo el modelo por horas pide un mínimo.
 */
export const newListingFormSchema = baseSchema.superRefine((form, ctx) => {
  if (form.model !== 'quote' && moneyFromMajor(form.amount, form.currency) === null) {
    ctx.addIssue({ code: 'custom', path: ['amount'], message: 'validation.amount.invalid' });
  }

  if (form.model === 'hourly' && !isValidMinimumHours(form.minimumHours)) {
    ctx.addIssue({
      code: 'custom',
      path: ['minimumHours'],
      message: 'validation.minimumHours.invalid',
    });
  }
});

export type NewListingForm = z.infer<typeof newListingFormSchema>;

export const EMPTY_NEW_LISTING_FORM: NewListingForm = {
  categoryId: '',
  title: '',
  description: '',
  model: 'fixed',
  currency: 'MXN',
  amount: '',
  minimumHours: '2',
};

function isValidMinimumHours(value: string): boolean {
  const hours = Number(value);
  return Number.isInteger(hours) && hours >= MINIMUM_HOURS_MIN && hours <= MINIMUM_HOURS_MAX;
}

function pricingFrom(form: NewListingForm): Pricing | null {
  const money = moneyFromMajor(form.amount, form.currency);

  switch (form.model) {
    case 'fixed':
      return money === null ? null : { model: 'fixed', price: money };

    case 'hourly':
      return money === null || !isValidMinimumHours(form.minimumHours)
        ? null
        : { model: 'hourly', hourlyRate: money, minimumHours: Number(form.minimumHours) };

    case 'quote':
      return money === null ? { model: 'quote' } : { model: 'quote', startingFrom: money };

    default:
      return assertNever(form.model);
  }
}

export function toCreateListingRequest(
  form: NewListingForm,
  location: GeoPoint,
): CreateListingRequest | null {
  const pricing = pricingFrom(form);
  if (pricing === null) return null;

  return {
    categoryId: form.categoryId,
    title: form.title.trim(),
    description: form.description.trim(),
    pricing,
    location,
  };
}
