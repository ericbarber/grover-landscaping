import type {
  DayPlanAmendmentType,
  ServiceCatalogItem,
  StopProgressStatus,
} from './stopProgress';
import { ApiRequestError } from '../api/apiError';

const DATABASE_NAME = 'grover-field-offline';
const DATABASE_VERSION = 3;
const MUTATION_STORE = 'mutations';
const PHOTO_BLOB_STORE = 'photo_blobs';
export const MAX_OFFLINE_PHOTO_BYTES = 20 * 1024 * 1024;
const OFFLINE_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

type OfflineCrypto = Pick<Crypto, 'getRandomValues'> & Partial<Pick<Crypto, 'randomUUID'>>;

export function createOfflineMutationId(random: OfflineCrypto = crypto): string {
  if (typeof random.randomUUID === 'function') return random.randomUUID();
  const bytes = random.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

interface OfflineMutationBase {
  id: string;
  organizationId: string;
  actorId: string;
  createdAt: string;
  attemptCount: number;
  syncState: 'pending' | 'failed' | 'conflict';
  lastError?: string;
}

export interface StopProgressOfflineMutation extends OfflineMutationBase {
  kind: 'stop_progress';
  dayPlanId: string;
  stopId: string;
  status: StopProgressStatus;
}

export interface JobLifecycleOfflineMutation extends OfflineMutationBase {
  kind: 'job_lifecycle';
  jobId: string;
  action: 'start' | 'complete';
}

export interface ChecklistOfflineMutation extends OfflineMutationBase {
  kind: 'checklist';
  jobId: string;
  checklistItemId: string;
  completed: boolean;
}

export interface PhotoUploadOfflineMutation extends OfflineMutationBase {
  kind: 'photo_upload';
  jobId: string;
  photoType: 'before' | 'after' | 'issue' | 'extra';
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
}

export interface DayPlanAmendmentOfflineMutation extends OfflineMutationBase {
  kind: 'day_plan_amendment';
  dayPlanId: string;
  amendmentType: DayPlanAmendmentType;
  requestedByCrewId: string;
  stopId?: string;
  service?: ServiceCatalogItem;
  note?: string;
}

export type OfflineMutation =
  | StopProgressOfflineMutation
  | JobLifecycleOfflineMutation
  | ChecklistOfflineMutation
  | PhotoUploadOfflineMutation
  | DayPlanAmendmentOfflineMutation;

export interface NewStopProgressOfflineMutation {
  organizationId: string;
  actorId: string;
  dayPlanId: string;
  stopId: string;
  status: StopProgressStatus;
}

export interface NewJobLifecycleOfflineMutation {
  organizationId: string;
  actorId: string;
  jobId: string;
  action: JobLifecycleOfflineMutation['action'];
}

export interface NewChecklistOfflineMutation {
  organizationId: string;
  actorId: string;
  jobId: string;
  checklistItemId: string;
  completed: boolean;
}

export interface NewPhotoUploadOfflineMutation {
  organizationId: string;
  actorId: string;
  jobId: string;
  photoType: PhotoUploadOfflineMutation['photoType'];
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
}

export interface NewDayPlanAmendmentOfflineMutation {
  organizationId: string;
  actorId: string;
  dayPlanId: string;
  amendmentType: DayPlanAmendmentType;
  requestedByCrewId: string;
  stopId?: string;
  service?: ServiceCatalogItem;
  note?: string;
}

export interface OfflineMutationSummary {
  total: number;
  pending: number;
  failed: number;
  conflicts: number;
  oldestCreatedAt: string | null;
  maxAttempts: number;
}

type OfflineStorageManager = Pick<StorageManager, 'persist' | 'persisted'>;
export type OfflineStoragePersistence = 'persisted' | 'browser_managed' | 'unsupported';

export async function requestPersistentOfflineStorage(
  storage: OfflineStorageManager | undefined = typeof navigator === 'undefined'
    ? undefined
    : navigator.storage,
): Promise<OfflineStoragePersistence> {
  if (!storage?.persist || !storage.persisted) return 'unsupported';
  if (await storage.persisted()) return 'persisted';
  return await storage.persist() ? 'persisted' : 'browser_managed';
}

export function summarizeOfflineMutations(
  mutations: OfflineMutation[],
): OfflineMutationSummary {
  return {
    total: mutations.length,
    pending: mutations.filter((mutation) => mutation.syncState === 'pending').length,
    failed: mutations.filter((mutation) => mutation.syncState === 'failed').length,
    conflicts: mutations.filter((mutation) => mutation.syncState === 'conflict').length,
    oldestCreatedAt: mutations.reduce<string | null>(
      (oldest, mutation) => !oldest || mutation.createdAt < oldest ? mutation.createdAt : oldest,
      null,
    ),
    maxAttempts: mutations.reduce(
      (maximum, mutation) => Math.max(maximum, mutation.attemptCount),
      0,
    ),
  };
}

export function createJobLifecycleOfflineMutation(
  input: NewJobLifecycleOfflineMutation,
  id: string = createOfflineMutationId(),
  createdAt = new Date(),
): JobLifecycleOfflineMutation {
  return {
    id,
    kind: 'job_lifecycle',
    organizationId: input.organizationId,
    actorId: input.actorId,
    jobId: input.jobId,
    action: input.action,
    createdAt: createdAt.toISOString(),
    attemptCount: 0,
    syncState: 'pending',
  };
}

export function createChecklistOfflineMutation(
  input: NewChecklistOfflineMutation,
  id: string = createOfflineMutationId(),
  createdAt = new Date(),
): ChecklistOfflineMutation {
  return {
    id,
    kind: 'checklist',
    organizationId: input.organizationId,
    actorId: input.actorId,
    jobId: input.jobId,
    checklistItemId: input.checklistItemId,
    completed: input.completed,
    createdAt: createdAt.toISOString(),
    attemptCount: 0,
    syncState: 'pending',
  };
}

export function createPhotoUploadOfflineMutation(
  input: NewPhotoUploadOfflineMutation,
  id: string = createOfflineMutationId(),
  createdAt = new Date(),
): PhotoUploadOfflineMutation {
  if (!OFFLINE_PHOTO_TYPES.has(input.contentType.toLowerCase())) {
    throw new Error('Offline photos must be JPEG, PNG, GIF, or WebP images.');
  }
  if (input.fileSizeBytes <= 0 || input.fileSizeBytes > MAX_OFFLINE_PHOTO_BYTES) {
    throw new Error('Offline photos must be larger than zero and no more than 20 MiB.');
  }
  return {
    id,
    kind: 'photo_upload',
    organizationId: input.organizationId,
    actorId: input.actorId,
    jobId: input.jobId,
    photoType: input.photoType,
    fileName: input.fileName,
    contentType: input.contentType.toLowerCase(),
    fileSizeBytes: input.fileSizeBytes,
    createdAt: createdAt.toISOString(),
    attemptCount: 0,
    syncState: 'pending',
  };
}

export function createDayPlanAmendmentOfflineMutation(
  input: NewDayPlanAmendmentOfflineMutation,
  id: string = createOfflineMutationId(),
  createdAt = new Date(),
): DayPlanAmendmentOfflineMutation {
  return {
    id,
    kind: 'day_plan_amendment',
    organizationId: input.organizationId,
    actorId: input.actorId,
    dayPlanId: input.dayPlanId,
    amendmentType: input.amendmentType,
    requestedByCrewId: input.requestedByCrewId,
    stopId: input.stopId,
    service: input.service,
    note: input.note,
    createdAt: createdAt.toISOString(),
    attemptCount: 0,
    syncState: 'pending',
  };
}

export function isStopProgressOfflineMutation(
  mutation: OfflineMutation,
): mutation is StopProgressOfflineMutation {
  return mutation.kind === 'stop_progress';
}

export function isJobLifecycleOfflineMutation(
  mutation: OfflineMutation,
): mutation is JobLifecycleOfflineMutation {
  return mutation.kind === 'job_lifecycle';
}

export function isChecklistOfflineMutation(
  mutation: OfflineMutation,
): mutation is ChecklistOfflineMutation {
  return mutation.kind === 'checklist';
}

export function isPhotoUploadOfflineMutation(
  mutation: OfflineMutation,
): mutation is PhotoUploadOfflineMutation {
  return mutation.kind === 'photo_upload';
}

export function isDayPlanAmendmentOfflineMutation(
  mutation: OfflineMutation,
): mutation is DayPlanAmendmentOfflineMutation {
  return mutation.kind === 'day_plan_amendment';
}

export function createStopProgressOfflineMutation(
  input: NewStopProgressOfflineMutation,
  id: string = createOfflineMutationId(),
  createdAt = new Date(),
): StopProgressOfflineMutation {
  return {
    id,
    kind: 'stop_progress',
    organizationId: input.organizationId,
    actorId: input.actorId,
    dayPlanId: input.dayPlanId,
    stopId: input.stopId,
    status: input.status,
    createdAt: createdAt.toISOString(),
    attemptCount: 0,
    syncState: 'pending',
  };
}

function openOfflineDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.objectStoreNames.contains(MUTATION_STORE)
        ? request.transaction!.objectStore(MUTATION_STORE)
        : database.createObjectStore(MUTATION_STORE, { keyPath: 'id' });
      if (!store.indexNames.contains('by_sync_state_and_created_at')) {
        store.createIndex('by_sync_state_and_created_at', ['syncState', 'createdAt']);
      }
      if (!store.indexNames.contains('by_organization_and_created_at')) {
        store.createIndex('by_organization_and_created_at', ['organizationId', 'createdAt']);
      }
      if (!store.indexNames.contains('by_organization_actor_and_created_at')) {
        store.createIndex(
          'by_organization_actor_and_created_at',
          ['organizationId', 'actorId', 'createdAt'],
        );
      }
      if (!database.objectStoreNames.contains(PHOTO_BLOB_STORE)) {
        database.createObjectStore(PHOTO_BLOB_STORE);
      }
    };
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function enqueueStopProgressMutation(
  input: NewStopProgressOfflineMutation,
): Promise<StopProgressOfflineMutation> {
  const mutation = createStopProgressOfflineMutation(input);
  const database = await openOfflineDatabase();
  try {
    const transaction = database.transaction(MUTATION_STORE, 'readwrite');
    transaction.objectStore(MUTATION_STORE).put(mutation);
    await waitForTransaction(transaction);
    return mutation;
  } finally {
    database.close();
  }
}

