import { getCompletionProgress } from '../domain/jobs';
import type { JobDetail, PhotoUploadTicket } from '../api/client';

type CompletionReportProps = {
  job: JobDetail;
  uploadTickets: PhotoUploadTicket[];
};

export function CompletionReport({ job, uploadTickets }: CompletionReportProps) {
  const progress = getCompletionProgress(job);
  const beforePhotos = job.beforePhotos + uploadTickets.filter((ticket) => ticket.objectKey.includes('/before/')).length;
  const afterPhotos = job.afterPhotos + uploadTickets.filter((ticket) => ticket.objectKey.includes('/after/')).length;
  const issuePhotos = uploadTickets.filter((ticket) => ticket.objectKey.includes('/issue/')).length;
  const readyForCustomer = progress === 100 && beforePhotos > 0 && afterPhotos > 0;

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
          {readyForCustomer ? 'Ready' : 'Draft'}
        </span>
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
      </div>

      {uploadTickets.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-800">Photo evidence</p>
          <div className="mt-3 space-y-2">
            {uploadTickets.map((ticket) => (
              <div key={ticket.photoId} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">{ticket.photoId}</p>
                <p>{ticket.uploadMode}</p>
                <p className="break-all">{ticket.objectKey}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
