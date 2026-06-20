import { useEffect, useMemo, useState } from 'react';
import {
  countManagerActivityBySource,
  countManagerActivityByTone,
  seedManagerActivityItems,
  type ManagerActivityItem,
  type ManagerActivitySource,
  type ManagerActivityTone,
} from '../domain/managerActivity';
import {
  managerActivityFilterSummary,
  managerActivitySourceLabel,
  managerActivityToneLabel,
} from '../domain/managerActivityLabels';

function activityToneClass(tone: ManagerActivityItem['tone']) {
  if (tone === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-900';
  }

  if (tone === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

const activitySources: ManagerActivitySource[] = ['route', 'job', 'photo', 'sync'];
const activityTones: ManagerActivityTone[] = ['warning', 'success', 'info'];
const activitySourceFilterStorageKey = 'grover.managerActivity.sourceFilter';
const activityToneFilterStorageKey = 'grover.managerActivity.toneFilter';

type ActivitySourceFilter = ManagerActivitySource | 'all';
type ActivityToneFilter = ManagerActivityTone | 'all';

type ManagerActivityHistoryPanelProps = {
  items?: ManagerActivityItem[];
};

function readStorageValue(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Browser storage can be unavailable in private or restricted contexts.
  }
}

function readSavedSourceFilter(): ActivitySourceFilter {
  const savedValue = readStorageValue(activitySourceFilterStorageKey);

  if (savedValue === 'all' || activitySources.includes(savedValue as ManagerActivitySource)) {
    return savedValue as ActivitySourceFilter;
  }

  return 'all';
}

function readSavedToneFilter(): ActivityToneFilter {
  const savedValue = readStorageValue(activityToneFilterStorageKey);

  if (savedValue === 'all' || activityTones.includes(savedValue as ManagerActivityTone)) {
    return savedValue as ActivityToneFilter;
  }

  return 'all';
}

export function ManagerActivityHistoryPanel({
  items = seedManagerActivityItems,
}: ManagerActivityHistoryPanelProps) {
  const [sourceFilter, setSourceFilter] = useState<ActivitySourceFilter>(() => readSavedSourceFilter());
  const [toneFilter, setToneFilter] = useState<ActivityToneFilter>(() => readSavedToneFilter());
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
  const activeFilterSummary = managerActivityFilterSummary(sourceFilter, toneFilter);

  useEffect(() => {
    writeStorageValue(activitySourceFilterStorageKey, sourceFilter);
  }, [sourceFilter]);

  useEffect(() => {
    writeStorageValue(activityToneFilterStorageKey, toneFilter);
  }, [toneFilter]);

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
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            {filteredItems.length} of {items.length} shown
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            {warningCount} needs review
          </span>
          <span
            className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800"
            title="Source and tone filters are saved in this browser when storage is available."
          >
            Saved on this device
          </span>
        </div>
      </div>

      <div aria-label="Filter manager activity by source" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {activitySources.map((source) => (
          <button
            key={source}
            aria-pressed={sourceFilter === source}
            className={`rounded-xl border px-3 py-2 text-left transition ${
              sourceFilter === source
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-950 hover:bg-slate-100'
            }`}
            onClick={() => setSourceFilter(sourceFilter === source ? 'all' : source)}
            type="button"
          >
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${sourceFilter === source ? 'text-slate-300' : 'text-slate-500'}`}>
              {managerActivitySourceLabel(source)}
            </p>
            <p className="mt-1 text-lg font-bold">{countManagerActivityBySource(items, source)}</p>
          </button>
        ))}
      </div>

      <div aria-label="Filter manager activity by tone" className="mt-3 flex flex-wrap gap-2">
        {activityTones.map((tone) => (
          <button
            key={tone}
            aria-pressed={toneFilter === tone}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              toneFilter === tone
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setToneFilter(toneFilter === tone ? 'all' : tone)}
            type="button"
          >
            {managerActivityToneLabel(tone)} {countManagerActivityByTone(items, tone)}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="mt-3 text-xs font-medium text-slate-500">
        Showing {filteredItems.length} of {items.length}: {activeFilterSummary}
      </p>

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
        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600" role="status">
            <p className="font-semibold text-slate-800">No activity matches these filters.</p>
            <p className="mt-1">Clear the filters to return to the full manager review queue.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <article key={item.id} className={`rounded-xl border p-3 ${activityToneClass(item.tone)}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
                      {managerActivitySourceLabel(item.source)}
                    </span>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-1 text-sm opacity-90">{item.message}</p>
                </div>
                <p className="shrink-0 text-xs font-medium opacity-70">{item.occurredAt}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
