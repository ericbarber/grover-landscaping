import type { ManagerTodayQueueItem, ManagerTodayQueueTone } from '../domain/managerTodayQueue';

export type ManagerTodayQueueState = 'loading' | 'ready' | 'unavailable';

const toneStyles: Record<ManagerTodayQueueTone, string> = {
  attention: 'border-rose-200 bg-rose-50 text-rose-950',
  review: 'border-amber-200 bg-amber-50 text-amber-950',
  active: 'border-sky-200 bg-sky-50 text-sky-950',
  planned: 'border-emerald-200 bg-emerald-50 text-emerald-950',
};

function scheduledDateLabel(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function ManagerTodayQueue({
  items,
  onOpenAll,
  onOpenItem,
  state,
}: {
  items: ManagerTodayQueueItem[];
  onOpenAll: () => void;
  onOpenItem: (item: ManagerTodayQueueItem) => void;
  state: ManagerTodayQueueState;
}) {
  const visibleItems = items.slice(0, 4);

  return (
    <section aria-labelledby="manager-today-heading" className="yardfolio-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Today
          </p>
          <h2 className="mt-1 font-display text-2xl font-black text-slate-950" id="manager-today-heading">
            Work that needs your attention
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Open the property, see what changed, and take the next action without searching through tools.
          </p>
        </div>
        <button
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 hover:border-emerald-700 hover:text-emerald-900"
          onClick={onOpenAll}
          type="button"
        >
          Review all jobs
        </button>
      </div>

      {state === 'loading' ? (
        <p aria-live="polite" className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
          Checking today’s jobs and service reports…
        </p>
      ) : state === 'unavailable' ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950" role="alert">
          We couldn’t check today’s work. Try again when job access returns. Nothing is being marked clear or complete.
        </p>
      ) : visibleItems.length === 0 ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950">
          Nothing loaded needs a manager decision right now. Open all jobs to review scheduled work.
        </p>
      ) : (
        <ol className="mt-4 grid gap-3 lg:grid-cols-2">
          {visibleItems.map((item) => (
            <li className={`rounded-xl border p-4 ${toneStyles[item.tone]}`} key={item.jobId}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] opacity-75">
                    {item.statusLabel}
                  </p>
                  <h3 className="mt-1 text-lg font-black">{item.title}</h3>
                </div>
                <span className="rounded-full bg-white/75 px-2.5 py-1 text-xs font-black">
                  {scheduledDateLabel(item.scheduledDate)}
                </span>
              </div>
              <p className="mt-3 text-sm font-black">{item.customerName}</p>
              <p className="mt-0.5 text-sm opacity-80">{item.propertyAddress}</p>
              <p className="mt-3 text-sm leading-6 opacity-85">{item.detail}</p>
              <button
                className="mt-4 min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-black text-white hover:bg-emerald-900"
                onClick={() => onOpenItem(item)}
                type="button"
              >
                Open {item.workflow === 'report' ? 'report' : 'service'}
              </button>
            </li>
          ))}
        </ol>
      )}
      {state === 'ready' && items.length > visibleItems.length ? (
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Showing the first {visibleItems.length} of {items.length} priority services. Open all jobs to see the full workload.
        </p>
      ) : null}
    </section>
  );
}