export async function enqueueJobLifecycleMutation(
  input: NewJobLifecycleOfflineMutation,
): Promise<JobLifecycleOfflineMutation> {
  const mutation = createJobLifecycleOfflineMutation(input);
  const database = await openOfflineDatabase();
  try {
    const transaction = database.transaction(MUTATION_STORE, 'readwrite');
    transaction.objectStore(MUTATION_STORE).put(mutation);
    await waitForTransaction(transaction);
    return mutation;
  } finally {
    database.close();
  }
}

export async function enqueueChecklistMutation(
  input: NewChecklistOfflineMutation,
): Promise<ChecklistOfflineMutation> {
  const mutation = createChecklistOfflineMutation(input);
  const database = await openOfflineDatabase();
  try {
    const transaction = database.transaction(MUTATION_STORE, 'readwrite');
    transaction.objectStore(MUTATION_STORE).put(mutation);
    await waitForTransaction(transaction);
    return mutation;
  } finally {
    database.close();
  }
}

export async function enqueuePhotoUploadMutation(
  input: Omit<NewPhotoUploadOfflineMutation, 'contentType' | 'fileSizeBytes'>,
  blob: Blob,
): Promise<PhotoUploadOfflineMutation> {
  const mutation = createPhotoUploadOfflineMutation({
    ...input,
    contentType: blob.type,
    fileSizeBytes: blob.size,
  });
  const database = await openOfflineDatabase();
  try {
    const transaction = database.transaction(
      [MUTATION_STORE, PHOTO_BLOB_STORE],
      'readwrite',
    );
    transaction.objectStore(MUTATION_STORE).put(mutation);
    transaction.objectStore(PHOTO_BLOB_STORE).put(blob, mutation.id);
    await waitForTransaction(transaction);
    return mutation;
  } finally {
    database.close();
  }
}

