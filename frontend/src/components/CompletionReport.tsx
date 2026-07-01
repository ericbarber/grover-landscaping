import { getCompletionProgress } from '../domain/jobs';
import { AccountStatusCard } from './AccountStatusCard';
import type { CompletionReportSnapshot, JobDetail, PhotoUploadTicket } from '../api/client';

type CompletionReportProps = {
  job: JobDetail;
  uploadTickets: PhotoUploadTicket[];
  reportSnapshot: CompletionReportSnapshot | null;
};

export function CompletionReport({ job, uploadTickets, reportSnapshot }: CompletionReportProps) {
  const progress = getCompletionProgress(job);
  const beforeEvidenceCount = uploadTickets.filter((ticket) => ticket.photoType === 'before').length;
  const afterEvidenceCount = uploadTickets.filter((ticket) => ticket.photoType === 'after').length;
  const beforePhotos = Math.max(job.beforePhotos, beforeEvidenceCount);
  const afterPhotos = Math.max(job.afterPhotos, afterEvidenceCount);
  const issuePhotos = uploadTickets.filter((ticket) => ticket.photoType === 'issue').length;
  const readyForCustomer = progress === 100 && beforePhotos > 0 && afterPhotos > 0;
  const reportStatus = readyForCustomer ? 'ready' : (reportSnapshot?.reportStatus ?? 'draft');

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Completion report</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">{job.customerName}</h3>
          <p className="mt-1 text-sm text-slate-600">{job.propertyAddress}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            readyForCustomer ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {reportStatus}
        </span>
      </div>

      <div className="mt-5">
        <AccountStatusCard jobId={job.id} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{progress}%</p>
          <p className="text-xs text-slate-500">Checklist</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{beforePhotos}</p>
          <p className="text-xs text-slate-500">Before</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{afterPhotos}</p>
          <p className="text-xs text-slate-500">After</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{issuePhotos}</p>
          <p className="text-xs text-slate-500">Issues</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Customer-facing summary</p>
        <p className="mt-2 text-sm text-slate-600">
          Yard-care work for {job.propertyAddress} is tracked with timestamped completion steps and photo evidence.
          This report will become shareable once the required before and after photos are present and the checklist is complete.
        </p>
        {reportSnapshot && (
          <p className="mt-3 text-xs font-medium text-slate-500">
            Backend report {reportSnapshot.persisted ? 'persisted' : 'computed locally'} as {reportSnapshot.reportId} with{' '}
            {reportSnapshot.photoEvidence.length} photo evidence item
            {reportSnapshot.photoEvidence.length === 1 ? '' : 's'}.
          </p>
        )}
        {reportSnapshot?.shareUrl && (
          <a
            className="mt-3 inline-flex text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
            href={reportSnapshot.shareUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open shareable report
          </a>
        )}
      </div>

      {reportSnapshot && reportSnapshot.completedAddOns.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-800">Completed add-on work</p>
          <div className="mt-3 space-y-2">
            {reportSnapshot.completedAddOns.map((addOn) => (
              <div key={addOn.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-950">{addOn.serviceName}</p>
                <p className="mt-1 text-xs text-emerald-800">Quantity {addOn.quantity} · Completed</p>
                {addOn.note ? <p className="mt-1 text-xs text-emerald-700">{addOn.note}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {uploadTickets.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-800">Photo evidence</p>
          <div className="mt-3 space-y-2">
            {uploadTickets.map((ticket) => (
              <div key={ticket.photoId} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{ticket.fileName}</p>
                    <p className="capitalize">{ticket.photoType} photo</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 font-semibold uppercase text-slate-500">
                    {ticket.status}
                  </span>
                </div>
                <p className="mt-2">{ticket.uploadMode}</p>
                <p className="break-all">{ticket.objectKey}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
