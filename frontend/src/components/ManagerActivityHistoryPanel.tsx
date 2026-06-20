import { useMemo, useState } from 'react';
import {
  countManagerActivityBySource,
  countManagerActivityByTone,
  seedManagerActivityItems,
  type ManagerActivityItem,
  type ManagerActivitySource,
  type ManagerActivityTone,
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

function sourceLabel(source: ManagerActivitySource) {
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

function toneLabel(tone: ManagerActivityTone) {
  if (tone === 'warning') {
    return 'Warning';
  }

  if (tone === 'success') {
    return 'Success';
  }

  return 'Info';
}

const activitySources: ManagerActivitySource[] = ['route', 'job', 'photo', 'sync'];
const activityTones: ManagerActivityTone[] = ['warning', 'success', 'info'];
type ActivitySourceFilter = ManagerActivitySource | 'all';
type ActivityToneFilter = ManagerActivityTone | 'all';

type ManagerActivityHistoryPanelProps = {
  items?: ManagerActivityItem[];
};

export function ManagerActivityHistoryPanel({
  items = seedManagerActivityItems,
}: ManagerActivityHistoryPanelProps) {
  const [sourceFilter, setSourceFilter] = useState<ActivitySourceFilter>('all');
  const [toneFilter, setToneFilter] = useState<ActivityToneFilter>('all');
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
        const matchesTone = toneFilter === 'all' || item.tone === toneFilter;

        return matchesSource && matchesTone;
      }),
    [items, sourceFilter, toneFilter],
  );
  const warningCount = countManagerActivityByTone(filteredItems, 'warning');

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

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {activitySources.map((source) => (
          <button
            key={source}
            className={`rounded-xl border px-3 py-2 text-left transition ${
              sourceFilter === source
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-950 hover:bg-slate-100'
            }`}
            onClick={() => setSourceFilter(sourceFilter === source ? 'all' : source)}
            type="button"
          >
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${sourceFilter === source ? 'text-slate-300' : 'text-slate-500'}`}>
              {sourceLabel(source)}
            </p>
            <p className="mt-1 text-lg font-bold">{countManagerActivityBySource(items, source)}</p>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {activityTones.map((tone) => (
          <button
            key={tone}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              toneFilter === tone
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setToneFilter(toneFilter === tone ? 'all' : tone)}
            type="button"
          >
            {toneLabel(tone)} {countManagerActivityByTone(items, tone)}
          </button>
        ))}
      </div>

      {sourceFilter !== 'all' || toneFilter !== 'all' ? (
        <button
          className="mt-3 text-xs font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-950"
          onClick={() => {
            setSourceFilter('all');
            setToneFilter('all');
          }}
          type="button"
        >
          Clear activity filters
        </button>
      ) : null}

      <div className="mt-5 space-y-3">
        {filteredItems.map((item) => (
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
