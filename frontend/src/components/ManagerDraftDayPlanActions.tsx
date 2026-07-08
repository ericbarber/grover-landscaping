import type { DayPlanMutationResponse } from '../api/dayPlansClient';
import { ManagerDraftDayPlanCard } from './ManagerDraftDayPlanCard';
import { ManagerPublishDayPlanButton } from './ManagerPublishDayPlanButton';

type ManagerDraftDayPlanActionsProps = {
  draftPlan: DayPlanMutationResponse;
  onUpdated: (dayPlan: DayPlanMutationResponse) => void;
  canPublishRoute?: boolean;
  publishDisabledReason?: string | null;
};

export function ManagerDraftDayPlanActions({
  draftPlan,
  onUpdated,
  canPublishRoute,
  publishDisabledReason,
}: ManagerDraftDayPlanActionsProps) {
  return (
    <div className="space-y-3">
      <ManagerDraftDayPlanCard draftPlan={draftPlan} />
      <ManagerPublishDayPlanButton
        draftPlan={draftPlan}
        onPublished={onUpdated}
        canPublishRoute={canPublishRoute}
        disabledReason={publishDisabledReason}
      />
    </div>
  );
}
