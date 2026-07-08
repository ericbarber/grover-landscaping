import {
  type ManagerActivityFilters,
  type ManagerActivityItem,
  type ManagerActivitySource,
} from './managerActivity';
import {
  getManagerActivityFilterSummary,
  type ManagerActivityFilterSummary,
} from './managerActivityFilterSummary';
import type { ManagerActivitySourceFilterSummary } from './managerActivitySourceFilterSummary';
import type { ManagerActivityToneFilterSummary } from './managerActivityToneFilterSummary';

export type SelectableManagerActivitySourceFilterSummary = ManagerActivitySourceFilterSummary & {
  isActive: boolean;
};

export type SelectableManagerActivityToneFilterSummary = ManagerActivityToneFilterSummary & {
  isActive: boolean;
};

export type SelectableManagerActivityFilterSummary = {
  sourceFilters: SelectableManagerActivitySourceFilterSummary[];
  toneFilters: SelectableManagerActivityToneFilterSummary[];
};

function selectActiveManagerActivityFilters(
  summary: ManagerActivityFilterSummary,
  filters: ManagerActivityFilters,
): SelectableManagerActivityFilterSummary {
  return {
    sourceFilters: summary.sourceFilters.map((sourceFilter) => ({
      ...sourceFilter,
      isActive: sourceFilter.value === filters.source,
    })),
    toneFilters: summary.toneFilters.map((toneFilter) => ({
      ...toneFilter,
      isActive: toneFilter.value === filters.tone,
    })),
  };
}

export function getSelectableManagerActivityFilterSummary(
  items: ManagerActivityItem[],
  sources: ManagerActivitySource[],
  filters: ManagerActivityFilters,
): SelectableManagerActivityFilterSummary {
  return selectActiveManagerActivityFilters(getManagerActivityFilterSummary(items, sources), filters);
}
