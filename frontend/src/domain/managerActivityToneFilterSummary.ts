import { type ManagerActivityItem, type ManagerActivityTone } from './managerActivity';
import { managerActivityItemCountLabel } from './managerActivityItemCountCopy';
import {
  getManagerActivityToneFilterOptions,
  type ManagerActivityToneFilterValue,
} from './managerActivityToneFilterOptions';
import { getManagerActivityToneSummary } from './managerActivityToneSummary';

export type ManagerActivityToneFilterSummary = {
  value: ManagerActivityToneFilterValue;
  label: string;
  count: number;
  ariaLabel: string;
};

export function getManagerActivityToneFilterSummary(
  items: ManagerActivityItem[],
  value: ManagerActivityToneFilterValue,
): ManagerActivityToneFilterSummary {
  if (value === 'all') {
    return {
      value,
      label: 'All tones',
      count: items.length,
      ariaLabel: `All tones: ${managerActivityItemCountLabel(items.length)}`,
    };
  }

  const summary = getManagerActivityToneSummary(items, value as ManagerActivityTone);

  return {
    value,
    label: summary.label,
    count: summary.count,
    ariaLabel: summary.ariaLabel,
  };
}

export function getManagerActivityToneFilterSummaries(items: ManagerActivityItem[]): ManagerActivityToneFilterSummary[] {
  return getManagerActivityToneFilterOptions().map((option) =>
    getManagerActivityToneFilterSummary(items, option.value),
  );
}
