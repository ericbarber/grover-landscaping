import { useEffect, useMemo, useState } from 'react';
import {
  completeJob,
  completePhotoUpload,
  createPhotoUploadTicket,
  deliverCompletionReport,
  fetchCompletionReport,
  fetchCompletionReports,
  fetchJobDetail,
  fetchJobAddOns,
  fetchJobs,
  requestCompletionReportChanges,
  resubmitCompletionReport,
  startJob,
  startCompletionReportReview,
  uploadPhotoToTicket,
  updateJobAddOnStatus,
  type CompletionReportSnapshot,
  type JobDetail,
  type JobAddOn,
  type PhotoUploadTicket,
} from './api/client';
import { CompletionReport } from './components/CompletionReport';
import { CustomerPortfolioSummaryPanel } from './components/CustomerPortfolioSummaryPanel';
import { DayPlanPanel } from './components/DayPlanPanel';
import { ManagerActivityHistoryPanel } from './components/ManagerActivityHistoryPanel';
import { ManagerCompletionReportQueuePanel } from './components/ManagerCompletionReportQueuePanel';
import { ManagerDayPlanPanel } from './components/ManagerDayPlanPanel';
import {
  companyNeedsOnboardingAttention,
  companySupportsMultipleCrews,
  countCustomerBidsToReview,
  countReadyCustomerReports,
  customerNeedsOnboardingAttention,
  filterCrewsForCompany,
  filterPropertiesForCustomerPortal,
  filterWorkSummariesForCustomerPortal,
  getCompletionProgress,
  getContractedServiceCount,
  getCustomerPropertyCount,
  getEnabledCrewCapacityMinutes,
  getEnabledCrewCount,
  seedJobs,
  type CompanyProfile,
  type CrewProfile,
  type CustomerAccountProfile,
  type CustomerPortalWorkSummary,
  type CustomerPropertyProfile,
  type YardCareJob,
} from './domain/jobs';
import {
  prependManagerActivity,
  seedManagerActivityItems,
  type ManagerActivityItem,
} from './domain/managerActivity';
import {
  readStoredManagerActivityItems,
  writeStoredManagerActivityItems,
} from './domain/managerActivityLocalStore';
import type { PortfolioPropertyLink, PropertyPortfolio } from './domain/propertyPortfolios';

type PhotoType = 'before' | 'after' | 'issue' | 'extra';

type NewManagerActivity = Pick<ManagerActivityItem, 'title' | 'message' | 'tone' | 'source'>;

const managementCompanyPreview: CompanyProfile = {
  id: 'company_demo_property_manager',
  displayName: 'Demo Property Management Co.',
  companyType: 'property_manager',
  onboardingStatus: 'active',
};

const managementCompanyPreviewCrews: CrewProfile[] = [
  {
    id: 'crew_north_route',
    companyId: 'company_demo_property_manager',
    displayName: 'North route crew',
    serviceArea: 'North service area',
    defaultCapacityMinutes: 420,
    enabled: true,
  },
  {
    id: 'crew_south_route',
    companyId: 'company_demo_property_manager',
    displayName: 'South route crew',
    serviceArea: 'South service area',
    defaultCapacityMinutes: 360,
    enabled: true,
  },
  {
    id: 'crew_onboarding',
    companyId: 'company_demo_property_manager',
    displayName: 'New crew onboarding',
    serviceArea: 'Pending service area',
    defaultCapacityMinutes: 300,
    enabled: false,
  },
];

const customerPortalPreviewCustomer: CustomerAccountProfile = {
  id: 'customer_1001',
  displayName: 'Sample Customer',
  onboardingStatus: 'active',
  organizationId: 'org_demo_landscaping',
};

