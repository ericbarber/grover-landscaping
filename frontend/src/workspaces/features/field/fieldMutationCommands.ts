import type { FieldConflictDiscardOutcome } from './useFieldOfflineRecovery';

interface PersistedMutationResult {
  persisted: boolean;
}

export type FieldMutationCommandOutcome =
  | 'persisted'
  | 'queued'
  | 'durable_storage_unavailable'
  | 'tenant_unresolved';

export interface FieldMutationCommandResult {
  outcome: FieldMutationCommandOutcome;
  message: string;
}

interface FieldMutationCommandOptions {
  persist: () => Promise<PersistedMutationResult>;
  queue?: () => Promise<boolean>;
  persistedMessage: string;
  queuedMessage: string;
  storageUnavailableMessage: string;
  tenantUnresolvedMessage: string;
}

async function runFieldMutationCommand({
  persist,
  queue,
  persistedMessage,
  queuedMessage,
  storageUnavailableMessage,
  tenantUnresolvedMessage,
}: FieldMutationCommandOptions): Promise<FieldMutationCommandResult> {
  try {
    const result = await persist();
    if (result.persisted) {
      return { outcome: 'persisted', message: persistedMessage };
    }
  } catch {
    // Durable queueing below owns the unavailable API path.
  }

  if (!queue) {
    return { outcome: 'tenant_unresolved', message: tenantUnresolvedMessage };
  }
  if (await queue()) {
    return { outcome: 'queued', message: queuedMessage };
  }
  return {
    outcome: 'durable_storage_unavailable',
    message: storageUnavailableMessage,
  };
}

export function runJobLifecycleMutationCommand({
  jobId,
  action,
  persist,
  queue,
}: {
  jobId: string;
  action: 'start' | 'complete';
  persist: () => Promise<PersistedMutationResult>;
  queue?: () => Promise<boolean>;
}): Promise<FieldMutationCommandResult> {
  const verb = action === 'start' ? 'Started' : 'Completed';
  return runFieldMutationCommand({
    persist,
    queue,
    persistedMessage: `${verb} ${jobId}.`,
    queuedMessage: `${verb} ${jobId} locally; the change is queued offline.`,
    storageUnavailableMessage:
      `${verb} ${jobId} locally, but durable offline storage is unavailable.`,
    tenantUnresolvedMessage:
      `${verb} ${jobId} locally without a resolved tenant; reconnect before continuing.`,
  });
}

export function runChecklistMutationCommand({
  persist,
  queue,
}: {
  persist: () => Promise<PersistedMutationResult>;
  queue?: () => Promise<boolean>;
}): Promise<FieldMutationCommandResult> {
  return runFieldMutationCommand({
    persist,
    queue,
    persistedMessage: 'Checklist updated.',
    queuedMessage: 'Checklist change saved locally and queued offline.',
    storageUnavailableMessage:
      'Checklist changed locally, but durable offline storage is unavailable.',
    tenantUnresolvedMessage:
      'Checklist changed locally without a resolved tenant; reconnect before continuing.',
  });
}

export type FieldConflictKind = 'job' | 'checklist' | 'photo';

export function reviewedFieldConflictMessage(
  kind: FieldConflictKind,
  outcome: FieldConflictDiscardOutcome,
  jobAction?: 'start' | 'complete',
): string {
  if (outcome === 'remove_failed') {
    if (kind === 'job') {
      return 'The reviewed job conflict could not be removed from this phone. Try again.';
    }
    return `The reviewed ${kind} conflict could not be removed from this phone.`;
  }
  if (outcome === 'server_refresh_unavailable') {
    const subject = kind === 'job' && jobAction ? jobAction : kind;
    return `Discarded the reviewed ${subject} conflict; refresh when the API is available.`;
  }
  if (kind === 'job') {
    return `Discarded the reviewed ${jobAction ?? 'job'} conflict and restored server job state.`;
  }
  if (kind === 'checklist') {
    return 'Discarded the reviewed checklist conflict and restored server state.';
  }
  return 'Discarded the reviewed photo conflict and refreshed server photo counts.';
}
