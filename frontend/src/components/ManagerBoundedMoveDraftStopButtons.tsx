type ManagerBoundedMoveDraftStopButtonsProps = {
  jobId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp?: (jobId: string) => void;
  onMoveDown?: (jobId: string) => void;
};

export function ManagerBoundedMoveDraftStopButtons({
  jobId,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: ManagerBoundedMoveDraftStopButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!canMoveUp || !onMoveUp}
        onClick={() => onMoveUp?.(jobId)}
        type="button"
      >
        Up
      </button>
      <button
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!canMoveDown || !onMoveDown}
        onClick={() => onMoveDown?.(jobId)}
        type="button"
      >
        Down
      </button>
    </div>
  );
}
