import { useState } from 'react';
import type { JobDetail } from '../api/client';
import type {
  ChecklistOfflineMutation,
  JobLifecycleOfflineMutation,
  PhotoUploadOfflineMutation,
} from '../domain/offlineMutationQueue';
import type { YardCareJob } from '../domain/jobs';
import {
  fieldQueueCanSync,
  type FieldRecoveryState,
} from '../workspaces/features/field/fieldWorkspace';

function queuedAt(mutation: { createdAt: string; attemptCount: number }) {
  return (
    <p className="mt-1 text-slate-600">
      Saved {new Date(mutation.createdAt).toLocaleString()}
      {mutation.attemptCount > 0
        ? ` · ${mutation.attemptCount} ${mutation.attemptCount === 1 ? 'retry' : 'retries'}`
        : ''}
    </p>
  );
}

function syncStateLabel(syncState: 'pending' | 'failed' | 'conflict') {
  if (syncState === 'failed') return 'Needs another sync';
  if (syncState === 'conflict') return 'Needs manager review';
  return 'Saved on device';
}

function recoverySummary({ failed, conflicts }: { failed: number; conflicts: number }) {
  const issues = [
    ...(failed > 0 ? [`${failed} need another sync`] : []),
    ...(conflicts > 0 ? [`${conflicts} need manager review`] : []),
  ];

  return issues.length > 0 ? issues.join(' · ') : 'Ready to sync when online.';
}

function ConflictDecision({
  confirmLabel,
  detail,
  onCancel,
  onConfirm,
}: {
  confirmLabel: string;
  detail: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-2 rounded-lg border border-red-300 bg-white p-2">
      <p className="text-red-900">{detail}</p>
      <div className="mt-2 flex gap-2">
        <button
          className="min-h-11 flex-1 rounded-lg bg-red-800 px-3 font-bold text-white"
          onClick={onConfirm}
          type="button"
        >
          {confirmLabel}
        </button>
        <button
          className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 font-bold"
          onClick={onCancel}
          type="button"
        >
          Keep change
        </button>
      </div>
    </div>
  );
}

