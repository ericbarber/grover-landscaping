import { managerActivityToneOrder } from './managerActivityToneOrder';

export function managerActivityToneOrderSummary(): string {
  return managerActivityToneOrder.join(' > ');
}
