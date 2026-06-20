import {
  countManagerActivityByTone,
  seedManagerActivityItems,
  type ManagerActivityItem,
} from '../domain/managerActivity';

function activityToneClass(tone: ManagerActivityItem['tone']) {
  if (tone === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-900';
  }

  if (tone === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function sourceLabel(source: ManagerActivityItem['source']) {
  if (source === 'route') {
    return 'Route';
  }

  if (source === 'job') {
    return 'Job';
  }

  if (source === 'photo') {
    return 'Photo';
  }

  return 'Sync';
}

type ManagerActivityHistoryPanelProps = {
  items?: ManagerActivityItem[];
};

export function ManagerActivityHistoryPanel({
  items = seedManagerActivityItems,
}: ManagerActivityHistoryPanelProps) {
  const warningCount = countManagerActivityByTone(items, 'warning');

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Manager activity</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Review queue</h2>
          <p className="mt-1 text-sm text-slate-600">
            Local activity history for route reviews, completion evidence, and sync fallback events.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
          {warningCount} needs review
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <article key={item.id} className={`rounded-xl border p-3 ${activityToneClass(item.tone)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
                    {sourceLabel(item.source)}
                  </span>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                </div>
                <p className="mt-1 text-sm opacity-90">{item.message}</p>
              </div>
              <p className="shrink-0 text-xs font-medium opacity-70">{item.occurredAt}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