const customerPortalPreviewProperties: CustomerPropertyProfile[] = [
  {
    id: 'property_1001',
    customerId: 'customer_1001',
    organizationId: 'org_demo_landscaping',
    displayName: 'Sample Customer Home',
    address: '123 Oak Street',
    serviceFrequency: 'weekly',
    contractedServiceIds: ['service_standard_yard_care', 'service_sprinkler_repair'],
  },
  {
    id: 'property_1002',
    customerId: 'customer_1001',
    organizationId: 'org_demo_landscaping',
    displayName: 'Backyard Renovation Area',
    address: '123 Oak Street',
    serviceFrequency: 'seasonal',
    contractedServiceIds: ['service_tree_limb_removal'],
  },
];

const customerPortalPreviewPortfolios: PropertyPortfolio[] = [
  {
    id: 'portfolio_1001',
    accountId: 'customer_1001',
    organizationId: 'org_demo_landscaping',
    displayName: 'Primary residence',
    portfolioType: 'individual_owner',
  },
];

const customerPortalPreviewPortfolioLinks: PortfolioPropertyLink[] = [
  {
    id: 'portfolio_link_1001',
    portfolioId: 'portfolio_1001',
    propertyId: 'property_1001',
    organizationId: 'org_demo_landscaping',
  },
];

const customerPortalPreviewWorkSummaries: CustomerPortalWorkSummary[] = [
  {
    id: 'work_1001',
    customerId: 'customer_1001',
    organizationId: 'org_demo_landscaping',
    propertyId: 'property_1001',
    title: 'Weekly yard care report',
    status: 'completed',
    reportReady: true,
    bidReviewRequired: false,
  },
  {
    id: 'work_1002',
    customerId: 'customer_1001',
    organizationId: 'org_demo_landscaping',
    propertyId: 'property_1002',
    title: 'Tree limb removal bid',
    status: 'bid_review',
    reportReady: false,
    bidReviewRequired: true,
  },
  {
    id: 'work_1003',
    customerId: 'customer_1001',
    organizationId: 'org_demo_landscaping',
    propertyId: 'property_1001',
    title: 'Next weekly visit',
    status: 'scheduled',
    reportReady: false,
    bidReviewRequired: false,
  },
];

