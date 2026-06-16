import { describe, expect, it } from 'vitest';
import { getManagerDraftRoutePublishButtonState } from './managerDraftRoutePublishButtonState';

describe('manager draft route publish button state', () => {
  it('enables the button when the route can publish and a handler is available', () => {
    expect(getManagerDraftRoutePublishButtonState(true, false, true)).toEqual({
      isDisabled: false,
      label: 'Publish draft route',
    });
  });

  it('disables the button when the route is blocked', () => {
    expect(getManagerDraftRoutePublishButtonState(false, false, true).isDisabled).toBe(true);
  });

  it('disables the button when no publish handler is available', () => {
    expect(getManagerDraftRoutePublishButtonState(true, false, false).isDisabled).toBe(true);
  });

  it('uses publishing copy while the publish action is running', () => {
    expect(getManagerDraftRoutePublishButtonState(true, true, true)).toEqual({
      isDisabled: true,
      label: 'Publishing draft route...',
    });
  });
});
