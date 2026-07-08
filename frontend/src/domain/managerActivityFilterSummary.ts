import { type ManagerActivityItem, type ManagerActivitySource } from './managerActivity';
import {
  getManagerActivitySourceFilterSummaries,
  type ManagerActivitySourceFilterSummary,
} from './managerActivitySourceFilterSummary';
import {
  getManagerActivityToneFilterSummaries,
  type ManagerActivityToneFilterSummary,
} from './managerActivityToneFilterSummary';

export type ManagerActivityFilterSummary = {
  sourceFilters: ManagerActivitySourceFilterSummary[];
  toneFilters: ManagerActivityToneFilterSummary[];
};

export function getManagerActivityFilterSummary(
  items: ManagerActivityItem[],
  sources: ManagerActivitySource[],
): ManagerActivityFilterSummary {
  return {
    sourceFilters: getManagerActivitySourceFilterSummaries(items, sources),
    toneFilters: getManagerActivityToneFilterSummaries(items),
  };
}
