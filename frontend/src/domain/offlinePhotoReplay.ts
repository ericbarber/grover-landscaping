import type {
  CompletePhotoUploadMetadata,
  PhotoUploadTicket,
} from '../api/client';
import type { PhotoUploadOfflineMutation } from './offlineMutationQueue';

export class MissingOfflinePhotoBlobError extends Error {
  constructor() {
    super('Queued photo bytes are missing');
    this.name = 'MissingOfflinePhotoBlobError';
  }
}

export interface OfflinePhotoReplayDependencies {
  getBlob: (mutationId: string) => Promise<Blob | null>;
  createTicket: (
    jobId: string,
    file: File,
    photoType: PhotoUploadOfflineMutation['photoType'],
    clientMutationId: string,
  ) => Promise<PhotoUploadTicket>;
  upload: (ticket: PhotoUploadTicket, file: File) => Promise<void>;
  readMetadata: (file: File) => Promise<CompletePhotoUploadMetadata>;
  complete: (
    jobId: string,
    photoId: string,
    metadata: CompletePhotoUploadMetadata,
  ) => Promise<unknown>;
  remove: (mutationId: string) => Promise<void>;
}

export async function replayOfflinePhotoMutation(
  mutation: PhotoUploadOfflineMutation,
  dependencies: OfflinePhotoReplayDependencies,
): Promise<PhotoUploadTicket> {
  const blob = await dependencies.getBlob(mutation.id);
  if (!blob) throw new MissingOfflinePhotoBlobError();

  const file = new File([blob], mutation.fileName, { type: mutation.contentType });
  const ticket = await dependencies.createTicket(
    mutation.jobId,
    file,
    mutation.photoType,
    mutation.id,
  );
  await dependencies.upload(ticket, file);
  const metadata = await dependencies.readMetadata(file);
  await dependencies.complete(mutation.jobId, ticket.photoId, metadata);
  await dependencies.remove(mutation.id);

  return {
    ...ticket,
    status: 'uploaded',
    fileSizeBytes: metadata.fileSizeBytes,
    imageWidthPx: metadata.imageWidthPx,
    imageHeightPx: metadata.imageHeightPx,
    metadataSource: 'client_reported',
  };
}
