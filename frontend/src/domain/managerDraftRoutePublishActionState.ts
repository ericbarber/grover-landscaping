import type { ManagerDraftRoutePlanningMetrics } from './managerDraftRoutePlanningMetrics';
import {
  getManagerDraftRoutePublishButtonState,
  type ManagerDraftRoutePublishButtonState,
} from './managerDraftRoutePublishButtonState';
import {
  getManagerDraftRoutePublishGuardFromMetrics,
  type ManagerDraftRoutePublishGuard,
} from './managerDraftRoutePublishGuard';
import { getManagerDraftRoutePublishMessage } from './managerDraftRoutePublishMessage';

export type ManagerDraftRoutePublishActionState = {
  guard: ManagerDraftRoutePublishGuard;
  button: ManagerDraftRoutePublishButtonState;
  message: string;
};

export function getManagerDraftRoutePublishActionState(
  metrics: ManagerDraftRoutePlanningMetrics,
  isPublishing: boolean,
  hasPublishHandler: boolean,
): ManagerDraftRoutePublishActionState {
  const guard = getManagerDraftRoutePublishGuardFromMetrics(metrics);

  return {
    guard,
    button: getManagerDraftRoutePublishButtonState(guard.canPublish, isPublishing, hasPublishHandler),
    message: getManagerDraftRoutePublishMessage(guard.disabledReason),
  };
}
