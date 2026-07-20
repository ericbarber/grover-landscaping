import { useState } from 'react';
import type { DayPlanMutationResponse } from '../api/dayPlansClient';
import { publishDayPlan } from '../api/dayPlanPublishingClient';
import { isApiErrorCode } from '../api/apiError';

type ManagerPublishDayPlanButtonProps = {
  draftPlan: DayPlanMutationResponse;
  onPublished: (dayPlan: DayPlanMutationResponse) => void;
  canPublishRoute?: boolean;
  disabledReason?: string | null;
};

export function ManagerPublishDayPlanButton({
  draftPlan,
  onPublished,
  canPublishRoute = true,
  disabledReason,
}: ManagerPublishDayPlanButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const isPublished = draftPlan.status === 'published';
  const canPublish = draftPlan.persisted && !isPublished && canPublishRoute;

  function publishDraft() {
    if (!canPublish || isPublishing) {
      return;
    }

    setIsPublishing(true);
    setPublishError(null);

    void publishDayPlan(draftPlan.id)
      .then(onPublished)
      .catch((error) => setPublishError(
        isApiErrorCode(error, 'day_plan_publish_not_found')
          ? 'This route draft is no longer available. Refresh scheduling before publishing.'
          : 'Publish failed. Confirm this draft has synced stops and try again before sending the route to crews.',
      ))
      .finally(() => setIsPublishing(false));
  }

  return (
    <div className="space-y-2">
      <button
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!canPublish || isPublishing}
        onClick={publishDraft}
        type="button"
      >
        {isPublishing ? 'Publishing day plan...' : isPublished ? 'Day plan published' : 'Publish day plan'}
      </button>
      {!draftPlan.persisted ? (
        <p className="text-xs font-medium text-amber-700">
          Backend draft required before publishing this route to crews.
        </p>
      ) : null}
      {draftPlan.persisted && !isPublished && !canPublishRoute && disabledReason ? (
        <p className="text-xs font-medium text-amber-700">{disabledReason}</p>
      ) : null}
      {publishError ? <p className="text-xs font-medium text-red-700">{publishError}</p> : null}
    </div>
  );
}
