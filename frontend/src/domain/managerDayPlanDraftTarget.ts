export type ManagerDayPlanDraftTargetInput = {
  crewId: string;
  serviceDate: string;
};

export type ManagerDayPlanDraftTarget = ManagerDayPlanDraftTargetInput;

export function normalizeManagerDayPlanDraftTarget(
  target: ManagerDayPlanDraftTargetInput,
): ManagerDayPlanDraftTarget {
  return {
    crewId: target.crewId.trim(),
    serviceDate: target.serviceDate.trim(),
  };
}

export function canCreateManagerDayPlanDraft(target: ManagerDayPlanDraftTargetInput): boolean {
  const normalizedTarget = normalizeManagerDayPlanDraftTarget(target);

  return normalizedTarget.crewId.length > 0 && normalizedTarget.serviceDate.length > 0;
}
