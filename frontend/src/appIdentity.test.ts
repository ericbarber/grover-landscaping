import { describe, expect, it } from 'vitest';
import {
  API_DISPLAY_NAME,
  APP_DISPLAY_NAME,
  APP_TECHNICAL_NAMESPACE,
  FIELD_APP_DISPLAY_NAME,
  appPageTitle,
} from './appIdentity';

describe('application identity', () => {
  it('composes customer-visible labels from one display name', () => {
    expect(FIELD_APP_DISPLAY_NAME).toBe(`${APP_DISPLAY_NAME} Field`);
    expect(API_DISPLAY_NAME).toBe(`${APP_DISPLAY_NAME} API`);
    expect(appPageTitle('Landscaping operations software'))
      .toBe(`Landscaping operations software | ${APP_DISPLAY_NAME}`);
  });

  it('keeps the compatibility namespace explicit', () => {
    expect(APP_TECHNICAL_NAMESPACE).toBe('grover');
  });
});
