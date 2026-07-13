import { useState } from 'react';
import { getCompletionProgress } from '../domain/jobs';
import {
  bidDeliveryRecipientIsValid,
  type BidDeliveryChannel,
} from '../domain/bidDelivery';
import { AccountStatusCard } from './AccountStatusCard';
import type { CompletionReportSnapshot, JobDetail, PhotoUploadTicket } from '../api/client';

type CompletionReportProps = {
  job: JobDetail;
  uploadTickets: PhotoUploadTicket[];
  reportSnapshot: CompletionReportSnapshot | null;
  onStartReview?: (reportId: string) => Promise<void>;
  onRequestChanges?: (reportId: string, reason: string) => Promise<void>;
  onResubmit?: (reportId: string) => Promise<void>;
  onDeliver?: (reportId: string) => Promise<void>;
  onQueueDeliveryNotification?: (
    reportId: string,
    channel: BidDeliveryChannel,
    recipient: string,
  ) => Promise<void>;
  actionStatus?: string | null;
};

function reportStatusLabel(status: string): string {
  return status.replace('_', ' ');
}

export function CompletionReport({
  job,
  uploadTickets,
  reportSnapshot,
  onStartReview,
  onRequestChanges,
  onResubmit,
  onDeliver,
  onQueueDeliveryNotification,
  actionStatus,
}: CompletionReportProps) {
  const [changeReason, setChangeReason] = useState('');
  const [deliveryChannel, setDeliveryChannel] = useState<BidDeliveryChannel>('email');
  const [deliveryRecipient, setDeliveryRecipient] = useState('');
  const progress = getCompletionProgress(job);
  const beforeEvidenceCount = uploadTickets.filter((ticket) => ticket.photoType === 'before').length;
  const afterEvidenceCount = uploadTickets.filter((ticket) => ticket.photoType === 'after').length;
  const beforePhotos = Math.max(job.beforePhotos, beforeEvidenceCount);
  const afterPhotos = Math.max(job.afterPhotos, afterEvidenceCount);
  const issuePhotos = uploadTickets.filter((ticket) => ticket.photoType === 'issue').length;
  const readyForCustomer = progress === 100 && beforePhotos > 0 && afterPhotos > 0;
  const reportStatus = reportSnapshot?.reportStatus ?? (readyForCustomer ? 'submitted' : 'draft');

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
          {reportStatusLabel(reportStatus)}
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

      {reportSnapshot?.persisted ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold text-slate-800">Manager review actions</p>
              <p className="mt-1 text-xs text-slate-500">
                Current lifecycle state: {reportStatusLabel(reportSnapshot.reportStatus)}.
              </p>
            </div>
            {actionStatus ? <p className="text-xs font-semibold text-slate-500">{actionStatus}</p> : null}
          </div>

          {reportSnapshot.reportStatus === 'submitted' ? (
            <button
              className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              disabled={Boolean(actionStatus) || !onStartReview}
              onClick={() => void onStartReview?.(reportSnapshot.reportId)}
              type="button"
            >
              Start manager review
            </button>
          ) : null}

          {reportSnapshot.reportStatus === 'in_review' ? (
            <div className="mt-3 space-y-3">
              <textarea
                className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                maxLength={1000}
                onChange={(event) => setChangeReason(event.target.value)}
                placeholder="Optional note for the crew before customer delivery"
                value={changeReason}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="rounded-lg border border-amber-700 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60"
                  disabled={Boolean(actionStatus) || !onRequestChanges}
                  onClick={() => void onRequestChanges?.(reportSnapshot.reportId, changeReason)}
                  type="button"
                >
                  Request changes
                </button>
                <button
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                  disabled={Boolean(actionStatus) || !onDeliver}
                  onClick={() => void onDeliver?.(reportSnapshot.reportId)}
                  type="button"
                >
                  Deliver to customer
                </button>
              </div>
            </div>
          ) : null}

          {reportSnapshot.reportStatus === 'changes_requested' ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-amber-700">
                Crew follow-up can return this report to the manager review queue.
              </p>
              <button
                className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                disabled={Boolean(actionStatus) || !onResubmit}
                onClick={() => void onResubmit?.(reportSnapshot.reportId)}
                type="button"
              >
                Resubmit for review
              </button>
            </div>
          ) : null}

          {reportSnapshot.reportStatus === 'delivered' ? (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-emerald-700">
                Delivered reports are locked for customer review.
              </p>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Customer notification</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[120px_1fr_auto]">
                  <select
                    className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-emerald-950"
                    onChange={(event) => setDeliveryChannel(event.target.value as BidDeliveryChannel)}
                    value={deliveryChannel}
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                  <input
                    className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs text-emerald-950"
                    onChange={(event) => setDeliveryRecipient(event.target.value)}
                    placeholder={deliveryChannel === 'email' ? 'customer@example.com' : '+16025550123'}
                    value={deliveryRecipient}
                  />
                  <button
                    className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                    disabled={
                      Boolean(actionStatus)
                      || !onQueueDeliveryNotification
                      || !bidDeliveryRecipientIsValid(deliveryChannel, deliveryRecipient)
                    }
                    onClick={() =>
                      void onQueueDeliveryNotification?.(
                        reportSnapshot.reportId,
                        deliveryChannel,
                        deliveryRecipient,
                      )
                    }
                    type="button"
                  >
                    Queue delivery
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

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
                  <div className="flex min-w-0 gap-3">
                    {ticket.thumbnailUrl ? (
                      <img
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        loading="lazy"
                        src={ticket.thumbnailUrl}
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="break-all font-semibold text-slate-800">{ticket.fileName}</p>
                      <p className="capitalize">{ticket.photoType} photo</p>
                    </div>
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
