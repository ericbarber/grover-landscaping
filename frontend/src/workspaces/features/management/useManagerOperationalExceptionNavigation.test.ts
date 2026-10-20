import { describe, expect, it } from 'vitest';
import {
  initialManagerOperationalExceptionNavigationState,
  managerOperationalExceptionNavigationReducer,
} from './useManagerOperationalExceptionNavigation';

describe('manager operational exception navigation', () => {
  it('targets the requested exception and advances its presentation signal', () => {
    expect(managerOperationalExceptionNavigationReducer(
      initialManagerOperationalExceptionNavigationState,
      ' exception-42 ',
    )).toEqual({
      requestedExceptionId: 'exception-42',
      requestedExceptionSignal: 1,
    });
  });

  it('advances the signal when the same exception is requested again', () => {
    const requested = managerOperationalExceptionNavigationReducer(
      initialManagerOperationalExceptionNavigationState,
      'exception-42',
    );

    expect(managerOperationalExceptionNavigationReducer(requested, 'exception-42'))
      .toEqual({
        requestedExceptionId: 'exception-42',
        requestedExceptionSignal: 2,
      });
  });

  it('ignores an empty exception request without discarding current context', () => {
    const requested = managerOperationalExceptionNavigationReducer(
      initialManagerOperationalExceptionNavigationState,
      'exception-42',
    );

    expect(managerOperationalExceptionNavigationReducer(requested, '   '))
      .toBe(requested);
  });
});
