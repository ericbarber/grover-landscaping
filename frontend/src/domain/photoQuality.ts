import type {
  CompletePhotoUploadMetadata,
  PhotoUploadTicket,
} from '../api/client';

const SUPPORTED_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);
const MINIMUM_PHOTO_EDGE_PX = 320;
const MINIMUM_PHOTO_PIXELS = 640 * 480;

export type PhotoQualityIssue =
  | 'unsupported_type'
  | 'not_previewable'
  | 'too_small'
  | 'duplicate';

export interface PhotoQualityAssessment {
  accepted: boolean;
  issues: PhotoQualityIssue[];
}

export interface RequiredPhotoEvidence {
  ready: boolean;
  missing: Array<'before' | 'after'>;
}

export function requiredPhotoEvidence(
  beforePhotos: number,
  afterPhotos: number,
  localPhotos: PhotoUploadTicket[],
): RequiredPhotoEvidence {
  const beforeCount = Math.max(
    beforePhotos,
    localPhotos.filter((photo) => photo.photoType === 'before').length,
  );
  const afterCount = Math.max(
    afterPhotos,
    localPhotos.filter((photo) => photo.photoType === 'after').length,
  );
  const missing: RequiredPhotoEvidence['missing'] = [];
  if (beforeCount === 0) missing.push('before');
  if (afterCount === 0) missing.push('after');
  return { ready: missing.length === 0, missing };
}

export function assessPhotoQuality(
  file: Pick<File, 'name' | 'size' | 'type'>,
  metadata: CompletePhotoUploadMetadata,
  existingPhotos: PhotoUploadTicket[],
): PhotoQualityAssessment {
  const issues: PhotoQualityIssue[] = [];
  const contentType = file.type.toLowerCase();
  if (!SUPPORTED_PHOTO_TYPES.has(contentType)) issues.push('unsupported_type');

  const width = metadata.imageWidthPx ?? 0;
  const height = metadata.imageHeightPx ?? 0;
  if (width <= 0 || height <= 0) {
    issues.push('not_previewable');
  } else if (
    Math.min(width, height) < MINIMUM_PHOTO_EDGE_PX
    || width * height < MINIMUM_PHOTO_PIXELS
  ) {
    issues.push('too_small');
  }

  const normalizedName = file.name.trim().toLowerCase();
  if (existingPhotos.some((photo) =>
    photo.fileName.trim().toLowerCase() === normalizedName
    && photo.contentType.toLowerCase() === contentType
    && photo.fileSizeBytes === file.size
  )) {
    issues.push('duplicate');
  }

  return { accepted: issues.length === 0, issues };
}

export function photoQualityMessage(assessment: PhotoQualityAssessment): string {
  const labels: Record<PhotoQualityIssue, string> = {
    unsupported_type: 'choose a JPEG, PNG, GIF, or WebP image',
    not_previewable: 'the image cannot be previewed on this phone',
    too_small: 'the image is too small; use at least 640×480 with no edge below 320 px',
    duplicate: 'this same file is already attached to the job',
  };
  return assessment.issues.map((issue) => labels[issue]).join('; ');
}
