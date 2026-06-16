type ManagerRemoveDraftStopButtonProps = {
  jobId: string;
  onRemoveJob?: (jobId: string) => void;
};

export function ManagerRemoveDraftStopButton({ jobId, onRemoveJob }: ManagerRemoveDraftStopButtonProps) {
  return (
    <button
      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={!onRemoveJob}
      onClick={() => onRemoveJob?.(jobId)}
      type="button"
    >
      Remove
    </button>
  );
}
