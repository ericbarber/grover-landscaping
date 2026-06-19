export type ManagerWorkflowStep = 'create_plan' | 'add_stops' | 'review_route' | 'publish_plan';

export function getManagerNextWorkflowStep(hasDraftPlan: boolean, hasStops: boolean, canPublish: boolean): ManagerWorkflowStep {
  if (!hasDraftPlan) {
    return 'create_plan';
  }

  if (!hasStops) {
    return 'add_stops';
  }

  if (!canPublish) {
    return 'review_route';
  }

  return 'publish_plan';
}
