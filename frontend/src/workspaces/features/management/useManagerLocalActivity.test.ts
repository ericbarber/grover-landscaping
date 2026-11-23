import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStoredManagerActivityItems } from '../../../domain/managerActivityLocalStore';
import { createManagerActivityItem } from './useManagerLocalActivity';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('manager local activity coordination', () => {
  it('creates a stable runtime activity record from the supplied time', () => {
    const occurredAt = new Date(2026, 9, 14, 16, 5);

    expect(createManagerActivityItem(
      {
        title: 'Recovery completed',
        message: 'The failed upload was restored.',
        tone: 'success',
        source: 'recovery',
      },
      occurredAt,
    )).toEqual({
      id: `recovery_success_${occurredAt.getTime()}`,
      title: 'Recovery completed',
      message: 'The failed upload was restored.',
      tone: 'success',
      source: 'recovery',
      occurredAt: 'Today 4:05 PM',
    });
  });

  it('restores persisted recovery events after a browser reload', () => {
    const recoveryItem = createManagerActivityItem(
      {
        title: 'Recovery completed',
        message: 'The failed upload was restored.',
        tone: 'success',
        source: 'recovery',
      },
      new Date(2026, 9, 14, 16, 5),
    );
    const getItem = vi.fn(() => JSON.stringify([recoveryItem]));
    vi.stubGlobal('window', {
      localStorage: { getItem },
    });

    expect(readStoredManagerActivityItems()).toEqual([recoveryItem]);
    expect(getItem).toHaveBeenCalled();
  });
});
