import { useState } from 'react';
import type { DayPlanMutationResponse } from '../api/dayPlansClient';
import { publishDayPlanWithFallback } from '../api/dayPlanPublishingClient';

type ManagerPublishDayPlanButtonProps = {
  draftPlan: DayPlanMutationResponse;
  onPublished: (dayPlan: DayPlanMutationResponse) => void;
};

export function ManagerPublishDayPlanButton({ draftPlan, onPublished }: ManagerPublishDayPlanButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const isPublished = draftPlan.status === 'published';
  const canPublish = draftPlan.persisted && !isPublished;

  function publishDraft() {
    if (!canPublish || isPublishing) {
      return;
    }

    setIsPublishing(true);

    void publishDayPlanWithFallback(draftPlan)
      .then(onPublished)
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
    </div>
  );
}