export async function enqueueDayPlanAmendmentMutation(
  input: NewDayPlanAmendmentOfflineMutation,
): Promise<DayPlanAmendmentOfflineMutation> {
  const mutation = createDayPlanAmendmentOfflineMutation(input);
  const database = await openOfflineDatabase();
  try {
    const transaction = database.transaction(MUTATION_STORE, 'readwrite');
    transaction.objectStore(MUTATION_STORE).put(mutation);
    await waitForTransaction(transaction);
    return mutation;
  } finally {
    database.close();
  }
}

export async function getOfflinePhotoBlob(mutationId: string): Promise<Blob | null> {
  const database = await openOfflineDatabase();
  try {
    const transaction = database.transaction(PHOTO_BLOB_STORE, 'readonly');
    const completion = waitForTransaction(transaction);
    const request = transaction.objectStore(PHOTO_BLOB_STORE).get(mutationId);
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error);
    });
    await completion;
    return blob;
  } finally {
    database.close();
  }
}

export async function listOfflineMutations(
  organizationId: string,
  actorId: string,
): Promise<OfflineMutation[]> {
  const database = await openOfflineDatabase();
  try {
    const transaction = database.transaction(MUTATION_STORE, 'readonly');
    const completion = waitForTransaction(transaction);
    const range = IDBKeyRange.bound(
      [organizationId, actorId, ''],
      [organizationId, actorId, '\uffff'],
    );
    const request = transaction
      .objectStore(MUTATION_STORE)
      .index('by_organization_actor_and_created_at')
      .getAll(range);
    const mutations = await new Promise<OfflineMutation[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as OfflineMutation[]);
      request.onerror = () => reject(request.error);
    });
    await completion;
    return mutations
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  } finally {
    database.close();
  }
}

