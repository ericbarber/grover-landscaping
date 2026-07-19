import type { StopProgressStatus } from './stopProgress';

const DATABASE_NAME = 'grover-field-offline';
const DATABASE_VERSION = 1;
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
      if (database.objectStoreNames.contains(MUTATION_STORE)) return;
      const store = database.createObjectStore(MUTATION_STORE, { keyPath: 'id' });
      store.createIndex('by_sync_state_and_created_at', ['syncState', 'createdAt']);
      store.createIndex('by_organization_and_created_at', ['organizationId', 'createdAt']);
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
): Promise<StopProgressOfflineMutation[]> {
  const database = await openOfflineDatabase();
  try {
    const transaction = database.transaction(MUTATION_STORE, 'readonly');
    const completion = waitForTransaction(transaction);
    const range = IDBKeyRange.bound(
      [organizationId, ''],
      [organizationId, '\uffff'],
    );
    const request = transaction
      .objectStore(MUTATION_STORE)
      .index('by_organization_and_created_at')
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
