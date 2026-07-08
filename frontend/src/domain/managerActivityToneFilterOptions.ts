import { managerActivityToneOrder } from './managerActivityToneOrder';

export type ManagerActivityToneFilterValue = (typeof managerActivityToneOrder)[number] | 'all';

export type ManagerActivityToneFilterOption = {
  value: ManagerActivityToneFilterValue;
  label: string;
};

function formatManagerActivityToneLabel(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function getManagerActivityToneFilterOptions(): ManagerActivityToneFilterOption[] {
  return [
    { value: 'all', label: 'All tones' },
    ...managerActivityToneOrder.map((tone) => ({
      value: tone,
      label: formatManagerActivityToneLabel(tone),
    })),
  ];
}
