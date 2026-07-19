import { describe, expect, it } from 'vitest';
import {
  assessPhotoQuality,
  photoQualityMessage,
  requiredPhotoEvidence,
} from './photoQuality';

const existingPhoto = {
  status: 'uploaded',
  jobId: 'job-1',
  photoId: 'photo-1',
  photoType: 'before' as const,
  fileName: 'yard.jpg',
  contentType: 'image/jpeg',
  fileSizeBytes: 2048,
  uploadMode: 'local-placeholder',
  uploadUrl: 'local://yard.jpg',
  objectKey: 'local/yard.jpg',
};

describe('photo quality assessment', () => {
  it('accepts a previewable supported image that is not already attached', () => {
    expect(assessPhotoQuality(
      { name: 'new-yard.jpg', type: 'image/jpeg', size: 4096 },
      { imageWidthPx: 1600, imageHeightPx: 1200 },
      [existingPhoto],
    )).toEqual({ accepted: true, issues: [] });
  });

  it('reports unsupported, unpreviewable, small, and duplicate evidence', () => {
    expect(assessPhotoQuality(
      { name: 'yard.pdf', type: 'application/pdf', size: 2048 },
      {},
      [],
    ).issues).toEqual(['unsupported_type', 'not_previewable']);
    expect(assessPhotoQuality(
      { name: 'tiny.jpg', type: 'image/jpeg', size: 1024 },
      { imageWidthPx: 300, imageHeightPx: 300 },
      [],
    ).issues).toEqual(['too_small']);
    expect(assessPhotoQuality(
      { name: 'YARD.JPG', type: 'image/jpeg', size: 2048 },
      { imageWidthPx: 1600, imageHeightPx: 1200 },
      [existingPhoto],
    ).issues).toEqual(['duplicate']);
  });

  it('returns crew-readable guidance without file internals', () => {
    expect(photoQualityMessage({
      accepted: false,
      issues: ['not_previewable', 'duplicate'],
    })).toBe(
      'the image cannot be previewed on this phone; this same file is already attached to the job',
    );
  });

  it('requires captured before and after evidence before job completion', () => {
    expect(requiredPhotoEvidence(0, 0, [])).toEqual({
      ready: false,
      missing: ['before', 'after'],
    });
    expect(requiredPhotoEvidence(0, 0, [
      existingPhoto,
      { ...existingPhoto, photoId: 'photo-2', photoType: 'after' },
    ])).toEqual({ ready: true, missing: [] });
  });
});
