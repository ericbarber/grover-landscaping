export function managerActivityReviewBadgeLabel(count: number): string {
  if (count === 0) {
    return 'Clear';
  }

  return count === 1 ? '1 review' : `${count} reviews`;
}

export function managerActivityReviewAriaLabel(count: number): string {
  if (count === 0) {
    return '0 items need review';
  }

  return count === 1 ? '1 item needs review' : `${count} items need review`;
}
