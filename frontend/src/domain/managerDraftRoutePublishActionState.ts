import type { DayPlanStop } from './dayPlans';
import type { YardCareJob } from './jobs';
import {
  getManagerDraftRoutePlanningMetrics,
  type ManagerDraftRoutePlanningMetrics,
} from './managerDraftRoutePlanningMetrics';
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

export function getManagerDraftRoutePublishActionStateForDraftRoute(
  jobs: YardCareJob[],
  stops: DayPlanStop[],
  isPublishing: boolean,
  hasPublishHandler: boolean,
): ManagerDraftRoutePublishActionState {
  return getManagerDraftRoutePublishActionState(
    getManagerDraftRoutePlanningMetrics(jobs, stops),
    isPublishing,
    hasPublishHandler,
  );
}
