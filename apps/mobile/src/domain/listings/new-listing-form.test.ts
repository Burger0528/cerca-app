import {
  EMPTY_NEW_LISTING_FORM,
  newListingFormSchema,
  toCreateListingRequest,
} from './new-listing-form';

const LOCATION = { lat: 19.4326, lng: -99.1332 };

const FILLED = {
  ...EMPTY_NEW_LISTING_FORM,
  categoryId: '9fe936ca-e605-4621-ab93-6f66beb028b8',
  title: 'Clases de guitarra',
  description: 'Clases para principiantes en tu casa.',
  amount: '450',
};

function issuePaths(form: typeof FILLED): string[] {
  const result = newListingFormSchema.safeParse(form);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('newListingFormSchema', () => {
  it('asks for an amount on a fixed price', () => {
    expect(issuePaths({ ...FILLED, model: 'fixed', amount: '' })).toContain('amount');
  });

  it('does not ask for an amount on a quote', () => {
    expect(issuePaths({ ...FILLED, model: 'quote', amount: '' })).toEqual([]);
  });

  it('asks for minimum hours only on an hourly price', () => {
    expect(issuePaths({ ...FILLED, model: 'hourly', minimumHours: '0' })).toContain('minimumHours');
    expect(issuePaths({ ...FILLED, model: 'fixed', minimumHours: '0' })).toEqual([]);
  });

  it('rejects a title shorter than the one the server accepts', () => {
    expect(issuePaths({ ...FILLED, title: 'ab' })).toContain('title');
  });
});

describe('toCreateListingRequest', () => {
  it('turns what the provider typed into minor units', () => {
    const request = toCreateListingRequest(
      { ...FILLED, currency: 'MXN', amount: '1299,90' },
      LOCATION,
    );

    expect(request?.pricing).toEqual({
      model: 'fixed',
      price: { amountMinor: 129990, currency: 'MXN' },
    });
  });

  it('does not multiply a currency that has no decimals', () => {
    const request = toCreateListingRequest(
      { ...FILLED, currency: 'COP', amount: '45000' },
      LOCATION,
    );

    expect(request?.pricing).toEqual({
      model: 'fixed',
      price: { amountMinor: 45000, currency: 'COP' },
    });
  });

  it('keeps the minimum hours as a number on an hourly price', () => {
    const request = toCreateListingRequest(
      { ...FILLED, model: 'hourly', currency: 'MXN', amount: '450', minimumHours: '2' },
      LOCATION,
    );

    expect(request?.pricing).toEqual({
      model: 'hourly',
      hourlyRate: { amountMinor: 45000, currency: 'MXN' },
      minimumHours: 2,
    });
  });

  it('leaves a quote without a floor when no amount was typed', () => {
    const request = toCreateListingRequest({ ...FILLED, model: 'quote', amount: '' }, LOCATION);

    expect(request?.pricing).toEqual({ model: 'quote' });
  });

  it('refuses to build a request the server would reject', () => {
    expect(toCreateListingRequest({ ...FILLED, amount: 'gratis' }, LOCATION)).toBeNull();
  });
});
