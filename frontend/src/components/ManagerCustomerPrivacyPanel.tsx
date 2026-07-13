import { useEffect, useMemo, useState } from 'react';
import type { CustomerPhotoErasureSummary, CustomerPrivacyExport } from '../api/client';

type ManagerCustomerPrivacyPanelProps = {
  accountIds: string[];
  exportResult: CustomerPrivacyExport | null;
  erasureResult: CustomerPhotoErasureSummary | null;
  isLoading: boolean;
  onExport: (accountId: string) => void;
  onErasePhotos: (accountId: string, reason: string) => void;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ManagerCustomerPrivacyPanel({
  accountIds,
  exportResult,
  erasureResult,
  isLoading,
  onExport,
  onErasePhotos,
}: ManagerCustomerPrivacyPanelProps) {
  const normalizedAccountIds = useMemo(
    () => Array.from(new Set(accountIds.filter((accountId) => accountId.trim().length > 0))).sort(),
    [accountIds],
  );
  const [accountId, setAccountId] = useState(normalizedAccountIds[0] ?? '');
  const [reason, setReason] = useState('Customer requested removal of retained photo evidence.');
  const retainedPhotoCount = exportResult?.photoEvidence.filter((photo) => photo.status !== 'erased').length ?? 0;
  const erasedPhotoCount = exportResult?.photoEvidence.filter((photo) => photo.status === 'erased').length ?? 0;
  const canSubmit = accountId.trim().length > 0 && !isLoading;
  const canErase = canSubmit && reason.trim().length > 0;

  useEffect(() => {
    if (!accountId && normalizedAccountIds[0]) {
      setAccountId(normalizedAccountIds[0]);
    }
  }, [accountId, normalizedAccountIds]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Customer privacy</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Evidence export and erasure</h2>
          <p className="mt-1 text-xs text-slate-500">
            {exportResult
              ? `${exportResult.account.customerName} has ${retainedPhotoCount} retained photo item${retainedPhotoCount === 1 ? '' : 's'} in scope.`
              : 'Select an account to load retained evidence metadata.'}
          </p>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          disabled={!canSubmit}
          onClick={() => onExport(accountId.trim())}
          type="button"
        >
          {isLoading ? 'Working' : 'Export data'}
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <label className="text-xs font-semibold text-slate-600">
          Account
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
          >
            {normalizedAccountIds.length === 0 ? (
              <option value="">No persisted accounts</option>
            ) : (
              normalizedAccountIds.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="text-xs font-semibold text-slate-600">
          Erasure reason
          <textarea
            className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            maxLength={1000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
          disabled={!canErase}
          onClick={() => onErasePhotos(accountId.trim(), reason.trim())}
          type="button"
        >
          Erase retained photos
        </button>
      </div>

      {exportResult ? (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">Jobs</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{exportResult.jobs.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">Reports</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{exportResult.completionReports.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">Retained photos</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{retainedPhotoCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">Erased photos</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{erasedPhotoCount}</p>
          </div>
        </div>
      ) : null}

      {exportResult ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <div>
              <p className="text-sm font-semibold text-slate-950">{exportResult.account.customerName}</p>
              <p className="mt-1 text-xs text-slate-600">
                {exportResult.account.accountId} · {exportResult.account.organizationIds.join(', ')}
              </p>
            </div>
            <p className="text-xs text-slate-500">Generated {formatDate(exportResult.generatedAt)}</p>
          </div>
          <div className="mt-3 max-h-48 overflow-auto rounded-lg bg-white p-2">
            {exportResult.photoEvidence.length === 0 ? (
              <p className="text-sm text-slate-600">No photo evidence metadata is in scope.</p>
            ) : (
              <div className="space-y-2">
                {exportResult.photoEvidence.slice(0, 8).map((photo) => (
                  <div key={photo.photoId} className="text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">
                      {photo.photoType} · {photo.status} · {photo.jobId}
                    </p>
                    <p className="break-all">{photo.objectKey ?? 'Object key redacted'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {erasureResult ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <p className="font-semibold">
            Erased {erasureResult.erasedPhotoCount} photo item{erasureResult.erasedPhotoCount === 1 ? '' : 's'} across {erasureResult.affectedJobCount} job{erasureResult.affectedJobCount === 1 ? '' : 's'}.
          </p>
          <p className="mt-1 text-xs">
            Redacted {erasureResult.redactedCompletionReportCount} delivered report snapshot{erasureResult.redactedCompletionReportCount === 1 ? '' : 's'}.
          </p>
          <p className="mt-1 text-xs">
            Deleted {erasureResult.deletedObjectKeyCount} object key{erasureResult.deletedObjectKeyCount === 1 ? '' : 's'}; {erasureResult.failedObjectKeyCount} remain pending.
          </p>
          {erasureResult.objectKeysPendingDeletion.length > 0 ? (
            <div className="mt-3 max-h-32 overflow-auto rounded-lg bg-white p-2">
              {erasureResult.objectKeysPendingDeletion.map((objectKey) => (
                <p key={objectKey} className="break-all text-xs text-rose-800">
                  {objectKey}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