export function FieldOfflineRecoveryPanel({
  checklistMutations,
  isOnline,
  isReplayingChecklist,
  isReplayingJobs,
  isReplayingPhotos,
  jobMutations,
  jobs,
  onDiscardChecklistConflict,
  onDiscardJobConflict,
  onDiscardPhotoConflict,
  onReplayChecklist,
  onReplayJobs,
  onReplayPhotos,
  photoMutations,
  recovery,
  selectedJob,
}: {
  checklistMutations: ChecklistOfflineMutation[];
  isOnline: boolean;
  isReplayingChecklist: boolean;
  isReplayingJobs: boolean;
  isReplayingPhotos: boolean;
  jobMutations: JobLifecycleOfflineMutation[];
  jobs: YardCareJob[];
  onDiscardChecklistConflict: (mutation: ChecklistOfflineMutation) => void | Promise<void>;
  onDiscardJobConflict: (mutation: JobLifecycleOfflineMutation) => void | Promise<void>;
  onDiscardPhotoConflict: (mutation: PhotoUploadOfflineMutation) => void | Promise<void>;
  onReplayChecklist: () => void | Promise<void>;
  onReplayJobs: () => void | Promise<void>;
  onReplayPhotos: () => void | Promise<void>;
  photoMutations: PhotoUploadOfflineMutation[];
  recovery: FieldRecoveryState;
  selectedJob: JobDetail | null;
}) {
  const [jobConflictId, setJobConflictId] = useState<string | null>(null);
  const [checklistConflictId, setChecklistConflictId] = useState<string | null>(null);
  const [photoConflictId, setPhotoConflictId] = useState<string | null>(null);

  return (
    <>
      {jobMutations.length > 0 ? (
        <div className="mt-2 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900" role="status">
          <p>
            {jobMutations.length} job {jobMutations.length === 1 ? 'change is' : 'changes are'} saved on this phone.
          </p>
          <p className="mt-1 font-medium">
            {recoverySummary(recovery.jobs)}
          </p>
          <details className="mt-2 rounded-lg border border-amber-300 bg-white p-2">
            <summary className="min-h-11 cursor-pointer py-3 font-bold">Review saved job changes</summary>
            <div className="space-y-2 border-t border-amber-200 pt-2">
              {jobMutations.map((mutation) => {
                const job = jobs.find((item) => item.id === mutation.jobId);
                return (
                  <article className="rounded-lg bg-amber-50 p-2 font-medium" key={mutation.id}>
                    <p className="font-bold text-slate-900">{job?.customerName ?? mutation.jobId}</p>
                    <p className="mt-1 text-slate-700">
                      {mutation.action === 'start' ? 'Start job' : 'Complete job'} · {syncStateLabel(mutation.syncState)}
                    </p>
                    {queuedAt(mutation)}
                    {mutation.syncState === 'conflict' ? (
                      jobConflictId === mutation.id ? (
                        <ConflictDecision
                          confirmLabel="Discard phone change"
                          detail="Only discard this after a manager confirms the office record is correct. This removes the saved change from this phone."
                          onCancel={() => setJobConflictId(null)}
                          onConfirm={() => void onDiscardJobConflict(mutation)}
                        />
                      ) : (
                        <button
                          className="mt-2 min-h-11 rounded-lg border border-red-300 bg-white px-3 font-bold text-red-900"
                          onClick={() => setJobConflictId(mutation.id)}
                          type="button"
                        >
                          Review with manager
                        </button>
                      )
                    ) : null}
                  </article>
                );
              })}
            </div>
          </details>
          <button
            className="mt-2 min-h-11 rounded-lg border border-amber-400 bg-white px-4 font-bold disabled:opacity-60"
            disabled={!fieldQueueCanSync(recovery.jobs, isOnline, isReplayingJobs)}
            onClick={() => void onReplayJobs()}
            type="button"
          >
            {isReplayingJobs ? 'Syncing job changes…' : 'Sync job changes'}
          </button>
        </div>
      ) : null}

      {checklistMutations.length > 0 ? (
        <div className="mt-2 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900" role="status">
          <p>
            {checklistMutations.length} task {checklistMutations.length === 1 ? 'change is' : 'changes are'} saved on this phone.
          </p>
          <p className="mt-1 font-medium">
            {recoverySummary(recovery.checklist)}
          </p>
          <details className="mt-2 rounded-lg border border-amber-300 bg-white p-2">
            <summary className="min-h-11 cursor-pointer py-3 font-bold">Review saved task changes</summary>
            <div className="space-y-2 border-t border-amber-200 pt-2">
              {checklistMutations.map((mutation) => {
                const job = jobs.find((item) => item.id === mutation.jobId);
                const checklistItem = selectedJob?.id === mutation.jobId
                  ? selectedJob.checklist.find((item) => item.id === mutation.checklistItemId)
                  : undefined;
                return (
                  <article className="rounded-lg bg-amber-50 p-2 font-medium" key={mutation.id}>
                    <p className="font-bold text-slate-900">{job?.customerName ?? mutation.jobId}</p>
                    <p className="mt-1 text-slate-700">
                      {checklistItem?.label ?? mutation.checklistItemId} ·{' '}
                      {mutation.completed ? 'Complete' : 'Not complete'} · {syncStateLabel(mutation.syncState)}
                    </p>
                    {queuedAt(mutation)}
                    {mutation.syncState === 'conflict' ? (
                      checklistConflictId === mutation.id ? (
                        <ConflictDecision
                          confirmLabel="Discard phone change"
                          detail="Only discard this after a manager confirms the office record is correct. This removes the saved task change from this phone."
                          onCancel={() => setChecklistConflictId(null)}
                          onConfirm={() => void onDiscardChecklistConflict(mutation)}
                        />
                      ) : (
                        <button
                          className="mt-2 min-h-11 rounded-lg border border-red-300 bg-white px-3 font-bold text-red-900"
                          onClick={() => setChecklistConflictId(mutation.id)}
                          type="button"
                        >
                          Review with manager
                        </button>
                      )
                    ) : null}
                  </article>
                );
              })}
            </div>
          </details>
          <button
            className="mt-2 min-h-11 rounded-lg border border-amber-400 bg-white px-4 font-bold disabled:opacity-60"
            disabled={!fieldQueueCanSync(recovery.checklist, isOnline, isReplayingChecklist)}
            onClick={() => void onReplayChecklist()}
            type="button"
          >
            {isReplayingChecklist ? 'Syncing task changes…' : 'Sync task changes'}
          </button>
        </div>
      ) : null}

      {photoMutations.length > 0 ? (
        <div className="mt-2 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900" role="status">
          <p>
            {photoMutations.length} {photoMutations.length === 1 ? 'photo is' : 'photos are'} saved on this phone.
          </p>
          <p className="mt-1 font-medium">
            {recoverySummary(recovery.photos)}
          </p>
          <details className="mt-2 rounded-lg border border-amber-300 bg-white p-2">
            <summary className="min-h-11 cursor-pointer py-3 font-bold">Review saved photos</summary>
            <div className="space-y-2 border-t border-amber-200 pt-2">
              {photoMutations.map((mutation) => {
                const job = jobs.find((item) => item.id === mutation.jobId);
                return (
                  <article className="rounded-lg bg-amber-50 p-2 font-medium" key={mutation.id}>
                    <p className="font-bold text-slate-900">{job?.customerName ?? mutation.jobId}</p>
                    <p className="mt-1 break-all text-slate-700">
                      {mutation.photoType} photo · {mutation.fileName} ·{' '}
                      {(mutation.fileSizeBytes / 1024 / 1024).toFixed(1)} MB · {syncStateLabel(mutation.syncState)}
                    </p>
                    {queuedAt(mutation)}
                    {mutation.syncState === 'conflict' ? (
                      photoConflictId === mutation.id ? (
                        <ConflictDecision
                          confirmLabel="Discard photo"
                          detail="Only discard this after a manager confirms the office record is correct. This permanently removes the saved photo from this phone."
                          onCancel={() => setPhotoConflictId(null)}
                          onConfirm={() => void onDiscardPhotoConflict(mutation)}
                        />
                      ) : (
                        <button
                          className="mt-2 min-h-11 rounded-lg border border-red-300 bg-white px-3 font-bold text-red-900"
                          onClick={() => setPhotoConflictId(mutation.id)}
                          type="button"
                        >
                          Review with manager
                        </button>
                      )
                    ) : null}
                  </article>
                );
              })}
            </div>
          </details>
          <button
            className="mt-2 min-h-11 rounded-lg border border-amber-400 bg-white px-4 font-bold disabled:opacity-60"
            disabled={!fieldQueueCanSync(recovery.photos, isOnline, isReplayingPhotos)}
            onClick={() => void onReplayPhotos()}
            type="button"
          >
            {isReplayingPhotos ? 'Uploading photos…' : 'Upload saved photos'}
          </button>
        </div>
      ) : null}
    </>
  );
}
