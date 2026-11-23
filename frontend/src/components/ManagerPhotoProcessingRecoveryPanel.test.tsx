import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PhotoProcessingHistoryItem } from '../api/client';
import { ManagerPhotoProcessingRecoveryPanel } from './ManagerPhotoProcessingRecoveryPanel';

const failedPreview: PhotoProcessingHistoryItem = {
  id: 'processing-1',
  photoId: 'photo-1',
  jobId: 'job-1',
  organizationId: 'company-1',
  photoType: 'after',
  fileName: 'finished-yard.jpg',
  taskType: 'thumbnail_generation',
  status: 'dead_letter',
  attemptCount: 3,
  availableAt: '2026-10-06T12:00:00.000Z',
  lastAttemptAt: '2026-10-06T11:00:00.000Z',
  completedAt: null,
  resolvedAt: null,
  lastError: 'processor_internal_failure_detail',
  failureReason: 'worker_internal_reason',
  resolutionNote: null,
  createdAt: '2026-10-06T10:00:00.000Z',
  updatedAt: '2026-10-06T11:00:00.000Z',
};

describe('ManagerPhotoProcessingRecoveryPanel', () => {
  it('presents failed preview work without raw processing errors', () => {
    const markup = renderToStaticMarkup(createElement(ManagerPhotoProcessingRecoveryPanel, {
      items: [failedPreview],
      isLoading: false,
      onRefresh: () => undefined,
      onRetry: () => undefined,
      onResolve: () => undefined,
    }));

    expect(markup).toContain('Photo follow-up');
    expect(markup).toContain('Create photo preview');
    expect(markup).toContain('Needs attention');
    expect(markup).toContain('Retry processing');
    expect(markup).toContain('Close issue');
    expect(markup).not.toContain('processor_internal_failure_detail');
    expect(markup).not.toContain('worker_internal_reason');
  });
});
