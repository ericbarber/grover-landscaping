import { useEffect, useState } from 'react';
import { fetchSharedCompletionReport, type CompletionReportSnapshot } from '../api/client';

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

export function CustomerCompletionReportPage({ shareToken }: CustomerCompletionReportPageProps) {
  const [report, setReport] = useState<CompletionReportSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setError(null);
    fetchSharedCompletionReport(shareToken)
      .then((response) => {
        if (isMounted) setReport(response);
      })
      .catch(() => {
        if (isMounted) setError('This completion report link is invalid or no longer available.');
      });

    return () => {
      isMounted = false;
    };
  }, [shareToken]);

  if (error && !report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
        <section className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Report unavailable</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">Unable to open this completion report</h1>
          <p className="mt-3 text-sm text-slate-600">{error}</p>
        </section>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
        <p className="font-semibold">Loading completion report…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <header className="bg-slate-950 p-7 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Grover Landscaping</p>
          <h1 className="mt-3 text-3xl font-bold">Service completion report</h1>
          <p className="mt-2 text-sm text-slate-300">
            Delivered proof of service for {report.job.customerName} on {serviceDateLabel(report.job.scheduledDate)}.
          </p>
        </header>

        <div className="space-y-6 p-7">
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Status</p>
              <p className="mt-2 text-lg font-bold text-emerald-950">Delivered</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Checklist</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{report.checklistProgress}% complete</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Evidence</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{evidenceLabel(report)}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-500">Property</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">{report.job.propertyAddress}</h2>
            <p className="mt-2 text-sm text-slate-600">{report.account.billingNotes}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-950">Completed checklist</h2>
            <div className="mt-4 space-y-2">
              {report.job.checklist.map((item) => (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2" key={item.id}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${item.completed ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                    {item.completed ? '✓' : '–'}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          {report.completedAddOns.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-950">Completed add-on work</h2>
              <div className="mt-4 space-y-3">
                {report.completedAddOns.map((addOn) => (
                  <article className="rounded-xl bg-slate-50 p-4" key={addOn.id}>
                    <p className="font-semibold text-slate-950">{addOn.serviceName}</p>
                    {addOn.serviceDescription ? <p className="mt-1 text-sm text-slate-600">{addOn.serviceDescription}</p> : null}
                    {addOn.note ? <p className="mt-2 text-xs text-slate-500">{addOn.note}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {report.photoEvidence.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-950">Photo evidence</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {report.photoEvidence.map((photo) => (
                  <article className="rounded-xl bg-slate-50 p-4" key={photo.photoId}>
                    {photo.thumbnailUrl ? (
                      <img
                        alt=""
                        className="mb-3 aspect-video w-full rounded-lg object-cover"
                        loading="lazy"
                        src={photo.thumbnailUrl}
                      />
                    ) : null}
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{photo.photoType}</p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-900">{photo.fileName}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
