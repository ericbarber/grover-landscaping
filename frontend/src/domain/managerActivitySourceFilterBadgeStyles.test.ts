import { describe, expect, it } from 'vitest';
import { managerActivitySourceFilterBadgeClassName } from './managerActivitySourceFilterBadgeStyles';

describe('manager activity source filter badge styles', () => {
  it('uses selected source badge styles first', () => {
    expect(managerActivitySourceFilterBadgeClassName({ isActive: true, needsReviewCount: 3 })).toContain('bg-white/20');
    expect(managerActivitySourceFilterBadgeClassName({ isActive: true, needsReviewCount: 0 })).toContain('text-white');
  });

  it('uses review badge styles for unselected sources with review work', () => {
    expect(managerActivitySourceFilterBadgeClassName({ isActive: false, needsReviewCount: 2 })).toContain('bg-amber-100');
    expect(managerActivitySourceFilterBadgeClassName({ isActive: false, needsReviewCount: 1 })).toContain('text-amber-800');
  });

  it('uses clear badge styles for unselected sources without review work', () => {
    expect(managerActivitySourceFilterBadgeClassName({ isActive: false, needsReviewCount: 0 })).toContain('bg-emerald-100');
  });
});
