import { describe, expect, it } from 'vitest';
import {
  FIELD_APP_NAME,
  PRODUCT_API_NAME,
  PRODUCT_NAME,
  productPageTitle,
} from './productBrand';

describe('product brand', () => {
  it('composes customer-visible product labels from one name', () => {
    expect(FIELD_APP_NAME).toBe(`${PRODUCT_NAME} Field`);
    expect(PRODUCT_API_NAME).toBe(`${PRODUCT_NAME} API`);
    expect(productPageTitle('Landscaping operations software'))
      .toBe(`Landscaping operations software | ${PRODUCT_NAME}`);
  });
});