function managerActivityTimestamp() {
  return `Today ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

function StatusBadge({ status }: { status: YardCareJob['status'] }) {
  const label = status.replace('_', ' ');

  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
      {label}
    </span>
  );
}

function JobCard({
  job,
  isSelected,
  onSelect,
}: {
  job: YardCareJob;
  isSelected: boolean;
  onSelect: (jobId: string) => void;
}) {
  const progress = getCompletionProgress(job);

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        isSelected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{job.scheduledDate}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">{job.customerName}</h3>
          <p className="mt-1 text-sm text-slate-600">{job.propertyAddress}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{job.beforePhotos}</p>
          <p className="text-xs text-slate-500">Before</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{job.afterPhotos}</p>
          <p className="text-xs text-slate-500">After</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{progress}%</p>
          <p className="text-xs text-slate-500">Ready</p>
        </div>
      </div>

      <button
        className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
        onClick={() => onSelect(job.id)}
      >
        {isSelected ? 'Selected Job' : 'Open Job'}
      </button>
    </article>
  );
}

function companyTypeLabel(companyType: CompanyProfile['companyType']): string {
  return companyType.replace('_', ' ');
}

function frequencyLabel(frequency: CustomerPropertyProfile['serviceFrequency']): string {
  return frequency.replace('_', ' ');
}

function workStatusLabel(status: CustomerPortalWorkSummary['status']): string {
  return status.replace('_', ' ');
}

function ManagementCompanyPreviewPanel({
  company,
  crews,
}: {
  company: CompanyProfile;
  crews: CrewProfile[];
}) {
  const visibleCrews = filterCrewsForCompany(crews, company.id);
  const enabledCrewCount = getEnabledCrewCount(visibleCrews);
  const enabledCapacityHours = Math.round((getEnabledCrewCapacityMinutes(visibleCrews) / 60) * 10) / 10;
  const needsOnboardingAttention = companyNeedsOnboardingAttention(company);
  const supportsMultipleCrews = companySupportsMultipleCrews(company, visibleCrews);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Management company preview</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{company.displayName}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Companies with several crews need a fast view of crew readiness, service areas, and total daily capacity.
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            needsOnboardingAttention ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
          }`}
        >
          {needsOnboardingAttention ? 'Needs onboarding' : companyTypeLabel(company.companyType)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-2xl font-bold text-slate-950">{enabledCrewCount}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Enabled crews</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-2xl font-bold text-slate-950">{enabledCapacityHours}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Capacity hours</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-2xl font-bold text-slate-950">{supportsMultipleCrews ? 'Yes' : 'No'}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Multi-crew</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {visibleCrews.map((crew) => (
          <article key={crew.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-950">{crew.displayName}</h3>
                <p className="text-sm text-slate-600">{crew.serviceArea}</p>
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  crew.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {crew.enabled ? 'Enabled' : 'Onboarding'}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Daily capacity:</span> {crew.defaultCapacityMinutes} minutes
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CustomerPortalPreviewPanel({
  customer,
  properties,
  workSummaries,
}: {
  customer: CustomerAccountProfile;
  properties: CustomerPropertyProfile[];
  workSummaries: CustomerPortalWorkSummary[];
}) {
  const visibleProperties = filterPropertiesForCustomerPortal(properties, customer);
  const visibleWorkSummaries = filterWorkSummariesForCustomerPortal(workSummaries, customer);
  const propertyCount = getCustomerPropertyCount(visibleProperties, customer.id);
  const reportsReadyCount = countReadyCustomerReports(visibleWorkSummaries);
  const bidsToReviewCount = countCustomerBidsToReview(visibleWorkSummaries);
  const needsOnboardingAttention = customerNeedsOnboardingAttention(customer);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Customer portal preview</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{customer.displayName}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Property owners will use this view to track upcoming work, completed services, reports, photos, and bids.
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            needsOnboardingAttention ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {needsOnboardingAttention ? 'Needs onboarding' : 'Portal ready'}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-2xl font-bold text-slate-950">{propertyCount}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Properties</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-2xl font-bold text-slate-950">{reportsReadyCount}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reports ready</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-2xl font-bold text-slate-950">{bidsToReviewCount}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bid to review</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {visibleProperties.map((property) => {
          const propertyWork = visibleWorkSummaries.filter((workSummary) => workSummary.propertyId === property.id);

          return (
            <article key={property.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">{property.displayName}</h3>
                  <p className="text-sm text-slate-600">{property.address}</p>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  {frequencyLabel(property.serviceFrequency)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <p>
                  <span className="font-semibold text-slate-800">Services:</span> {getContractedServiceCount(property)}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Work:</span> {propertyWork.length}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Evidence:</span> Photos and checklist
                </p>
              </div>
              {propertyWork.length > 0 && (
                <div className="mt-3 space-y-2">
                  {propertyWork.map((workSummary) => (
                    <div key={workSummary.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">{workSummary.title}</span>
                      <span className="ml-2 text-xs uppercase tracking-wide text-slate-500">
                        {workStatusLabel(workSummary.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function JobDetailPanel({
  job,
  isLoading,
  uploadTickets,
  reportSnapshot,
  addOns,
  onStart,
  onComplete,
  onPhotoSelected,
  onAddOnStatusChange,
  onStartReportReview,
  onRequestReportChanges,
  onResubmitReport,
  onDeliverReport,
  reportActionStatus,
}: {
  job: JobDetail | null;
  isLoading: boolean;
  uploadTickets: PhotoUploadTicket[];
  reportSnapshot: CompletionReportSnapshot | null;
  addOns: JobAddOn[];
  onStart: () => Promise<void>;
  onComplete: () => Promise<void>;
  onPhotoSelected: (file: File, photoType: PhotoType) => Promise<void>;
  onAddOnStatusChange: (addOnId: string, status: JobAddOn['status']) => Promise<void>;
  onStartReportReview: (reportId: string) => Promise<void>;
  onRequestReportChanges: (reportId: string, reason: string) => Promise<void>;
  onResubmitReport: (reportId: string) => Promise<void>;
  onDeliverReport: (reportId: string) => Promise<void>;
  reportActionStatus: string | null;
}) {
  const [photoType, setPhotoType] = useState<PhotoType>('before');

  if (isLoading) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Loading job details...</p>
      </aside>
    );
  }

  if (!job) {
    return (
      <aside className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-slate-600">
        Select a job to view checklist, workflow actions, and local photo upload placeholders.
      </aside>
    );
  }

  return (
    <div className="space-y-6">
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Job detail</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">{job.customerName}</h2>
            <p className="mt-1 text-sm text-slate-600">{job.propertyAddress}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Checklist</h3>
          <div className="mt-3 space-y-2">
            {job.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <span
                  className={`h-3 w-3 rounded-full ${item.completed ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {addOns.length > 0 ? (
          <div className="mt-6">
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
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="rounded-xl border border-emerald-700 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            onClick={() => void onStart()}
          >
            Start Job
          </button>
          <button
            className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            onClick={() => void onComplete()}
          >
            Complete Job
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Photo evidence</h3>
          <p className="mt-2 text-sm text-slate-600">
            This flow uses the backend upload-ticket endpoint and uploads directly when object storage is configured.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              value={photoType}
              onChange={(event) => setPhotoType(event.target.value as PhotoType)}
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
        </div>
      </aside>

      <CompletionReport
        job={job}
        uploadTickets={uploadTickets}
        reportSnapshot={reportSnapshot}
        onStartReview={onStartReportReview}
        onRequestChanges={onRequestReportChanges}
        onResubmit={onResubmitReport}
        onDeliver={onDeliverReport}
        actionStatus={reportActionStatus}
      />
    </div>
  );
}

function fallbackJobDetail(job: YardCareJob): JobDetail {
  return {
    ...job,
    checklist: [
      { id: 'before-photos', label: 'Capture before photos', completed: job.beforePhotos > 0 },
      { id: 'yard-service', label: 'Complete yard service', completed: job.status !== 'scheduled' },
      { id: 'after-photos', label: 'Capture after photos', completed: job.afterPhotos > 0 },
      { id: 'completion-notes', label: 'Submit completion notes', completed: job.status === 'completed' },
    ],
  };
}

function localPhotoTicket(jobId: string, file: File, photoType: PhotoType): PhotoUploadTicket {
  return {
    status: 'created',
    jobId,
    photoId: `local_${jobId}_${photoType}_${Date.now()}`,
    photoType,
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    uploadMode: 'browser-local-placeholder',
    uploadUrl: `local://${file.name}`,
    objectKey: `browser/jobs/${jobId}/${photoType}/${file.name}`,
    thumbnailUrl: URL.createObjectURL(file),
  };
}

function mergePhotoEvidence(
  current: PhotoUploadTicket[],
  jobId: string,
  persistedEvidence: PhotoUploadTicket[],
): PhotoUploadTicket[] {
  const persistedIds = new Set(persistedEvidence.map((photo) => photo.photoId));
  const currentJobLocalEvidence = current.filter(
    (photo) => photo.jobId === jobId && !persistedIds.has(photo.photoId),
  );
  const otherJobEvidence = current.filter((photo) => photo.jobId !== jobId);

  return [...persistedEvidence, ...currentJobLocalEvidence, ...otherJobEvidence];
}

export function App() {
  const [jobs, setJobs] = useState<YardCareJob[]>(seedJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(seedJobs[0]?.id ?? null);
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [selectedJobAddOns, setSelectedJobAddOns] = useState<JobAddOn[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading jobs from local API...');
  const [uploadTickets, setUploadTickets] = useState<PhotoUploadTicket[]>([]);
  const [selectedCompletionReport, setSelectedCompletionReport] = useState<CompletionReportSnapshot | null>(null);
  const [completionReportSnapshots, setCompletionReportSnapshots] = useState<Record<string, CompletionReportSnapshot>>({});
  const [isLoadingReportQueue, setIsLoadingReportQueue] = useState(false);
  const [completionReportActionStatus, setCompletionReportActionStatus] = useState<string | null>(null);
  const [dayPlanRefreshSignal, setDayPlanRefreshSignal] = useState(0);
  const [managerActivity, setManagerActivity] = useState<ManagerActivityItem[]>(() =>
    readStoredManagerActivityItems(seedManagerActivityItems),
  );
  const [isManagerActivityPersisted, setIsManagerActivityPersisted] = useState(true);

  const selectedJobTickets = useMemo(
    () => uploadTickets.filter((ticket) => ticket.jobId === selectedJobId),
    [selectedJobId, uploadTickets],
  );
  const managerReportQueueReports = useMemo(
    () => Object.values(completionReportSnapshots),
    [completionReportSnapshots],
  );

  function recordManagerActivity(item: NewManagerActivity) {
    setManagerActivity((current) =>
      prependManagerActivity(current, {
        ...item,
        id: `${item.source}_${item.tone}_${Date.now()}`,
        occurredAt: managerActivityTimestamp(),
      }),
    );
  }

  function resetManagerActivityHistory() {
    setManagerActivity(seedManagerActivityItems);
    setIsManagerActivityPersisted(writeStoredManagerActivityItems(seedManagerActivityItems));
  }

  useEffect(() => {
    setIsManagerActivityPersisted(writeStoredManagerActivityItems(managerActivity));
  }, [managerActivity]);

  useEffect(() => {
    let isMounted = true;

    fetchJobs()
      .then((apiJobs) => {
        if (!isMounted) {
          return;
        }

        setJobs(apiJobs);
        setSelectedJobId((current) => current ?? apiJobs[0]?.id ?? null);
        setStatusMessage('Connected to the local API.');
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setJobs(seedJobs);
        setSelectedJobId((current) => current ?? seedJobs[0]?.id ?? null);
        setStatusMessage('Using seed data because the local API is not reachable yet.');
        recordManagerActivity({
          title: 'Seed data fallback active',
          message: 'The dashboard is using seed jobs because the API is not reachable.',
          tone: 'warning',
          source: 'sync',
        });
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingJobs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJob(null);
      setSelectedCompletionReport(null);
      return;
    }

    let isMounted = true;
    setIsLoadingDetail(true);

    fetchJobDetail(selectedJobId)
      .then((detail) => {
        if (isMounted) {
          setSelectedJob(detail);
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallback = jobs.find((job) => job.id === selectedJobId) ?? null;
          setSelectedJob(fallback ? fallbackJobDetail(fallback) : null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDetail(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [jobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJobAddOns([]);
      return;
    }

    let isMounted = true;
    fetchJobAddOns(selectedJobId)
      .then((addOns) => {
        if (isMounted) setSelectedJobAddOns(addOns);
      })
      .catch(() => {
        if (isMounted) setSelectedJobAddOns([]);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedJobId]);

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedCompletionReport(null);
      return;
    }

    let isMounted = true;
    setSelectedCompletionReport(null);

    fetchCompletionReport(selectedJobId)
      .then((report) => {
        if (isMounted) {
          setSelectedCompletionReport(report);
          setCompletionReportSnapshots((current) => ({ ...current, [report.jobId]: report }));
          setUploadTickets((current) => mergePhotoEvidence(current, selectedJobId, report.photoEvidence));
        }
      })
      .catch(() => {
        if (isMounted) {
          recordManagerActivity({
            title: 'Completion report fallback active',
            message: `${selectedJobId} completion report is using browser-local evidence until the API is reachable.`,
            tone: 'warning',
            source: 'photo',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedJobId]);

  useEffect(() => {
    if (jobs.length === 0) {
      setCompletionReportSnapshots({});
      return;
    }

    let isMounted = true;
    setIsLoadingReportQueue(true);
    const applyReports = (reports: CompletionReportSnapshot[]) => {
      setCompletionReportSnapshots((current) => {
        const next = { ...current };
        reports.forEach((report) => {
          next[report.jobId] = report;
        });
        return next;
      });
    };

    fetchCompletionReports()
      .then((reports) => {
        if (!isMounted) return;
        applyReports(reports);
      })
      .catch(() =>
        Promise.allSettled(jobs.map((job) => fetchCompletionReport(job.id))).then((results) => {
          if (!isMounted) return;

          const reports = results
            .filter((result): result is PromiseFulfilledResult<CompletionReportSnapshot> => result.status === 'fulfilled')
            .map((result) => result.value);
          applyReports(reports);

          if (results.some((result) => result.status === 'rejected')) {
            recordManagerActivity({
              title: 'Report queue partially loaded',
              message: 'Some completion report snapshots could not be loaded for the manager review queue.',
              tone: 'warning',
              source: 'sync',
            });
          }
        }),
      )
      .finally(() => {
        if (isMounted) setIsLoadingReportQueue(false);
      });

    return () => {
      isMounted = false;
    };
  }, [jobs]);

  async function handleStartJob() {
    if (!selectedJobId) {
      return;
    }

    try {
      await startJob(selectedJobId);
      setStatusMessage(`Started ${selectedJobId}.`);
    } catch {
      setStatusMessage(`Started ${selectedJobId} locally because the API is not reachable.`);
      recordManagerActivity({
        title: 'Job started locally',
        message: `${selectedJobId} was started in browser state because the API is not reachable.`,
        tone: 'warning',
        source: 'job',
      });
    }

    setJobs((current) => current.map((job) => (job.id === selectedJobId ? { ...job, status: 'in_progress' } : job)));
  }

  async function handleCompleteJob() {
    if (!selectedJobId) {
      return;
    }

    try {
      await completeJob(selectedJobId);
      setStatusMessage(`Completed ${selectedJobId}.`);
      recordManagerActivity({
        title: 'Job completion ready',
        message: `${selectedJobId} was completed and is ready for manager review.`,
        tone: 'success',
        source: 'job',
      });
    } catch {
      setStatusMessage(`Completed ${selectedJobId} locally because the API is not reachable.`);
      recordManagerActivity({
        title: 'Job completed locally',
        message: `${selectedJobId} was completed locally because the API is not reachable.`,
        tone: 'warning',
        source: 'job',
      });
    }

    setJobs((current) => current.map((job) => (job.id === selectedJobId ? { ...job, status: 'completed' } : job)));
  }

  async function handleAddOnStatusChange(addOnId: string, status: JobAddOn['status']) {
    if (!selectedJobId) return;

    try {
      const updated = await updateJobAddOnStatus(selectedJobId, addOnId, status);
      setSelectedJobAddOns((current) => current.map((addOn) => (addOn.id === updated.id ? updated : addOn)));
      setStatusMessage(`${updated.serviceName} marked ${status.replace('_', ' ')}.`);

      if (status === 'completed') {
        const report = await fetchCompletionReport(selectedJobId);
        setSelectedCompletionReport(report);
      }
    } catch {
      setStatusMessage('Could not update add-on work. Check the API connection and try again.');
    }
  }

  async function refreshCompletionReport(jobId: string) {
    const report = await fetchCompletionReport(jobId);
    setSelectedCompletionReport(report);
    setCompletionReportSnapshots((current) => ({ ...current, [report.jobId]: report }));
    setUploadTickets((current) => mergePhotoEvidence(current, jobId, report.photoEvidence));
    return report;
  }

  async function refreshManagerReportQueue() {
    if (jobs.length === 0) return;

    setIsLoadingReportQueue(true);
    try {
      let reports: CompletionReportSnapshot[];
      try {
        reports = await fetchCompletionReports();
      } catch {
        reports = await Promise.all(jobs.map((job) => fetchCompletionReport(job.id)));
      }
      setCompletionReportSnapshots(
        reports.reduce<Record<string, CompletionReportSnapshot>>((next, report) => {
          next[report.jobId] = report;
          return next;
        }, {}),
      );
      setStatusMessage('Completion report review queue refreshed.');
    } catch {
      setStatusMessage('Could not refresh every completion report. Check the API connection and try again.');
      recordManagerActivity({
        title: 'Report queue refresh failed',
        message: 'The manager completion report queue could not refresh all job reports.',
        tone: 'warning',
        source: 'sync',
      });
    } finally {
      setIsLoadingReportQueue(false);
    }
  }

  async function handleStartReportReview(reportId: string) {
    setCompletionReportActionStatus('Starting manager review...');

    try {
      const action = await startCompletionReportReview(reportId);
      await refreshCompletionReport(action.jobId);
      setStatusMessage(`${action.reportId} is in manager review.`);
      setCompletionReportActionStatus(null);
      recordManagerActivity({
        title: 'Completion report in review',
        message: `${action.reportId} moved into manager review.`,
        tone: 'success',
        source: 'job',
      });
    } catch {
      setCompletionReportActionStatus(null);
      setStatusMessage('Could not start manager review. Confirm the report is submitted and persisted.');
    }
  }

  async function handleRequestReportChanges(reportId: string, reason: string) {
    setCompletionReportActionStatus('Requesting report changes...');

    try {
      const action = await requestCompletionReportChanges(reportId, reason);
      await refreshCompletionReport(action.jobId);
      setStatusMessage(`${action.reportId} has changes requested.`);
      setCompletionReportActionStatus(null);
      recordManagerActivity({
        title: 'Completion report changes requested',
        message: reason.trim() || `${action.reportId} needs crew follow-up before delivery.`,
        tone: 'warning',
        source: 'job',
      });
    } catch {
      setCompletionReportActionStatus(null);
      setStatusMessage('Could not request changes. Confirm the report is currently in review.');
    }
  }

  async function handleResubmitReport(reportId: string) {
    setCompletionReportActionStatus('Resubmitting completion report...');

    try {
      const action = await resubmitCompletionReport(reportId);
      await refreshCompletionReport(action.jobId);
      setStatusMessage(`${action.reportId} resubmitted for manager review.`);
      setCompletionReportActionStatus(null);
      recordManagerActivity({
        title: 'Completion report resubmitted',
        message: `${action.reportId} returned to the manager review queue.`,
        tone: 'success',
        source: 'job',
      });
    } catch {
      setCompletionReportActionStatus(null);
      setStatusMessage('Could not resubmit. Confirm the report is change-requested and delivery-ready.');
    }
  }

  async function handleDeliverReport(reportId: string) {
    setCompletionReportActionStatus('Delivering completion report...');

    try {
      const action = await deliverCompletionReport(reportId);
      await refreshCompletionReport(action.jobId);
      setStatusMessage(`${action.reportId} delivered to the customer portal.`);
      setCompletionReportActionStatus(null);
      recordManagerActivity({
        title: 'Completion report delivered',
        message: action.shareUrl
          ? `${action.reportId} is delivered with a share link.`
          : `${action.reportId} is delivered.`,
        tone: 'success',
        source: 'job',
      });
    } catch {
      setCompletionReportActionStatus(null);
      setStatusMessage('Could not deliver. Confirm the report passed review and delivery readiness checks.');
    }
  }

  async function handlePhotoSelected(file: File, photoType: PhotoType) {
    if (!selectedJobId) {
      return;
    }

    let ticket: PhotoUploadTicket;

    try {
      ticket = await createPhotoUploadTicket(selectedJobId, file, photoType);
      await uploadPhotoToTicket(ticket, file);
      await completePhotoUpload(selectedJobId, ticket.photoId);
      ticket = { ...ticket, status: 'uploaded' };
      setStatusMessage(`Uploaded ${photoType} photo evidence for ${file.name}.`);
      recordManagerActivity({
        title: 'Photo evidence uploaded',
        message: `${photoType} photo evidence was uploaded for ${selectedJobId}.`,
        tone: 'success',
        source: 'photo',
      });
    } catch {
      ticket = localPhotoTicket(selectedJobId, file, photoType);
      setStatusMessage(`Prepared ${photoType} photo locally because the API is not reachable.`);
      recordManagerActivity({
        title: 'Photo evidence saved locally',
        message: `${photoType} photo evidence for ${selectedJobId} is browser-local until the API is reachable.`,
        tone: 'warning',
        source: 'photo',
      });
    }

    setUploadTickets((current) => [ticket, ...current]);
    setJobs((current) =>
      current.map((job) => {
        if (job.id !== selectedJobId) {
          return job;
        }

        if (photoType === 'before') {
          return { ...job, beforePhotos: job.beforePhotos + 1 };
        }

        if (photoType === 'after') {
          return { ...job, afterPhotos: job.afterPhotos + 1 };
        }

        return job;
      }),
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Grover Landscaping</p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-5xl">Crew completion dashboard</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Track assigned yard-care jobs, capture before and after photos, and prepare completion reports for review.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
              <p className="font-semibold text-white">Today</p>
              <p>{isLoadingJobs ? 'Loading...' : `${jobs.length} assigned jobs`}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px]">
        <div>
          <DayPlanPanel onSelectJob={setSelectedJobId} refreshSignal={dayPlanRefreshSignal} />
          <div className="mt-6">
            <ManagerDayPlanPanel
              jobs={jobs}
              onDayPlanPublished={(dayPlan) => {
                setDayPlanRefreshSignal((current) => current + 1);
                recordManagerActivity({
                  title: 'Day plan published',
                  message: `${dayPlan.crewId} route for ${dayPlan.serviceDate} was published and crew route refreshed.`,
                  tone: 'success',
                  source: 'route',
                });
              }}
            />
          </div>
          <div className="mt-6">
            <ManagementCompanyPreviewPanel
              company={managementCompanyPreview}
              crews={managementCompanyPreviewCrews}
            />
          </div>
          <div className="mt-6">
            <CustomerPortalPreviewPanel
              customer={customerPortalPreviewCustomer}
              properties={customerPortalPreviewProperties}
              workSummaries={customerPortalPreviewWorkSummaries}
            />
          </div>
          <div className="mt-6">
            <CustomerPortfolioSummaryPanel
              customer={customerPortalPreviewCustomer}
              portfolios={customerPortalPreviewPortfolios}
              properties={customerPortalPreviewProperties}
              links={customerPortalPreviewPortfolioLinks}
            />
          </div>
          <div className="mt-6">
            <ManagerActivityHistoryPanel
              items={managerActivity}
              isHistoryPersisted={isManagerActivityPersisted}
              onResetHistory={resetManagerActivityHistory}
            />
          </div>
          <div className="mt-6">
            <ManagerCompletionReportQueuePanel
              reports={managerReportQueueReports}
              isLoading={isLoadingReportQueue}
              onRefresh={() => void refreshManagerReportQueue()}
              onSelectJob={setSelectedJobId}
            />
          </div>

          <div className="mt-6 mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Assigned jobs</h2>
              <p className="text-sm text-slate-600">{statusMessage}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={job.id === selectedJobId}
                onSelect={setSelectedJobId}
              />
            ))}
          </div>
        </div>

        <JobDetailPanel
          job={selectedJob}
          isLoading={isLoadingDetail}
          addOns={selectedJobAddOns}
          uploadTickets={selectedJobTickets}
          reportSnapshot={selectedCompletionReport?.jobId === selectedJobId ? selectedCompletionReport : null}
          onStart={handleStartJob}
          onComplete={handleCompleteJob}
          onPhotoSelected={handlePhotoSelected}
          onAddOnStatusChange={handleAddOnStatusChange}
          onStartReportReview={handleStartReportReview}
          onRequestReportChanges={handleRequestReportChanges}
          onResubmitReport={handleResubmitReport}
          onDeliverReport={handleDeliverReport}
          reportActionStatus={completionReportActionStatus}
        />
      </section>
    </main>
  );
}
