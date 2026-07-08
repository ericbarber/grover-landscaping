import {
  countManagerActivityByTone,
  type ManagerActivityItem,
  type ManagerActivityTone,
} from './managerActivity';
import { managerActivityItemCountLabel } from './managerActivityItemCountCopy';
import { managerActivityToneOrder } from './managerActivityToneOrder';

export type ManagerActivityToneSummary = {
  tone: ManagerActivityTone;
  label: string;
  count: number;
  ariaLabel: string;
};

function formatManagerActivityToneLabel(tone: ManagerActivityTone): string {
  return `${tone.charAt(0).toUpperCase()}${tone.slice(1)}`;
}

export function getManagerActivityToneSummary(
  items: ManagerActivityItem[],
  tone: ManagerActivityTone,
): ManagerActivityToneSummary {
  const label = formatManagerActivityToneLabel(tone);
  const count = countManagerActivityByTone(items, tone);

  return {
    tone,
    label,
    count,
    ariaLabel: `${label}: ${managerActivityItemCountLabel(count)}`,
  };
}

export function getManagerActivityToneSummaries(items: ManagerActivityItem[]): ManagerActivityToneSummary[] {
  return managerActivityToneOrder.map((tone) => getManagerActivityToneSummary(items, tone));
}
