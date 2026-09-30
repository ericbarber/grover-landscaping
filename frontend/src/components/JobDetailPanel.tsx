import { useEffect, useState } from 'react';
import type {
  CompletionReportSnapshot,
  JobAddOn,
  JobDetail,
  PhotoUploadTicket,
} from '../api/client';
import { CompletionReport } from './CompletionReport';
import { JobStatusBadge } from './JobStatusBadge';
import {
  JobWorkflowMenu,
  type JobWorkflowSection,
} from './JobWorkflowMenu';
import { WorkspaceStatusBadge, WorkspaceStatusNotice } from './WorkspaceStatus';
import type { FieldPhotoType } from '../workspaces/features/field/fieldWorkspace';

export function JobDetailPanel({
  job,
  executionEnabled,
  fieldEvidenceEnabled,
  isLoading,
  uploadTickets,
  reportSnapshot,
  addOns,
  onStart,
  onComplete,
  onChecklistItemChange,
  onPhotoSelected,
  onAddOnStatusChange,
  onStartReportReview,
  onRequestReportChanges,
  onResubmitReport,
  onDeliverReport,
  onQueueReportDeliveryNotification,
  reportActionStatus,
  reportEnabled,
  requestedWorkflow,
}: {
  job: JobDetail | null;
  executionEnabled: boolean;
  fieldEvidenceEnabled: boolean;
  isLoading: boolean;
  uploadTickets: PhotoUploadTicket[];
  reportSnapshot: CompletionReportSnapshot | null;
  addOns: JobAddOn[];
  onStart: () => Promise<void>;
  onComplete: () => Promise<void>;
  onChecklistItemChange: (itemId: string, completed: boolean) => Promise<void>;
  onPhotoSelected: (file: File, photoType: FieldPhotoType) => Promise<void>;
  onAddOnStatusChange: (addOnId: string, status: JobAddOn['status']) => Promise<void>;
  onStartReportReview: (reportId: string) => Promise<void>;
  onRequestReportChanges: (reportId: string, reason: string) => Promise<void>;
  onResubmitReport: (reportId: string) => Promise<void>;
  onDeliverReport: (reportId: string) => Promise<void>;
  onQueueReportDeliveryNotification: (
    reportId: string,
    channel: 'email' | 'sms',
    recipient: string,
  ) => Promise<void>;
  reportActionStatus: string | null;
  reportEnabled: boolean;
  requestedWorkflow: JobWorkflowSection;
}) {
  const [photoType, setPhotoType] = useState<FieldPhotoType>('before');
  const [activeWorkflow, setActiveWorkflow] = useState<JobWorkflowSection>(requestedWorkflow);
  const allowedWorkflowSections: JobWorkflowSection[] = [
    'overview',
    ...(fieldEvidenceEnabled ? ['checklist', 'photos'] as JobWorkflowSection[] : []),
    ...(executionEnabled ? ['addons'] as JobWorkflowSection[] : []),
    ...(reportEnabled ? ['report'] as JobWorkflowSection[] : []),
  ];

  useEffect(() => {
    setActiveWorkflow(
      allowedWorkflowSections.includes(requestedWorkflow) ? requestedWorkflow : 'overview',
    );
  }, [executionEnabled, fieldEvidenceEnabled, job?.id, reportEnabled, requestedWorkflow]);

  if (isLoading) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-semibold text-slate-500">Loading job details...</p>
      </aside>
    );
  }

  if (!job) {
    return (
      <aside className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-slate-600 sm:p-5">
        Select a job to view checklist, workflow actions, and local photo upload placeholders.
      </aside>
    );
  }

  const completedChecklistItems = job.checklist.filter((item) => item.completed).length;
  const checklistProgress = job.checklist.length === 0
    ? 0
    : Math.round((completedChecklistItems / job.checklist.length) * 100);
  const beforePhotos = Math.max(
    job.beforePhotos,
    uploadTickets.filter((ticket) => ticket.photoType === 'before').length,
  );
  const afterPhotos = Math.max(
    job.afterPhotos,
    uploadTickets.filter((ticket) => ticket.photoType === 'after').length,
  );
  const missingRequiredEvidence = [
    ...(beforePhotos === 0 ? ['before'] : []),
    ...(afterPhotos === 0 ? ['after'] : []),
  ];
  const pendingAddOns = addOns.filter((addOn) => (
    addOn.status === 'scheduled' || addOn.status === 'in_progress'
  )).length;
  const nextAction = !executionEnabled
    ? 'This rollout unit provides read-only job status. Field actions remain with the assigned crew.'
    : job.status === 'scheduled'
      ? 'Start this job when the crew is ready to begin.'
      : !fieldEvidenceEnabled
        ? 'Continue stop progress from Today’s route; proof actions are outside this rollout unit.'
        : missingRequiredEvidence.length > 0
          ? `Capture ${missingRequiredEvidence.join(' and ')} photo evidence before completing this job.`
          : pendingAddOns > 0
            ? `Finish ${pendingAddOns} approved add-on${pendingAddOns === 1 ? '' : 's'} before the customer report is ready.`
            : checklistProgress < 100
              ? `Finish ${job.checklist.length - completedChecklistItems} checklist item${job.checklist.length - completedChecklistItems === 1 ? '' : 's'} before customer handoff.`
              : 'Required field evidence is ready. Complete the job when service is finished.';

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col items-start justify-between gap-3 min-[380px]:flex-row">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Current service target</p>
            <h2 className="mt-2 font-display text-3xl font-black text-forest">{job.customerName}</h2>
            <p className="mt-1 text-sm text-slate-600">{job.propertyAddress}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Scheduled {job.scheduledDate}</p>
          </div>
          <JobStatusBadge status={job.status} />
        </div>

        {executionEnabled ? <div className="mt-5 rounded-2xl border border-slate-200 bg-paper p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Primary action</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Move this visit forward without losing context.</p>
            </div>
            <WorkspaceStatusBadge tone={!fieldEvidenceEnabled || missingRequiredEvidence.length === 0 ? 'success' : 'warning'}>
              {!fieldEvidenceEnabled
                ? 'Execution enabled'
                : missingRequiredEvidence.length === 0
                  ? 'Evidence ready'
                  : `${missingRequiredEvidence.length} evidence gap${missingRequiredEvidence.length === 1 ? '' : 's'}`}
            </WorkspaceStatusBadge>
          </div>
          <div className="mt-3 grid gap-3 min-[380px]:grid-cols-2">
            <button
              className="min-h-12 rounded-xl border border-emerald-700 px-4 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
              disabled={job.status !== 'scheduled'}
              onClick={() => void onStart()}
              type="button"
            >
              {job.status === 'scheduled' ? 'Start Job' : 'Job Started'}
            </button>
            {fieldEvidenceEnabled ? <button
              className="min-h-12 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={job.status === 'completed' || missingRequiredEvidence.length > 0}
              onClick={() => void onComplete()}
              type="button"
            >
              {job.status === 'completed' ? 'Job Completed' : 'Complete Job'}
            </button> : null}
          </div>
        </div> : (
          <WorkspaceStatusNotice
            className="mt-5"
            compact
            detail="Progress, checklist, photo, add-on, and completion actions remain hidden."
            title="Job oversight is read only."
            tone="info"
          />
        )}

        <JobWorkflowMenu
          activeSection={activeWorkflow}
          addOnCount={addOns.length}
          checklistComplete={completedChecklistItems}
          checklistTotal={job.checklist.length}
          onChange={setActiveWorkflow}
          photoCount={uploadTickets.length}
          reportReady={Boolean(reportSnapshot?.readyForCustomer)}
          allowedSections={allowedWorkflowSections}
        />

        <div
          aria-labelledby="job-workflow-tab-overview"
          className={`${activeWorkflow === 'overview' ? 'block' : 'hidden'} mt-5`}
          id="job-workflow-panel-overview"
          role="tabpanel"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-paper p-3">
              <p className="text-2xl font-black text-forest">{checklistProgress}%</p>
              <p className="text-xs font-bold text-slate-500">Checklist</p>
            </div>
            <div className="rounded-xl bg-paper p-3">
              <p className="text-2xl font-black text-forest">{beforePhotos}</p>
              <p className="text-xs font-bold text-slate-500">Before</p>
            </div>
            <div className="rounded-xl bg-paper p-3">
              <p className="text-2xl font-black text-forest">{afterPhotos}</p>
              <p className="text-xs font-bold text-slate-500">After</p>
            </div>
            <div className="rounded-xl bg-paper p-3">
              <p className="text-2xl font-black text-forest">{pendingAddOns}</p>
              <p className="text-xs font-bold text-slate-500">Open add-ons</p>
            </div>
          </div>
          <WorkspaceStatusNotice
            className="mt-3"
            detail={nextAction}
            title="Next best action"
            tone={fieldEvidenceEnabled && missingRequiredEvidence.length > 0 ? 'warning' : 'info'}
          />
        </div>

        {fieldEvidenceEnabled ? <section
          aria-labelledby="job-workflow-tab-checklist"
          className={`${activeWorkflow === 'checklist' ? 'block' : 'hidden'} mt-5 rounded-xl border border-slate-200 bg-paper px-3`}
          id="job-workflow-panel-checklist"
          role="tabpanel"
        >
          <div className="flex min-h-12 items-center justify-between gap-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Checklist
            <span className="rounded-full bg-white px-2 py-1 text-xs tracking-normal text-slate-600">
              {completedChecklistItems}/{job.checklist.length} complete
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {job.checklist.map((item) => (
              <button
                key={item.id}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-white p-3 text-left"
                onClick={() => void onChecklistItemChange(item.id, !item.completed)}
                type="button"
              >
                <span
                  className={`h-3 w-3 rounded-full ${item.completed ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="h-3" />
        </section> : null}

        {executionEnabled ? (addOns.length > 0 ? (
          <div
            aria-labelledby="job-workflow-tab-addons"
            className={`${activeWorkflow === 'addons' ? 'block' : 'hidden'} mt-5`}
            id="job-workflow-panel-addons"
            role="tabpanel"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-700">Approved add-on work</h3>
            <div className="mt-3 space-y-2">
              {addOns.map((addOn) => (
                <article key={addOn.id} className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-sky-950">{addOn.serviceName}</p>
                      {addOn.serviceDescription ? <p className="mt-1 text-xs text-sky-800">{addOn.serviceDescription}</p> : null}
                      {addOn.note ? <p className="mt-1 text-xs text-sky-700">{addOn.note}</p> : null}
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold uppercase text-sky-800">{addOn.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-sky-800">Quantity {addOn.quantity}</p>
                  {addOn.status === 'scheduled' ? (
                    <button
                      className="mt-3 rounded-lg bg-sky-800 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-900"
                      onClick={() => void onAddOnStatusChange(addOn.id, 'in_progress')}
                    >
                      Start add-on
                    </button>
                  ) : null}
                  {addOn.status === 'in_progress' ? (
                    <button
                      className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                      onClick={() => void onAddOnStatusChange(addOn.id, 'completed')}
                    >
                      Complete add-on
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div
            aria-labelledby="job-workflow-tab-addons"
            className={`${activeWorkflow === 'addons' ? 'block' : 'hidden'} mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600`}
            id="job-workflow-panel-addons"
            role="tabpanel"
          >
            No approved add-on work is attached to this job.
          </div>
        )) : null}

        {fieldEvidenceEnabled ? <div
          aria-labelledby="job-workflow-tab-photos"
          className={`${activeWorkflow === 'photos' ? 'block' : 'hidden'} mt-5 rounded-2xl bg-paper p-4`}
          id="job-workflow-panel-photos"
          role="tabpanel"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Photo evidence</h3>
          <p className="mt-2 text-sm text-slate-600">
            Use a previewable JPEG, PNG, GIF, or WebP image at least 640×480. Duplicate files are blocked, and both before and after evidence are required to complete the job.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              value={photoType}
              onChange={(event) => setPhotoType(event.target.value as FieldPhotoType)}
            >
              <option value="before">Before photo</option>
              <option value="after">After photo</option>
              <option value="issue">Issue photo</option>
              <option value="extra">Extra photo</option>
            </select>
            <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-400 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Choose Photo
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onPhotoSelected(file, photoType);
                    event.currentTarget.value = '';
                  }
                }}
              />
            </label>
          </div>

          {uploadTickets.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadTickets.map((ticket) => (
                <div key={ticket.photoId} className="rounded-xl bg-white p-3 text-xs text-slate-600 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{ticket.fileName}</p>
                      <p className="capitalize">{ticket.photoType} photo</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold uppercase text-slate-500">
                      {ticket.status}
                    </span>
                  </div>
                  <p className="mt-2">{ticket.uploadMode}</p>
                  <p className="break-all">{ticket.objectKey}</p>
                </div>
              ))}
            </div>
          )}
        </div> : null}
      </section>

      {reportEnabled ? <div
        aria-labelledby="job-workflow-tab-report"
        className={activeWorkflow === 'report' ? 'block' : 'hidden'}
        id="job-workflow-panel-report"
        role="tabpanel"
      >
      <CompletionReport
        job={job}
        uploadTickets={uploadTickets}
        reportSnapshot={reportSnapshot}
        onStartReview={onStartReportReview}
        onRequestChanges={onRequestReportChanges}
        onResubmit={onResubmitReport}
        onDeliver={onDeliverReport}
        onQueueDeliveryNotification={onQueueReportDeliveryNotification}
        actionStatus={reportActionStatus}
      />
      </div> : null}
    </div>
  );
}
