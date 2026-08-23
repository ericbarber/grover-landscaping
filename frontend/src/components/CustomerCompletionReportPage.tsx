import { useEffect, useState } from 'react';
import { isApiErrorCode } from '../api/apiError';
import { fetchSharedCompletionReport, type CompletionReportSnapshot } from '../api/client';
import { WorkspaceIcon } from './WorkspaceIcon';

type CustomerCompletionReportPageProps = {
  shareToken: string;
};

function serviceDateLabel(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function evidenceLabel(report: CompletionReportSnapshot): string {
  const parts = [
    `${report.beforePhotos} before`,
    `${report.afterPhotos} after`,
  ];

  if (report.issuePhotos > 0) {
    parts.push(`${report.issuePhotos} issue`);
  }

  return `${parts.join(' · ')} photo${report.beforePhotos + report.afterPhotos + report.issuePhotos === 1 ? '' : 's'}`;
}

function capturedLabel(report: CompletionReportSnapshot): string | null {
  if (!report.snapshotMetadata) return null;

  return new Date(report.snapshotMetadata.capturedAtEpochSeconds * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CustomerCompletionReportPage({ shareToken }: CustomerCompletionReportPageProps) {
  const [report, setReport] = useState<CompletionReportSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setReport(null);
    setError(null);
    fetchSharedCompletionReport(shareToken)
      .then((response) => {
        if (isMounted) setReport(response);
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(
            isApiErrorCode(requestError, 'shared_report_unavailable')
              ? 'Report storage is temporarily unavailable. Retry after service readiness recovers.'
              : isApiErrorCode(requestError, 'completion_report_route_unavailable')
                ? 'Route storage is temporarily unavailable, so this report cannot be safely assembled yet.'
                : 'This completion report link is invalid or no longer available.',
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [loadAttempt, shareToken]);

  if (error && !report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bone px-4 py-12 sm:px-6">
        <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-paper p-7 text-center shadow-grover-md sm:p-9" role="alert">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-700">
            <WorkspaceIcon className="h-6 w-6" name="attention" />
          </span>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-rose-700">Report unavailable</p>
          <h1 className="mt-3 font-display text-3xl font-black text-forest">Unable to open this completion report</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
          <button className="grover-button-primary mt-6 w-full sm:w-auto" onClick={() => setLoadAttempt((value) => value + 1)} type="button">
            Try again
          </button>
          <p className="mt-5 text-xs text-slate-500">This secure link does not expose internal account or team information.</p>
        </section>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-forest px-6 py-12 text-white">
        <div className="text-center" role="status">
          <span className="mx-auto block h-10 w-10 animate-pulse rounded-full border-4 border-sand border-r-transparent" />
          <p className="mt-4 font-bold">Loading completion report…</p>
          <p className="mt-1 text-sm text-slate-300">Verifying the secure customer link.</p>
        </div>
      </main>
    );
  }

  const capturedAt = capturedLabel(report);

  return (
    <main className="min-h-screen bg-bone pb-10">
      <header className="border-b border-slate-200 bg-paper px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="grover-brand text-forest">
            <svg aria-hidden="true" className="grover-brand-mark" viewBox="0 0 32 32">
              <path d="M6 25c5-1 9-5 11-11 4 2 7 6 8 11" />
              <path d="M8 24c0-8 5-14 13-17-1 8-5 14-13 17Z" />
            </svg>
            <span>Grover</span>
          </div>
          <div className="flex items-center gap-2 text-right text-xs font-bold text-slate-600">
            <WorkspaceIcon className="h-4 w-4 shrink-0 text-emerald-700" name="check" />
            <span>Secure customer link</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-paper shadow-grover-md">
          <header className="bg-forest p-6 text-white sm:p-8 lg:p-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sand">Delivered service proof</p>
            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <h1 className="font-display text-4xl font-black sm:text-5xl">Service completion report</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  A customer-safe record of completed work for {report.job.customerName}.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900">
                <WorkspaceIcon className="h-4 w-4" name="check" />
                Delivered
              </span>
            </div>
          </header>

          <div className="space-y-7 p-5 sm:p-8 lg:p-10">
            <section aria-labelledby="service-identity-heading">
              <p className="grover-eyebrow">Service identity</p>
              <h2 className="mt-2 font-display text-3xl font-black text-forest" id="service-identity-heading">
                {report.job.propertyAddress}
              </h2>
              <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <dt className="text-xs font-black uppercase tracking-wide text-emerald-800">Service date</dt>
                  <dd className="mt-2 text-base font-black text-forest">{serviceDateLabel(report.job.scheduledDate)}</dd>
                </div>
                <div className="rounded-2xl bg-slate-100 p-4">
                  <dt className="text-xs font-black uppercase tracking-wide text-slate-600">Provided by</dt>
                  <dd className="mt-2 text-base font-black text-forest">Grover Landscaping</dd>
                </div>
                <div className="rounded-2xl bg-slate-100 p-4">
                  <dt className="text-xs font-black uppercase tracking-wide text-slate-600">Evidence</dt>
                  <dd className="mt-2 text-base font-black text-forest">{evidenceLabel(report)}</dd>
                </div>
              </dl>
              {capturedAt ? <p className="mt-3 text-xs text-slate-500">Immutable delivery snapshot captured {capturedAt}.</p> : null}
            </section>

            <section aria-labelledby="proof-heading" className="border-t border-slate-200 pt-7">
              <p className="grover-eyebrow">Evidence</p>
              <div className="mt-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-display text-3xl font-black text-forest" id="proof-heading">Work completed</h2>
                  <p className="mt-1 text-sm text-slate-600">Checklist, photos, and completed add-ons included in this delivered snapshot.</p>
                </div>
                <p className="text-sm font-black text-emerald-800">{report.checklistProgress}% checklist complete</p>
              </div>

              {report.photoEvidence.length > 0 ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {report.photoEvidence.map((photo) => (
                    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50" key={photo.photoId}>
                      {photo.thumbnailUrl ? (
                        <img
                          alt={`${photo.photoType} service evidence for ${report.job.propertyAddress}`}
                          className="aspect-video w-full object-cover"
                          loading="lazy"
                          src={photo.thumbnailUrl}
                        />
                      ) : (
                        <div className="grid aspect-video place-items-center bg-slate-100 text-slate-500">
                          <WorkspaceIcon className="h-8 w-8" name="info" />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-800">{photo.photoType} photo</p>
                        <p className="mt-1 break-words text-sm font-bold text-slate-800">{photo.fileName}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 rounded-2xl border border-slate-200 p-4 sm:p-5">
                <h3 className="text-lg font-black text-forest">Completed checklist</h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {report.job.checklist.map((item) => (
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3" key={item.id}>
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${item.completed ? 'bg-emerald-700 text-white' : 'border border-slate-300 bg-paper text-slate-500'}`}>
                        {item.completed ? <WorkspaceIcon className="h-4 w-4" name="check" /> : <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {report.completedAddOns.length > 0 ? (
              <section className="rounded-2xl border border-slate-200 p-5">
                <h2 className="font-display text-2xl font-black text-forest">Completed add-on work</h2>
                <div className="mt-4 space-y-3">
                  {report.completedAddOns.map((addOn) => (
                    <article className="rounded-xl bg-slate-50 p-4" key={addOn.id}>
                      <p className="font-black text-forest">{addOn.serviceName}</p>
                      {addOn.serviceDescription ? <p className="mt-1 text-sm text-slate-600">{addOn.serviceDescription}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <footer className="rounded-2xl bg-slate-100 p-5 sm:flex sm:items-start sm:justify-between sm:gap-6">
              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                  <WorkspaceIcon className="h-5 w-5" name="check" />
                </span>
                <div>
                  <h2 className="font-black text-forest">Customer-safe record</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                    This secure page contains delivered service proof only. It excludes manager-only identifiers, internal notes, billing details, and unrelated account data.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
