import { useEffect, useMemo, useState } from 'react';
import {
  countManagerActivityBySource,
  countManagerActivityByTone,
  countManagerActivityNeedingReview,
  filterManagerActivityItems,
  getLatestManagerActivityTimestamp,
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
  isHistoryPersisted?: boolean;
  onResetHistory?: () => void;
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

function writeStorageValue(key: string, value: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
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
  isHistoryPersisted = true,
  onResetHistory,
}: ManagerActivityHistoryPanelProps) {
  const [sourceFilter, setSourceFilter] = useState<ActivitySourceFilter>(() => readSavedSourceFilter());
  const [toneFilter, setToneFilter] = useState<ActivityToneFilter>(() => readSavedToneFilter());
  const [canSaveFilters, setCanSaveFilters] = useState(true);
  const [isConfirmingHistoryReset, setIsConfirmingHistoryReset] = useState(false);
  const filteredItems = useMemo(
    () => filterManagerActivityItems(items, { source: sourceFilter, tone: toneFilter }),
    [items, sourceFilter, toneFilter],
  );
  const totalReviewCount = countManagerActivityNeedingReview(items);
  const totalRouteReviewCount = countManagerActivityBySource(items, 'route');
  const totalSyncFallbackCount = countManagerActivityBySource(items, 'sync');
  const totalPhotoEvidenceCount = countManagerActivityBySource(items, 'photo');
  const reviewCount = countManagerActivityNeedingReview(filteredItems);
  const activeFilterSummary = managerActivityFilterSummary(sourceFilter, toneFilter);
  const hasActiveFilters = sourceFilter !== 'all' || toneFilter !== 'all';
  const isShowingNeedsReview = sourceFilter === 'all' && toneFilter === 'warning';
  const isShowingRouteReview = sourceFilter === 'route' && toneFilter === 'all';
  const isShowingSyncFallback = sourceFilter === 'sync' && toneFilter === 'all';
  const isShowingPhotoEvidence = sourceFilter === 'photo' && toneFilter === 'all';
  const latestActivityAt = getLatestManagerActivityTimestamp(items);

  useEffect(() => {
    setCanSaveFilters(writeStorageValue(activitySourceFilterStorageKey, sourceFilter));
  }, [sourceFilter]);

  useEffect(() => {
    setCanSaveFilters((current) => writeStorageValue(activityToneFilterStorageKey, toneFilter) && current);
  }, [toneFilter]);

  function resetSavedFilters() {
    const sourceSaved = writeStorageValue(activitySourceFilterStorageKey, 'all');
    const toneSaved = writeStorageValue(activityToneFilterStorageKey, 'all');

    setSourceFilter('all');
    setToneFilter('all');
    setCanSaveFilters(sourceSaved && toneSaved);
  }

  function showNeedsReviewActivity() {
    setSourceFilter('all');
    setToneFilter('warning');
    setIsConfirmingHistoryReset(false);
  }

  function showRouteReviewActivity() {
    setSourceFilter('route');
    setToneFilter('all');
    setIsConfirmingHistoryReset(false);
  }

  function showSyncFallbackActivity() {
    setSourceFilter('sync');
    setToneFilter('all');
    setIsConfirmingHistoryReset(false);
  }

  function showPhotoEvidenceActivity() {
    setSourceFilter('photo');
    setToneFilter('all');
    setIsConfirmingHistoryReset(false);
  }

  function handleResetHistoryClick() {
    if (!onResetHistory) {
      return;
    }

    if (!isConfirmingHistoryReset) {
      setIsConfirmingHistoryReset(true);
      return;
    }

    onResetHistory();
    setIsConfirmingHistoryReset(false);
  }

  const quickFilters = [
    {
      id: 'needs-review',
      isVisible: totalReviewCount > 0,
      isActive: isShowingNeedsReview,
      ariaLabel: 'Show manager activity items that need review',
      activeLabel: 'Showing needs review',
      inactiveLabel: 'Show needs review',
      title: 'Show all warning activity that needs manager review.',
      activeClassName: 'text-amber-700 hover:text-amber-900',
      onClick: showNeedsReviewActivity,
    },
    {
      id: 'route-review',
      isVisible: totalRouteReviewCount > 0,
      isActive: isShowingRouteReview,
      ariaLabel: 'Show manager activity items from route review',
      activeLabel: 'Showing route review',
      inactiveLabel: 'Show route review',
      title: 'Show route planning and route review activity.',
      activeClassName: 'text-violet-700 hover:text-violet-900',
      onClick: showRouteReviewActivity,
    },
    {
      id: 'sync-fallback',
      isVisible: totalSyncFallbackCount > 0,
      isActive: isShowingSyncFallback,
      ariaLabel: 'Show manager activity items from sync fallback',
      activeLabel: 'Showing sync fallback',
      inactiveLabel: 'Show sync fallback',
      title: 'Show local fallback and sync-related activity.',
      activeClassName: 'text-sky-700 hover:text-sky-900',
      onClick: showSyncFallbackActivity,
    },
    {
      id: 'photo-evidence',
      isVisible: totalPhotoEvidenceCount > 0,
      isActive: isShowingPhotoEvidence,
      ariaLabel: 'Show manager activity items from photo evidence',
      activeLabel: 'Showing photo evidence',
      inactiveLabel: 'Show photo evidence',
      title: 'Show photo evidence and completion-report activity.',
      activeClassName: 'text-emerald-700 hover:text-emerald-900',
      onClick: showPhotoEvidenceActivity,
    },
  ];

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
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            Latest {latestActivityAt}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            {reviewCount} needs review
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              canSaveFilters ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}
            title={
              canSaveFilters
                ? 'Source and tone filters are saved in this browser.'
                : 'This browser is blocking local storage, so filters will reset after reload.'
            }
          >
            {canSaveFilters ? 'Filters saved locally' : 'Filters not saved locally'}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              isHistoryPersisted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}
            title={
              isHistoryPersisted
                ? 'Activity history is saved in this browser.'
                : 'This browser is blocking activity history storage, so new history will reset after reload.'
            }
          >
            {isHistoryPersisted ? 'Activity saved locally' : 'Activity not saved locally'}
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

      <p id="manager-activity-quick-filter-help" className="mt-3 text-xs text-slate-500">
        Quick filters jump to targeted activity groups and update the saved source and tone filters.
      </p>

      <div aria-describedby="manager-activity-quick-filter-help" className="mt-2 flex flex-wrap gap-3">
        {quickFilters
          .filter((quickFilter) => quickFilter.isVisible)
          .map((quickFilter) => (
            <button
              key={quickFilter.id}
              aria-label={quickFilter.ariaLabel}
              aria-pressed={quickFilter.isActive}
              className={`text-xs font-semibold underline underline-offset-4 ${
                quickFilter.isActive ? quickFilter.activeClassName : 'text-slate-600 hover:text-slate-950'
              }`}
              onClick={quickFilter.onClick}
              title={quickFilter.title}
              type="button"
            >
              {quickFilter.isActive ? quickFilter.activeLabel : quickFilter.inactiveLabel}
            </button>
          ))}
        {hasActiveFilters ? (
          <button
            aria-label="Reset saved manager activity source and tone filters"
            className="text-xs font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-950"
            onClick={resetSavedFilters}
            type="button"
          >
            Reset saved filters
          </button>
        ) : null}
        {onResetHistory ? (
          <button
            aria-label={
              isConfirmingHistoryReset
                ? 'Confirm resetting manager activity history to the default review queue'
                : 'Reset manager activity history to the default review queue'
            }
            className={`text-xs font-semibold underline underline-offset-4 ${
              isConfirmingHistoryReset ? 'text-amber-700 hover:text-amber-900' : 'text-slate-600 hover:text-slate-950'
            }`}
            onClick={handleResetHistoryClick}
            type="button"
          >
            {isConfirmingHistoryReset ? 'Confirm reset history' : 'Reset activity history'}
          </button>
        ) : null}
        {isConfirmingHistoryReset ? (
          <button
            aria-label="Cancel manager activity history reset"
            className="text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-950"
            onClick={() => setIsConfirmingHistoryReset(false)}
            type="button"
          >
            Cancel reset
          </button>
        ) : null}
      </div>

      {isConfirmingHistoryReset ? (
        <p aria-live="polite" className="mt-2 text-xs font-medium text-amber-700">
          This will replace runtime activity with the default review queue.
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600" role="status">
            <p className="font-semibold text-slate-800">No activity matches these filters.</p>
            <p className="mt-1">Reset saved filters to return to the full manager review queue.</p>
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
