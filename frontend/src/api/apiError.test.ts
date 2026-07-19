import { describe, expect, it } from 'vitest';
import { apiRequestError, ApiRequestError, isApiErrorCode } from './apiError';

describe('API request errors', () => {
  it('preserves structured backend error codes and messages', async () => {
    const error = await apiRequestError(new Response(JSON.stringify({
      error: 'completion_report_notification_preference_blocked',
      message: 'Delivery is disabled.',
    }), {
      status: 409,
      headers: { 'content-type': 'application/json' },
    }));

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.status).toBe(409);
    expect(error.message).toBe('Delivery is disabled.');
    expect(isApiErrorCode(error, 'completion_report_notification_preference_blocked')).toBe(true);
  });

  it('falls back safely for non-JSON failures', async () => {
    const error = await apiRequestError(new Response('upstream failure', { status: 503 }), 'Delivery unavailable.');

    expect(error.code).toBeUndefined();
    expect(error.message).toBe('Delivery unavailable.');
  });
});
