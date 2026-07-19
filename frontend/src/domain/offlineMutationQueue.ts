import type { StopProgressStatus } from './stopProgress';
import { ApiRequestError } from '../api/apiError';

const DATABASE_NAME = 'grover-field-offline';
const DATABASE_VERSION = 2;
const MUTATION_STORE = 'mutations';

export interface StopProgressOfflineMutation {
  id: string;
  kind: 'stop_progress';
  organizationId: string;
  actorId: string;
  dayPlanId: string;
  stopId: string;
  status: StopProgressStatus;
  createdAt: string;
  attemptCount: number;
  syncState: 'pending' | 'failed' | 'conflict';
  lastError?: string;
}

export interface NewStopProgressOfflineMutation {
  organizationId: string;
  actorId: string;
  dayPlanId: string;
  stopId: string;
  status: StopProgressStatus;
}

export function createStopProgressOfflineMutation(
  input: NewStopProgressOfflineMutation,
  id: string = crypto.randomUUID(),
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

export async function listOfflineMutations(
  organizationId: string,
  actorId: string,
): Promise<StopProgressOfflineMutation[]> {
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
    const mutations = await new Promise<StopProgressOfflineMutation[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as StopProgressOfflineMutation[]);
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
  mutation: StopProgressOfflineMutation,
  lastError: string,
  syncState: Extract<StopProgressOfflineMutation['syncState'], 'failed' | 'conflict'> = 'failed',
): StopProgressOfflineMutation {
  return {
    ...mutation,
    attemptCount: mutation.attemptCount + 1,
    syncState,
    lastError,
  };
}

export async function markOfflineMutationFailed(
  mutation: StopProgressOfflineMutation,
  lastError: string,
  syncState: Extract<StopProgressOfflineMutation['syncState'], 'failed' | 'conflict'> = 'failed',
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
    const transaction = database.transaction(MUTATION_STORE, 'readwrite');
    transaction.objectStore(MUTATION_STORE).delete(id);
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}
