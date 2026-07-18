import type {
  PhotoErasureDeletionHistoryItem,
  PhotoProcessingStatus,
} from '../api/client';

type Props = {
  items: PhotoErasureDeletionHistoryItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onRetry: (id: string) => void;
  onResolve: (id: string) => void;
};

function statusLabel(status: PhotoProcessingStatus): string {
  if (status === 'dead_letter') return 'Needs attention';
  return status.replace('_', ' ');
}

function statusClassName(status: PhotoProcessingStatus): string {
  if (status === 'completed' || status === 'resolved') return 'bg-emerald-100 text-emerald-800';
  if (status === 'failed' || status === 'dead_letter') return 'bg-rose-100 text-rose-800';
  return 'bg-sky-100 text-sky-800';
}

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function ManagerPhotoErasureRecoveryPanel({
  items,
  isLoading,
  onRefresh,
  onRetry,
  onResolve,
}: Props) {
  const attentionItems = items.filter(
    (item) => item.status === 'failed' || item.status === 'dead_letter',
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Photo privacy</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Erasure deletion recovery</h2>
          <p className="mt-1 text-xs text-slate-500">
            {attentionItems.length > 0
              ? `${attentionItems.length} object deletion${attentionItems.length === 1 ? '' : 's'} need manager attention.`
              : 'No failed object deletions need attention.'}
          </p>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          disabled={isLoading}
          onClick={onRefresh}
          type="button"
        >
          {isLoading ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {attentionItems.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Failed and dead-lettered erasure jobs will appear here.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {attentionItems.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">Account {item.accountId}</p>
                  <p className="mt-1 break-all text-xs text-slate-600">{item.objectKey}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold uppercase ${statusClassName(item.status)}`}>
                  {statusLabel(item.status)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <p>Attempts: {item.attemptCount}</p>
                <p>Last attempt: {formatDate(item.lastAttemptAt)}</p>
                <p>Next available: {formatDate(item.availableAt)}</p>
              </div>
              {item.lastError ? (
                <p className="mt-2 break-words rounded-lg bg-white p-2 text-xs text-rose-700">
                  {item.lastError}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  disabled={isLoading}
                  onClick={() => onRetry(item.id)}
                  type="button"
                >
                  Retry deletion
                </button>
                <button
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  disabled={isLoading}
                  onClick={() => onResolve(item.id)}
                  type="button"
                >
                  Mark resolved
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