export function withOfflineMutationFailure(
  mutation: OfflineMutation,
  lastError: string,
  syncState: Extract<OfflineMutation['syncState'], 'failed' | 'conflict'> = 'failed',
): OfflineMutation {
  return {
    ...mutation,
    attemptCount: mutation.attemptCount + 1,
    syncState,
    lastError,
  };
}

export async function markOfflineMutationFailed(
  mutation: OfflineMutation,
  lastError: string,
  syncState: Extract<OfflineMutation['syncState'], 'failed' | 'conflict'> = 'failed',
): Promise<void> {
  const database = await openOfflineDatabase();
  try {
    const transaction = database.transaction(MUTATION_STORE, 'readwrite');
    transaction.objectStore(MUTATION_STORE).put(
      withOfflineMutationFailure(mutation, lastError, syncState),
    );
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

export function isOfflineMutationConflict(error: unknown): boolean {
  return error instanceof ApiRequestError
    && [404, 409, 410, 412, 422].includes(error.status);
}

export async function removeOfflineMutation(id: string): Promise<void> {
  const database = await openOfflineDatabase();
  try {
    const transaction = database.transaction(
      [MUTATION_STORE, PHOTO_BLOB_STORE],
      'readwrite',
    );
    transaction.objectStore(MUTATION_STORE).delete(id);
    transaction.objectStore(PHOTO_BLOB_STORE).delete(id);
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}
