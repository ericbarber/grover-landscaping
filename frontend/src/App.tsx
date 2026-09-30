import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiRequestError, isApiErrorCode } from './api/apiError';
import {
  completeJob,
  completeDispatchCustomerNotification,
  completePhotoUpload,
  createPhotoUploadTicket,
  deliverCompletionReport,
  eraseCustomerPhotoEvidence,
  fetchCompletionReport,
  fetchCompletionReports,
  updateJobDispatchAssignment,
  fetchCustomerPrivacyExport,
  fetchJobDetail,
  fetchJobPhotoEvidence,
  fetchJobs,
  fetchNotificationHistory,
  fetchOperationalActivity,
  fetchPhotoErasureDeletionHistory,
  fetchPhotoProcessingHistory,
  fetchPropertyCompletionReports,
  requestCompletionReportChanges,
  queueCompletionReportDeliveryNotification,
  readPhotoUploadMetadata,
  resolveNotificationDelivery,
  resolvePhotoErasureDeletionJob,
  resolvePhotoProcessingJob,
  retryNotificationDelivery,
  retryPhotoErasureDeletionJob,
  retryPhotoProcessingJob,
  resubmitCompletionReport,
  startJob,
  updateChecklistItem,
  startCompletionReportReview,
  uploadPhotoToTicket,
  updateJobAddOnStatus,
  type CompletionReportSnapshot,
  type CustomerPropertyRecord,
  type CustomerPhotoErasureSummary,
  type CustomerPrivacyExport,
  type JobAddOn,
  type NotificationHistoryItem,
  type OperationalActivity,
  type PhotoErasureDeletionHistoryItem,
  type PhotoProcessingHistoryItem,
  type PhotoUploadTicket,
  type PropertyCompletionReportSummary,
} from './api/client';
import { fetchAccountProjectBids } from './api/projectBidsClient';
import { fetchCustomerPortalVisits } from './api/customerPortalClient';
import { useAuth } from './auth/AuthProvider';
import type { CrewRouteOverview } from './domain/dayPlans';
import {
  enqueueChecklistMutation,
  enqueueJobLifecycleMutation,
  enqueuePhotoUploadMutation,
  getOfflinePhotoBlob,
  isChecklistOfflineMutation,
  isOfflineMutationConflict,
  isJobLifecycleOfflineMutation,
  isPhotoUploadOfflineMutation,
  listOfflineMutationsForActor,
  markOfflineMutationFailed,
  removeOfflineMutation,
  requestPersistentOfflineStorage,
  type ChecklistOfflineMutation,
  type JobLifecycleOfflineMutation,
  type PhotoUploadOfflineMutation,
} from './domain/offlineMutationQueue';
import {
  MissingOfflinePhotoBlobError,
  replayOfflinePhotoMutation,
} from './domain/offlinePhotoReplay';
import {
  assessPhotoQuality,
  photoQualityMessage,
  requiredPhotoEvidence,
} from './domain/photoQuality';
import { workspaceGuidanceForRoles, workspaceRolesForAccess } from './domain/workspaceAccess';
import { useWorkspaceSelection } from './workspaces/core/useWorkspaceSelection';
import {
  DesktopWorkspaceNavigation,
  MobileWorkspaceHeader,
  MobileWorkspaceNavigation,
  mobileWorkspaceScrollTop,
  type MobileWorkspaceView,
} from './components/MobileWorkspaceShell';
import {
  ManagerWorkspaceMenu,
  ManagerWorkspaceToolMenu,
} from './components/ManagerWorkspaceMenu';
import {
  managerWorkspaceActiveToolForPersona,
  managerWorkspaceSectionSignalsForPersona,
  managerWorkspaceSectionsForPersona,
  managerWorkspaceToolsForPersona,
  type ManagerWorkspaceSection,
  type ManagerWorkspaceTool,
} from './workspaces/features/management/managerWorkspace';
import type { JobWorkflowSection } from './components/JobWorkflowMenu';
import {
  CustomerHistoryMenu,
  type CustomerHistoryView,
} from './components/CustomerHistoryMenu';
import {
  WorkspaceHomePanel,
} from './components/WorkspaceHomePanel';
import {
  homeGreeting,
  personaHomeHeadline,
  personaHomePromise,
  personaProgressLanguage,
} from './workspaces/features/home/workspaceHome';
import {
  customerHomeWorkSummary,
  customerWorkspaceModeForPersona,
  personaUsesAuthorizedCustomerRead,
  personaUsesManagerCustomerPreview,
  type CustomerPortalReadState,
} from './workspaces/features/customer/customerWorkspace';
import {
  createLocalPhotoTicket,
  fieldRecoveryState,
  mergePhotoEvidence,
  type FieldPhotoType,
} from './workspaces/features/field/fieldWorkspace';
import { useFieldJobSelection } from './workspaces/features/field/useFieldJobSelection';
import { WorkspaceStatusBadge, WorkspaceStatusNotice } from './components/WorkspaceStatus';
import { AssignedJobsPanel } from './components/AssignedJobsPanel';
import { FieldOfflineRecoveryPanel } from './components/FieldOfflineRecoveryPanel';
import { JobDetailPanel } from './components/JobDetailPanel';
import { CustomerPortfolioSummaryPanel } from './components/CustomerPortfolioSummaryPanel';
import { PropertyManagerAuthorizedPortfolioPanel } from './components/PropertyManagerAuthorizedPortfolioPanel';
import { YardOwnerPortalPanel } from './components/YardOwnerPortalPanel';
import { providerEntryModeFromSearch } from './domain/providerEntryRoute';
import { DayPlanPanel } from './components/DayPlanPanel';
import { FirstOwnerOnboardingPanel } from './components/FirstOwnerOnboardingPanel';
import { ManagerActivityHistoryPanel } from './components/ManagerActivityHistoryPanel';
import { ManagerCompletionReportQueuePanel } from './components/ManagerCompletionReportQueuePanel';
import { ProviderCustomerVisitQuestionsPanel } from './components/ProviderCustomerVisitQuestionsPanel';
import { ManagerMarketingLeadInboxPanel } from './components/ManagerMarketingLeadInboxPanel';
import { ManagerMarketingConversionDashboard } from './components/ManagerMarketingConversionDashboard';
import { ManagerDispatchWorkloadPanel } from './components/ManagerDispatchWorkloadPanel';
import { ManagerDispatchHierarchyPanel } from './components/ManagerDispatchHierarchyPanel';
import {
  matchesCompletionReportOperationalFilters,
  type CompletionReportOperationalFilters,
} from './domain/completionReportOperationalFilters';
import { ManagerCustomerPrivacyPanel } from './components/ManagerCustomerPrivacyPanel';
import { ManagerCustomerAccountOnboardingPanel } from './components/ManagerCustomerAccountOnboardingPanel';
import { ManagerDayPlanPanel } from './components/ManagerDayPlanPanel';
import { ManagerPropertyOnboardingPanel } from './components/ManagerPropertyOnboardingPanel';
import { ManagerPropertySetupPanel } from './components/ManagerPropertySetupPanel';
import { ManagerTeamInvitationsPanel } from './components/ManagerTeamInvitationsPanel';
import { ManagerTeamMembershipsPanel } from './components/ManagerTeamMembershipsPanel';
import { ManagerTeamActivityPanel } from './components/ManagerTeamActivityPanel';
import { TeamOrganizationOverviewPanel } from './components/TeamOrganizationOverviewPanel';
import {
  ManagerNotificationHistoryPanel,
  type NotificationHistoryFilters,
} from './components/ManagerNotificationHistoryPanel';
import {
  ManagerPhotoProcessingRecoveryPanel,
  type PhotoProcessingRecoveryFilters,
} from './components/ManagerPhotoProcessingRecoveryPanel';
import { ManagerPhotoErasureRecoveryPanel } from './components/ManagerPhotoErasureRecoveryPanel';
import { ManagerOperationalExceptionsPanel } from './components/ManagerOperationalExceptionsPanel';
import {
  companyNeedsOnboardingAttention,
  companySupportsMultipleCrews,
  countCustomerBidsToReview,
  countReadyCustomerReports,
  customerNeedsOnboardingAttention,
  filterCrewsForCompany,
  filterPropertiesForCustomerPortal,
  filterWorkSummariesForCustomerPortal,
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
  type ManagerActivityItem,
} from './domain/managerActivity';
import {
  readStoredManagerActivityItems,
  writeStoredManagerActivityItems,
} from './domain/managerActivityLocalStore';
import { notificationsToManagerActivity } from './domain/notificationManagerActivity';
import { operationsToManagerActivity } from './domain/operationalManagerActivity';
import type {
  CustomerPortalPropertySummary,
  CustomerPortalVisitSummary,
} from './domain/customerPortalVisits';
import type { PortfolioPropertyLink, PropertyPortfolio } from './domain/propertyPortfolios';
import { projectBidTotalCents, type ProjectBid } from './domain/stopProgress';

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

const initialManagerPropertyOnboardingOptions = customerPortalPreviewProperties.map((property) => ({
  propertyId: property.id,
  accountId: property.customerId === 'customer_1001' ? 'acct_1001' : property.customerId,
  organizationId: property.organizationId,
  displayName: property.displayName,
  serviceAddress: property.address,
}));

const initialManagerCustomerProperties: CustomerPropertyRecord[] =
  initialManagerPropertyOnboardingOptions.map((property) => ({
    ...property,
    status: 'active',
    persisted: false,
  }));

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

function ManagerToolSurface({
  activeTool,
  children,
  className = '',
  id,
  tool,
}: {
  activeTool: ManagerWorkspaceTool | null;
  children: ReactNode;
  className?: string;
  id?: string;
  tool: ManagerWorkspaceTool;
}) {
  if (activeTool !== tool) return null;
  return <div className={className} id={id}>{children}</div>;
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

function currencyLabel(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function projectBidStatusLabel(status: ProjectBid['status']): string {
  if (status === 'sent') return 'Awaiting response';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  if (status === 'converted') return 'Converted to work';
  if (status === 'expired') return 'Expired';
  return 'Draft';
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
  completionReportsByProperty,
  isLoadingReportHistory,
  hasReportHistoryError,
  projectBids,
  isLoadingProjectBids,
  hasProjectBidHistoryError,
}: {
  customer: CustomerAccountProfile;
  properties: CustomerPropertyProfile[];
  workSummaries: CustomerPortalWorkSummary[];
  completionReportsByProperty: Record<string, PropertyCompletionReportSummary[]>;
  isLoadingReportHistory: boolean;
  hasReportHistoryError: boolean;
  projectBids: ProjectBid[];
  isLoadingProjectBids: boolean;
  hasProjectBidHistoryError: boolean;
}) {
  const [selectedPortalPropertyId, setSelectedPortalPropertyId] = useState<string | null>(null);
  const [activeCustomerHistory, setActiveCustomerHistory] =
    useState<CustomerHistoryView>('properties');
  const [expandedReportPropertyId, setExpandedReportPropertyId] = useState<string | null>(null);
  const visibleProperties = filterPropertiesForCustomerPortal(properties, customer);
  const visibleWorkSummaries = filterWorkSummariesForCustomerPortal(workSummaries, customer);
  const deliveredReportCount = Object.values(completionReportsByProperty).reduce(
    (total, reports) => total + reports.length,
    0,
  );
  const usesLocalReportSummary = hasReportHistoryError && deliveredReportCount === 0;
  const usesLocalBidSummary = hasProjectBidHistoryError && projectBids.length === 0;
  const propertyCount = getCustomerPropertyCount(visibleProperties, customer.id);
  const reportsReadyCount = usesLocalReportSummary ? countReadyCustomerReports(visibleWorkSummaries) : deliveredReportCount;
  const bidsToReviewCount = usesLocalBidSummary ? countCustomerBidsToReview(visibleWorkSummaries) : projectBids.length;
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
          <p className="text-2xl font-bold text-slate-950">{isLoadingReportHistory ? '...' : reportsReadyCount}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {usesLocalReportSummary ? 'Reports ready' : 'Delivered reports'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-2xl font-bold text-slate-950">{isLoadingProjectBids ? '...' : bidsToReviewCount}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {usesLocalBidSummary ? 'Bids to review' : 'Bid history'}
          </p>
        </div>
      </div>

      <CustomerHistoryMenu
        activeView={activeCustomerHistory}
        bidCount={projectBids.length}
        onChange={(view) => {
          setActiveCustomerHistory(view);
          setSelectedPortalPropertyId(null);
          setExpandedReportPropertyId(null);
        }}
        propertyCount={visibleProperties.length}
      />

      <div className={`${activeCustomerHistory === 'properties' ? 'block' : 'hidden'} mt-5 space-y-3 lg:block`}>
        <div className={`${selectedPortalPropertyId ? 'hidden' : 'grid'} gap-2 lg:hidden`}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Choose a property
          </p>
          {visibleProperties.map((property) => {
            const propertyReports = completionReportsByProperty[property.id] ?? [];
            const propertyWork = visibleWorkSummaries.filter(
              (workSummary) => workSummary.propertyId === property.id,
            );
            return (
              <button
                className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left"
                key={property.id}
                onClick={() => {
                  setSelectedPortalPropertyId(property.id);
                  setExpandedReportPropertyId(null);
                }}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-900">
                    {property.displayName}
                  </span>
                  <span className="block truncate text-xs text-slate-600">{property.address}</span>
                </span>
                <span className="shrink-0 text-right text-xs text-slate-500">
                  {propertyWork.length} work
                  <span className="block">{propertyReports.length} reports</span>
                </span>
              </button>
            );
          })}
        </div>
        {visibleProperties.map((property) => {
          const propertyWork = visibleWorkSummaries.filter((workSummary) => workSummary.propertyId === property.id);
          const propertyReports = completionReportsByProperty[property.id] ?? [];
          const mobilePropertyReports = expandedReportPropertyId === property.id
            ? propertyReports
            : propertyReports.slice(0, 2);

          return (
            <article
              key={property.id}
              className={`${selectedPortalPropertyId === property.id ? 'block' : 'hidden'} rounded-xl border border-slate-200 p-4 lg:block`}
            >
              <button
                className="mb-3 min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 lg:hidden"
                onClick={() => {
                  setSelectedPortalPropertyId(null);
                  setExpandedReportPropertyId(null);
                }}
                type="button"
              >
                ← All properties
              </button>
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
                  <span className="font-semibold text-slate-800">Reports:</span>{' '}
                  {isLoadingReportHistory ? 'Loading' : propertyReports.length}
                </p>
              </div>
              {propertyReports.length > 0 && (
                <div className="mt-3 space-y-2">
                  {mobilePropertyReports.map((report) => (
                    <a
                      key={report.reportId}
                      className="block rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 hover:border-emerald-300"
                      href={report.shareUrl}
                    >
                      <span className="font-semibold">{report.customerName}</span>
                      <span className="ml-2 text-xs uppercase tracking-wide text-emerald-700">
                        Delivered {report.deliveredAt}
                      </span>
                    </a>
                  ))}
                  {propertyReports.length > 2 ? (
                    <button
                      className="min-h-11 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm font-bold text-emerald-900 lg:hidden"
                      onClick={() => setExpandedReportPropertyId((current) =>
                        current === property.id ? null : property.id
                      )}
                      type="button"
                    >
                      {expandedReportPropertyId === property.id
                        ? 'Show recent reports'
                        : `Show ${propertyReports.length - 2} older reports`}
                    </button>
                  ) : null}
                  <div className="hidden space-y-2 lg:block">
                    {(expandedReportPropertyId === property.id
                      ? []
                      : propertyReports.slice(2)
                    ).map((report) => (
                      <a
                        key={report.reportId}
                        className="block rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 hover:border-emerald-300"
                        href={report.shareUrl}
                      >
                        <span className="font-semibold">{report.customerName}</span>
                        <span className="ml-2 text-xs uppercase tracking-wide text-emerald-700">
                          Delivered {report.deliveredAt}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
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
      {projectBids.length > 0 ? (
        <div className={`${activeCustomerHistory === 'bids' ? 'block' : 'hidden'} mt-5 space-y-2 lg:block`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Bid history</p>
          {projectBids.map((bid) => {
            const bidTotal = currencyLabel(projectBidTotalCents(bid));
            const content = (
              <>
                <span className="font-semibold">{projectBidStatusLabel(bid.status)}</span>
                <span className="ml-2 text-xs uppercase tracking-wide text-slate-500">
                  {bidTotal} - {bid.lineItems.length} line {bid.lineItems.length === 1 ? 'item' : 'items'}
                </span>
              </>
            );

            return bid.shareUrl ? (
              <a
                key={bid.id}
                className="block rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900 hover:border-amber-300"
                href={bid.shareUrl}
              >
                {content}
              </a>
            ) : (
              <div key={bid.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {content}
              </div>
            );
          })}
        </div>
      ) : activeCustomerHistory === 'bids' ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 lg:hidden">
          No bids are currently available for this customer.
        </p>
      ) : null}
    </section>
  );
}

export function App() {
  const auth = useAuth();
  const providerEntryMode = providerEntryModeFromSearch(window.location.search);
  const workspaceRoles = useMemo(
    () => workspaceRolesForAccess(auth.roles, auth.memberships),
    [auth.memberships, auth.roles],
  );
  const workspaceGuidance = workspaceGuidanceForRoles(workspaceRoles);
  const {
    activeWorkspace,
    availablePersonas,
    selectPersona: selectWorkspacePersona,
  } = useWorkspaceSelection(workspaceRoles, auth.workspaceRollout);
  const activePersona = activeWorkspace.persona;
  const workspaceSurfaces = activeWorkspace.surfaces;
  const managedPersonaUnit = activeWorkspace.rolloutUnit;
  const fieldControls = activeWorkspace.fieldControls;
  const canManageDispatchHierarchy = workspaceRoles.includes('OrganizationOwner')
    || workspaceRoles.includes('SupportAdmin');
  const canReviewMarketingLeads = workspaceRoles.includes('SupportAdmin');
  const [jobs, setJobs] = useState<YardCareJob[]>(seedJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(seedJobs[0]?.id ?? null);
  const [requestedJobWorkflow, setRequestedJobWorkflow] = useState<JobWorkflowSection>('overview');
  const [mobileView, setMobileView] = useState<MobileWorkspaceView>(
    activePersona.defaultView,
  );
  const {
    selectedJob,
    setSelectedJob,
    jobDetailUnavailable,
    isLoadingDetail,
    selectedJobAddOns,
    setSelectedJobAddOns,
    jobAddOnsUnavailable,
  } = useFieldJobSelection(selectedJobId, jobs);
  const [photoEvidenceUnavailable, setPhotoEvidenceUnavailable] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobsUnavailable, setJobsUnavailable] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading jobs from local API...');
  const [uploadTickets, setUploadTickets] = useState<PhotoUploadTicket[]>([]);
  const [selectedCompletionReport, setSelectedCompletionReport] = useState<CompletionReportSnapshot | null>(null);
  const [completionReportSnapshots, setCompletionReportSnapshots] = useState<Record<string, CompletionReportSnapshot>>({});
  const [isLoadingReportQueue, setIsLoadingReportQueue] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([]);
  const [operationalActivity, setOperationalActivity] = useState<OperationalActivity[]>([]);
  const [operationalActivityUnavailable, setOperationalActivityUnavailable] = useState(false);
  const [isLoadingOlderOperationalActivity, setIsLoadingOlderOperationalActivity] = useState(false);
  const [canLoadOlderOperationalActivity, setCanLoadOlderOperationalActivity] = useState(true);
  const [requestedOperationalExceptionId, setRequestedOperationalExceptionId] = useState<string>();
  const [requestedOperationalExceptionSignal, setRequestedOperationalExceptionSignal] = useState(0);
  const [isLoadingNotificationHistory, setIsLoadingNotificationHistory] = useState(false);
  const [notificationHistoryUnavailable, setNotificationHistoryUnavailable] = useState(false);
  const [photoProcessingHistory, setPhotoProcessingHistory] = useState<PhotoProcessingHistoryItem[]>([]);
  const [isLoadingPhotoProcessingHistory, setIsLoadingPhotoProcessingHistory] = useState(false);
  const [photoErasureDeletionHistory, setPhotoErasureDeletionHistory] = useState<PhotoErasureDeletionHistoryItem[]>([]);
  const [isLoadingPhotoErasureDeletionHistory, setIsLoadingPhotoErasureDeletionHistory] = useState(false);
  const [customerPrivacyExport, setCustomerPrivacyExport] = useState<CustomerPrivacyExport | null>(null);
  const [customerPhotoErasureSummary, setCustomerPhotoErasureSummary] = useState<CustomerPhotoErasureSummary | null>(null);
  const [isLoadingCustomerPrivacy, setIsLoadingCustomerPrivacy] = useState(false);
  const [activeManagerOrganizationId, setActiveManagerOrganizationId] = useState('org_demo_landscaping');
  const [managerPropertyOnboardingOptions, setManagerPropertyOnboardingOptions] = useState(
    initialManagerPropertyOnboardingOptions,
  );
  const [managerCustomerProperties, setManagerCustomerProperties] = useState(
    initialManagerCustomerProperties,
  );
  const [propertyCompletionReports, setPropertyCompletionReports] = useState<
    Record<string, PropertyCompletionReportSummary[]>
  >({});
  const [customerPortalProperties, setCustomerPortalProperties] = useState<
    CustomerPortalPropertySummary[]
  >([]);
  const [customerPortalVisits, setCustomerPortalVisits] = useState<CustomerPortalVisitSummary[]>([]);
  const [isLoadingCustomerPortalVisits, setIsLoadingCustomerPortalVisits] = useState(false);
  const [customerPortalVisitError, setCustomerPortalVisitError] = useState<
    'access_required' | 'inconsistent' | 'unavailable' | null
  >(null);
  const [customerPortalVisitRefreshSignal, setCustomerPortalVisitRefreshSignal] = useState(0);
  const [portalHomeReadState, setPortalHomeReadState] =
    useState<CustomerPortalReadState>('loading');
  const [crewRouteOverview, setCrewRouteOverview] = useState<CrewRouteOverview>({
    source: 'loading', totalStops: 0, completedStops: 0,
  });
  const handleCrewRouteOverviewChange = useCallback((overview: CrewRouteOverview) => {
    setCrewRouteOverview(overview);
  }, []);
  const [isLoadingPropertyCompletionReports, setIsLoadingPropertyCompletionReports] = useState(false);
  const [hasPropertyCompletionReportHistoryError, setHasPropertyCompletionReportHistoryError] = useState(false);
  const [customerProjectBids, setCustomerProjectBids] = useState<ProjectBid[]>([]);
  const [isLoadingCustomerProjectBids, setIsLoadingCustomerProjectBids] = useState(false);
  const [hasCustomerProjectBidHistoryError, setHasCustomerProjectBidHistoryError] = useState(false);
  const [completionReportActionStatus, setCompletionReportActionStatus] = useState<string | null>(null);
  const [dayPlanRefreshSignal, setDayPlanRefreshSignal] = useState(0);
  const [propertyOnboardingRefreshSignal, setPropertyOnboardingRefreshSignal] = useState(0);
  const [customerAccountRefreshSignal, setCustomerAccountRefreshSignal] = useState(0);
  const [teamActivityRefreshSignal, setTeamActivityRefreshSignal] = useState(0);
  const [teamActivityRequestedCrewId, setTeamActivityRequestedCrewId] = useState<string>();
  const [teamActivityRequestedCrewBranchId, setTeamActivityRequestedCrewBranchId] =
    useState<string>();
  const [teamActivityRequestedCrewTerritoryId, setTeamActivityRequestedCrewTerritoryId] =
    useState<string>();
  const [teamActivityRequestedCrewSignal, setTeamActivityRequestedCrewSignal] = useState(0);
  const [teamActivityReturnedAuditId, setTeamActivityReturnedAuditId] = useState<string>();
  const [teamActivityReturnedAuditSignal, setTeamActivityReturnedAuditSignal] = useState(0);
  const [firstOwnerProgressRefreshSignal, setFirstOwnerProgressRefreshSignal] = useState(0);
  const [crewRefreshSignal, setCrewRefreshSignal] = useState(0);
  const [dispatchHierarchyRefreshSignal, setDispatchHierarchyRefreshSignal] = useState(0);
  const [crewAdministrationSelection, setCrewAdministrationSelection] = useState<string>();
  const [crewAdministrationBranch, setCrewAdministrationBranch] = useState<string>();
  const [crewAdministrationTerritory, setCrewAdministrationTerritory] = useState<string>();
  const [crewAdministrationReturnTarget, setCrewAdministrationReturnTarget] = useState<
    'team-activity' | undefined
  >();
  const [crewAdministrationInspectionSummary, setCrewAdministrationInspectionSummary] =
    useState<string>();
  const [crewAdministrationInspectionAuditLabel, setCrewAdministrationInspectionAuditLabel] =
    useState<string>();
  const [crewAdministrationInspectionAuditId, setCrewAdministrationInspectionAuditId] =
    useState<string>();
  const [
    crewAdministrationInspectedDestinationBranchId,
    setCrewAdministrationInspectedDestinationBranchId,
  ] = useState<string>();
  const [
    crewAdministrationInspectedDestinationTerritoryId,
    setCrewAdministrationInspectedDestinationTerritoryId,
  ] = useState<string>();
  const [crewAdministrationSelectionSignal, setCrewAdministrationSelectionSignal] = useState(0);
  const [offlineJobMutations, setOfflineJobMutations] = useState<JobLifecycleOfflineMutation[]>([]);
  const [offlineChecklistMutations, setOfflineChecklistMutations] = useState<ChecklistOfflineMutation[]>([]);
  const [offlinePhotoMutations, setOfflinePhotoMutations] = useState<PhotoUploadOfflineMutation[]>([]);
  const [isReplayingJobMutations, setIsReplayingJobMutations] = useState(false);
  const [isReplayingChecklistMutations, setIsReplayingChecklistMutations] = useState(false);
  const [isReplayingPhotoMutations, setIsReplayingPhotoMutations] = useState(false);
  const jobReplayInProgress = useRef(false);
  const checklistReplayInProgress = useRef(false);
  const photoReplayInProgress = useRef(false);
  const [requestedOperationalProfilePropertyId, setRequestedOperationalProfilePropertyId] = useState('');
  const [requestedServiceSetupPropertyId, setRequestedServiceSetupPropertyId] = useState('');
  const [managerWorkspaceSection, setManagerWorkspaceSection] =
    useState<ManagerWorkspaceSection | null>(null);
  const [managerWorkspaceTool, setManagerWorkspaceTool] =
    useState<ManagerWorkspaceTool | null>(null);
  const [managerActivity, setManagerActivity] = useState<ManagerActivityItem[]>(() =>
    readStoredManagerActivityItems(),
  );
  const [isManagerActivityPersisted, setIsManagerActivityPersisted] = useState(true);
  const jobDetailRef = useRef<HTMLDivElement>(null);
  const providerEntryOpened = useRef(false);
  const mobileScrollPositions = useRef<Partial<Record<MobileWorkspaceView, number>>>({});
  const homeWorkSummary = customerHomeWorkSummary(
    activePersona.id,
    customerPortalVisits,
    jobs,
  );
  const customerWorkspaceMode = customerWorkspaceModeForPersona(activePersona.id);
  const fieldRecovery = fieldRecoveryState({
    jobMutations: offlineJobMutations,
    checklistMutations: offlineChecklistMutations,
    photoMutations: offlinePhotoMutations,
  });
  const canUseManagerTools = workspaceGuidance.managerTools && workspaceSurfaces.management;
  const hostedSignOut = auth.authMode === 'cognito'
    ? () => void auth.signOut()
    : undefined;
  const enabledManagerTools = useMemo(() => new Set(
    managerWorkspaceSectionsForPersona(
      activePersona.id,
      managedPersonaUnit,
      activeWorkspace.capabilities,
    ).flatMap(
      (section) => managerWorkspaceToolsForPersona(
        activePersona.id,
        section.id,
        managedPersonaUnit,
        activeWorkspace.capabilities,
      ).map(({ id }) => id),
    ),
  ), [activePersona.id, activeWorkspace.capabilities, managedPersonaUnit]);
  const activeAuthorizedManagerTool = managerWorkspaceActiveToolForPersona(
    activePersona.id,
    managedPersonaUnit,
    managerWorkspaceTool,
    activeWorkspace.capabilities,
  );
  const canLoadCustomerPortalPreview = enabledManagerTools.has('customer-portal');
  const canLoadCompletionReportQueue = enabledManagerTools.has('completion-reports');
  const canLoadNotificationHistory = enabledManagerTools.has('notifications');
  const canLoadOperationalActivity = enabledManagerTools.has('operations-activity');
  const canLoadPhotoProcessingHistory = enabledManagerTools.has('photo-processing');
  const canUsePhotoErasureRecovery = enabledManagerTools.has('photo-erasure');
  const managerWorkspaceSignals = useMemo(
    () => managerWorkspaceSectionSignalsForPersona(
      activePersona.id,
      managedPersonaUnit,
      {
        isLoadingJobs,
        jobsUnavailable,
        openJobCount: jobs.filter((job) => job.status !== 'completed').length,
        isLoadingReports: isLoadingReportQueue,
        reportCount: Object.keys(completionReportSnapshots).length,
        isLoadingNotifications: isLoadingNotificationHistory,
        notificationsUnavailable: notificationHistoryUnavailable,
        failedNotificationCount: notificationHistory.filter(
          ({ status }) => status === 'failed' || status === 'dead_letter',
        ).length,
        operationalActivityUnavailable,
        isLoadingRecovery: (canLoadPhotoProcessingHistory && isLoadingPhotoProcessingHistory)
          || (canUsePhotoErasureRecovery && isLoadingPhotoErasureDeletionHistory),
        recoveryItemCount: [
          ...(canLoadPhotoProcessingHistory ? photoProcessingHistory : []),
          ...(canUsePhotoErasureRecovery ? photoErasureDeletionHistory : []),
        ].filter(
          ({ status }) => status === 'failed' || status === 'dead_letter',
        ).length,
      },
      activeWorkspace.capabilities,
    ),
    [
      activePersona.id,
      activeWorkspace.capabilities,
      completionReportSnapshots,
      canLoadPhotoProcessingHistory,
      canUsePhotoErasureRecovery,
      isLoadingJobs,
      isLoadingNotificationHistory,
      isLoadingPhotoErasureDeletionHistory,
      isLoadingPhotoProcessingHistory,
      isLoadingReportQueue,
      jobs,
      jobsUnavailable,
      managedPersonaUnit,
      notificationHistory,
      notificationHistoryUnavailable,
      operationalActivityUnavailable,
      photoErasureDeletionHistory,
      photoProcessingHistory,
    ],
  );
  const managerWorkspaceHeading = activePersona.id === 'support'
    ? 'Support and recovery tools'
    : activePersona.id === 'property-manager'
      ? 'Portfolio management tools'
      : 'Manager and office tools';
  const managerWorkspaceDescription = activePersona.id === 'support'
    ? 'Access, diagnostics, reporting, and recovery'
    : activePersona.id === 'property-manager'
      ? 'Customer properties, reports, and portfolios'
      : 'Scheduling, customers, and recovery';

  useEffect(() => {
    if (activePersona.navigation.some(({ view }) => view === mobileView)) return;
    setMobileView(activePersona.defaultView);
  }, [activePersona, mobileView]);

  useEffect(() => {
    if (!providerEntryMode || providerEntryOpened.current || activePersona.id !== 'company-owner') return;
    providerEntryOpened.current = true;
    setMobileView('manager');
    setManagerWorkspaceSection('overview');
    setManagerWorkspaceTool('owner-setup');
  }, [activePersona.id, providerEntryMode]);

  useEffect(() => {
    const sections = managerWorkspaceSectionsForPersona(
      activePersona.id,
      managedPersonaUnit,
      activeWorkspace.capabilities,
    );
    if (
      managerWorkspaceSection
      && !sections.some((section) => section.id === managerWorkspaceSection)
    ) {
      setManagerWorkspaceSection(null);
      setManagerWorkspaceTool(null);
      return;
    }
    if (
      managerWorkspaceSection
      && managerWorkspaceTool
      && !managerWorkspaceToolsForPersona(
        activePersona.id,
        managerWorkspaceSection,
        managedPersonaUnit,
        activeWorkspace.capabilities,
      )
        .some((tool) => tool.id === managerWorkspaceTool)
    ) {
      setManagerWorkspaceTool(null);
    }
  }, [
    activePersona.id,
    activeWorkspace.capabilities,
    managedPersonaUnit,
    managerWorkspaceSection,
    managerWorkspaceTool,
  ]);

  function changeMobileView(
    destination: MobileWorkspaceView,
    resetDestination = false,
  ) {
    if (window.innerWidth >= 1024) {
      setMobileView(destination);
      return;
    }

    mobileScrollPositions.current[mobileView] = window.scrollY;
    setMobileView(destination);
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: mobileWorkspaceScrollTop(
          mobileScrollPositions.current,
          destination,
          resetDestination,
        ),
        behavior: 'auto',
      });
    });
  }

  function registerManagerProperties(properties: CustomerPropertyRecord[]) {
    setManagerCustomerProperties((current) => {
      const next = new Map(current.map((property) => [property.propertyId, property]));
      properties.forEach((property) => next.set(property.propertyId, property));
      return Array.from(next.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
    });
    setManagerPropertyOnboardingOptions((current) => {
      const next = new Map(current.map((property) => [property.propertyId, property]));
      properties.forEach((property) => {
        if (property.status === 'archived') {
          next.delete(property.propertyId);
          return;
        }
        next.set(property.propertyId, {
          propertyId: property.propertyId,
          accountId: property.accountId,
          organizationId: property.organizationId,
          displayName: property.displayName,
          serviceAddress: property.serviceAddress,
        });
      });
      return Array.from(next.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
    });
  }

  function selectJobForReview(jobId: string) {
    setSelectedJobId(jobId);
    setRequestedJobWorkflow('overview');
    if (window.innerWidth < 1024) {
      changeMobileView('job', jobId !== selectedJobId);
    }
  }

  function openPropertyWorkspace(
    propertyId: string,
    workspace: 'operational-profile' | 'service-setup',
  ) {
    setManagerWorkspaceSection('customers');
    setManagerWorkspaceTool(
      workspace === 'operational-profile' ? 'property-profile' : 'property-service',
    );
    const managerTools = document.getElementById('manager-tools') as HTMLDetailsElement | null;
    if (managerTools) managerTools.open = true;
    if (workspace === 'operational-profile') {
      setRequestedOperationalProfilePropertyId(propertyId);
    } else {
      setRequestedServiceSetupPropertyId(propertyId);
    }
    window.setTimeout(() => {
      document.getElementById(`property-${workspace}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  function openFirstOwnerSetupStep(
    target: 'operational-profile' | 'service-setup' | 'day-plan' | 'team-invitations',
  ) {
    setManagerWorkspaceSection(
      target === 'day-plan'
        ? 'schedule'
        : target === 'team-invitations'
          ? 'team'
          : 'customers',
    );
    setManagerWorkspaceTool(
      target === 'day-plan'
        ? 'day-plan'
        : target === 'team-invitations'
          ? 'team-invitations'
          : target === 'operational-profile'
            ? 'property-profile'
            : 'property-service',
    );
    const managerTools = document.getElementById('manager-tools') as HTMLDetailsElement | null;
    if (managerTools) managerTools.open = true;
    const targetId = target === 'operational-profile' || target === 'service-setup'
      ? `property-${target}`
      : `first-owner-${target}`;
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  const selectedJobTickets = useMemo(
    () => uploadTickets.filter((ticket) => ticket.jobId === selectedJobId),
    [selectedJobId, uploadTickets],
  );
  const managerReportQueueReports = useMemo(
    () => Object.values(completionReportSnapshots),
    [completionReportSnapshots],
  );
  const visibleManagerActivity = useMemo(
    () => [
      ...operationsToManagerActivity(operationalActivity),
      ...notificationsToManagerActivity(notificationHistory),
      ...managerActivity,
    ],
    [managerActivity, notificationHistory, operationalActivity],
  );
  const privacyAccountIds = useMemo(() => {
    const reportAccountIds = managerReportQueueReports
      .map((report) => report.account.accountId)
      .filter((accountId): accountId is string => Boolean(accountId));
    return Array.from(new Set([...reportAccountIds, 'acct_1001', 'acct_1002'])).sort();
  }, [managerReportQueueReports]);

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
    setManagerActivity([]);
    setIsManagerActivityPersisted(writeStoredManagerActivityItems([]));
  }

  const replayJobLifecycleMutations = useCallback(async () => {
    if (!auth.userId || !navigator.onLine || jobReplayInProgress.current) return;
    jobReplayInProgress.current = true;
    setIsReplayingJobMutations(true);
    try {
      const mutations = (await listOfflineMutationsForActor(auth.userId))
        .filter(isJobLifecycleOfflineMutation);
      for (const mutation of mutations) {
        if (mutation.syncState === 'conflict') break;
        try {
          const result = mutation.action === 'start'
            ? await startJob(mutation.jobId, mutation.id)
            : await completeJob(mutation.jobId, mutation.id);
          if (!result.persisted) {
            await markOfflineMutationFailed(mutation, 'API used local fallback');
            break;
          }
          await removeOfflineMutation(mutation.id);
        } catch (error) {
          await markOfflineMutationFailed(
            mutation,
            error instanceof Error ? error.message : 'Job lifecycle sync failed',
            isOfflineMutationConflict(error) ? 'conflict' : 'failed',
          );
          break;
        }
      }
      setOfflineJobMutations(
        (await listOfflineMutationsForActor(auth.userId)).filter(isJobLifecycleOfflineMutation),
      );
    } catch {
      // Keep the last durable queue snapshot visible.
    } finally {
      jobReplayInProgress.current = false;
      setIsReplayingJobMutations(false);
    }
  }, [auth.userId]);

  const replayChecklistMutations = useCallback(async () => {
    if (!auth.userId || !navigator.onLine || checklistReplayInProgress.current) return;
    checklistReplayInProgress.current = true;
    setIsReplayingChecklistMutations(true);
    try {
      const mutations = (await listOfflineMutationsForActor(auth.userId))
        .filter(isChecklistOfflineMutation);
      for (const mutation of mutations) {
        if (mutation.syncState === 'conflict') break;
        try {
          const result = await updateChecklistItem(
            mutation.jobId,
            mutation.checklistItemId,
            mutation.completed,
            mutation.id,
          );
          if (!result.persisted) {
            await markOfflineMutationFailed(mutation, 'API used local fallback');
            break;
          }
          await removeOfflineMutation(mutation.id);
        } catch (error) {
          await markOfflineMutationFailed(
            mutation,
            error instanceof Error ? error.message : 'Checklist sync failed',
            isOfflineMutationConflict(error) ? 'conflict' : 'failed',
          );
          break;
        }
      }
      setOfflineChecklistMutations(
        (await listOfflineMutationsForActor(auth.userId)).filter(isChecklistOfflineMutation),
      );
    } catch {
      // Keep the last durable queue snapshot visible.
    } finally {
      checklistReplayInProgress.current = false;
      setIsReplayingChecklistMutations(false);
    }
  }, [auth.userId]);

  const replayPhotoMutations = useCallback(async () => {
    if (!auth.userId || !navigator.onLine || photoReplayInProgress.current) return;
    photoReplayInProgress.current = true;
    setIsReplayingPhotoMutations(true);
    let replayedAny = false;
    try {
      const mutations = (await listOfflineMutationsForActor(auth.userId))
        .filter(isPhotoUploadOfflineMutation);
      for (const mutation of mutations) {
        if (mutation.syncState === 'conflict') break;
        try {
          const ticket = await replayOfflinePhotoMutation(mutation, {
            getBlob: getOfflinePhotoBlob,
            createTicket: createPhotoUploadTicket,
            upload: uploadPhotoToTicket,
            readMetadata: readPhotoUploadMetadata,
            complete: completePhotoUpload,
            remove: removeOfflineMutation,
          });
          setUploadTickets((current) => [
            ticket,
            ...current.filter((item) => item.photoId !== ticket.photoId),
          ]);
          replayedAny = true;
        } catch (error) {
          await markOfflineMutationFailed(
            mutation,
            error instanceof Error ? error.message : 'Photo replay failed',
            error instanceof MissingOfflinePhotoBlobError || isOfflineMutationConflict(error)
              ? 'conflict'
              : 'failed',
          );
          break;
        }
      }
      setOfflinePhotoMutations(
        (await listOfflineMutationsForActor(auth.userId)).filter(isPhotoUploadOfflineMutation),
      );
      if (replayedAny) setJobs(await fetchJobs());
    } catch {
      // Keep the last durable queue snapshot visible.
    } finally {
      photoReplayInProgress.current = false;
      setIsReplayingPhotoMutations(false);
    }
  }, [auth.userId]);

  useEffect(() => {
    if (!auth.userId) {
      setOfflineJobMutations([]);
      setOfflineChecklistMutations([]);
      setOfflinePhotoMutations([]);
      return;
    }
    setOfflineJobMutations([]);
    setOfflineChecklistMutations([]);
    setOfflinePhotoMutations([]);
    let active = true;
    void listOfflineMutationsForActor(auth.userId)
      .then((mutations) => {
        if (!active) return;
        const jobMutations = mutations.filter(isJobLifecycleOfflineMutation);
        setOfflineJobMutations(jobMutations);
        setOfflineChecklistMutations(mutations.filter(isChecklistOfflineMutation));
        setOfflinePhotoMutations(mutations.filter(isPhotoUploadOfflineMutation));
        if (jobMutations.length > 0 && navigator.onLine) void replayJobLifecycleMutations();
        if (mutations.some(isChecklistOfflineMutation) && navigator.onLine) {
          void replayChecklistMutations();
        }
        if (mutations.some(isPhotoUploadOfflineMutation) && navigator.onLine) {
          void replayPhotoMutations();
        }
      })
      .catch(() => {
        if (!active) return;
        setOfflineJobMutations([]);
        setOfflineChecklistMutations([]);
        setOfflinePhotoMutations([]);
      });
    const handleOnline = () => {
      void replayJobLifecycleMutations();
      void replayChecklistMutations();
      void replayPhotoMutations();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
    };
  }, [
    auth.userId,
    replayChecklistMutations,
    replayJobLifecycleMutations,
    replayPhotoMutations,
  ]);

  useEffect(() => {
    setIsManagerActivityPersisted(writeStoredManagerActivityItems(managerActivity));
  }, [managerActivity]);

  useEffect(() => {
    if (!personaUsesAuthorizedCustomerRead(activePersona.id) || !auth.userId) {
      setCustomerPortalProperties([]);
      setCustomerPortalVisits([]);
      setCustomerPortalVisitError(null);
      setIsLoadingCustomerPortalVisits(false);
      setPortalHomeReadState('loading');
      return;
    }

    let isMounted = true;
    setIsLoadingCustomerPortalVisits(true);
    setCustomerPortalVisitError(null);
    setPortalHomeReadState('loading');
    void fetchCustomerPortalVisits()
      .then((collection) => {
        if (!isMounted) return;
        setCustomerPortalProperties(collection.properties);
        setCustomerPortalVisits(collection.visits);
        setPortalHomeReadState('ready');
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setCustomerPortalProperties([]);
        setCustomerPortalVisits([]);
        const readError =
          error instanceof ApiRequestError && error.code === 'customer_portal_access_required'
            ? 'access_required'
            : error instanceof ApiRequestError
                && error.code === 'customer_portal_access_inconsistent'
              ? 'inconsistent'
              : 'unavailable';
        setCustomerPortalVisitError(readError);
        setPortalHomeReadState(readError);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCustomerPortalVisits(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activePersona.id, auth.userId, customerPortalVisitRefreshSignal]);

  useEffect(() => {
    let isMounted = true;

    const canLoadHistory = personaUsesManagerCustomerPreview(
      activePersona.id,
      canLoadCustomerPortalPreview,
    );
    if (!canLoadHistory) {
      setPropertyCompletionReports({});
      setIsLoadingPropertyCompletionReports(false);
      setHasPropertyCompletionReportHistoryError(false);
      return () => {
        isMounted = false;
      };
    }

    const visibleProperties = filterPropertiesForCustomerPortal(
      customerPortalPreviewProperties,
      customerPortalPreviewCustomer,
    );
    setPropertyCompletionReports({});
    setIsLoadingPropertyCompletionReports(true);

    Promise.allSettled(
      visibleProperties.map(async (property) => ({
        propertyId: property.id,
        reports: await fetchPropertyCompletionReports(property.id),
      })),
    )
      .then((results) => {
        if (!isMounted) return;

        const hasRejectedHistory = results.some((result) => result.status === 'rejected');
        setPropertyCompletionReports(
          results.reduce<Record<string, PropertyCompletionReportSummary[]>>((next, result) => {
            if (result.status === 'fulfilled') {
              next[result.value.propertyId] = result.value.reports;
            }
            return next;
          }, {}),
        );
        setHasPropertyCompletionReportHistoryError(hasRejectedHistory);

        if (hasRejectedHistory) {
          recordManagerActivity({
            title: 'Customer report history unavailable',
            message: 'Delivered property report history could not be loaded for every customer portal property.',
            tone: 'warning',
            source: 'sync',
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingPropertyCompletionReports(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    activePersona.id,
    canLoadCustomerPortalPreview,
  ]);

  useEffect(() => {
    if (!canLoadPhotoProcessingHistory) {
      setPhotoProcessingHistory([]);
      setIsLoadingPhotoProcessingHistory(false);
      return;
    }

    let isMounted = true;
    setIsLoadingPhotoProcessingHistory(true);

    fetchPhotoProcessingHistory({ status: 'failed', limit: 25 })
      .then((items) => {
        if (isMounted) setPhotoProcessingHistory(items);
      })
      .catch(() => {
        if (!isMounted) return;
        setPhotoProcessingHistory([]);
        recordManagerActivity({
          title: 'Photo processing history unavailable',
          message: 'Photo processing recovery history could not be loaded from the API.',
          tone: 'warning',
          source: 'sync',
        });
      })
      .finally(() => {
        if (isMounted) setIsLoadingPhotoProcessingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [canLoadPhotoProcessingHistory]);

  useEffect(() => {
    let isMounted = true;

    const canLoadBids = personaUsesManagerCustomerPreview(
      activePersona.id,
      canLoadCustomerPortalPreview,
    );
    if (!canLoadBids) {
      setCustomerProjectBids([]);
      setIsLoadingCustomerProjectBids(false);
      setHasCustomerProjectBidHistoryError(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingCustomerProjectBids(true);

    fetchAccountProjectBids(customerPortalPreviewCustomer.id)
      .then((bids) => {
        if (!isMounted) return;
        setCustomerProjectBids(bids);
        setHasCustomerProjectBidHistoryError(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setCustomerProjectBids([]);
        setHasCustomerProjectBidHistoryError(true);
        recordManagerActivity({
          title: 'Customer bid history unavailable',
          message: 'Customer account bid history could not be loaded for the portal preview.',
          tone: 'warning',
          source: 'sync',
        });
      })
      .finally(() => {
        if (isMounted) setIsLoadingCustomerProjectBids(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    activePersona.id,
    canLoadCustomerPortalPreview,
  ]);

  useEffect(() => {
    let isMounted = true;
    setJobsUnavailable(false);

    fetchJobs()
      .then((apiJobs) => {
        if (!isMounted) {
          return;
        }

        setJobs(apiJobs);
        setSelectedJobId((current) => current ?? apiJobs[0]?.id ?? null);
        setStatusMessage('Connected to the local API.');
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiRequestError) {
          setJobs([]);
          setSelectedJobId(null);
          setJobsUnavailable(true);
          setStatusMessage('Persisted field work is unavailable. Seed jobs were not substituted.');
        } else {
          setJobs(seedJobs);
          setSelectedJobId((current) => current ?? seedJobs[0]?.id ?? null);
          setStatusMessage('Using seed data because the local API is not reachable yet.');
          recordManagerActivity({
            title: 'Seed data fallback active',
            message: 'The dashboard is using seed jobs because the API is not reachable.',
            tone: 'warning',
            source: 'sync',
          });
        }
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
      setPhotoEvidenceUnavailable(false);
      return;
    }

    let isMounted = true;
    setPhotoEvidenceUnavailable(false);
    fetchJobPhotoEvidence(selectedJobId)
      .then((photos) => {
        if (isMounted) {
          setUploadTickets((current) => mergePhotoEvidence(current, selectedJobId, photos));
        }
      })
      .catch((error: unknown) => {
        if (isMounted) setPhotoEvidenceUnavailable(error instanceof ApiRequestError);
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
    if (!canLoadCompletionReportQueue || jobs.length === 0) {
      setCompletionReportSnapshots({});
      setIsLoadingReportQueue(false);
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
  }, [canLoadCompletionReportQueue, jobs]);

  useEffect(() => {
    if (!canLoadNotificationHistory) {
      setNotificationHistory([]);
      setNotificationHistoryUnavailable(false);
      setIsLoadingNotificationHistory(false);
      return;
    }

    let isMounted = true;
    setIsLoadingNotificationHistory(true);

    fetchNotificationHistory({ limit: 25 })
      .then((items) => {
        if (isMounted) {
          setNotificationHistory(items);
          setNotificationHistoryUnavailable(false);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setNotificationHistory([]);
        setNotificationHistoryUnavailable(true);
        recordManagerActivity({
          title: 'Notification history unavailable',
          message: 'Delivery notification history could not be loaded from the API.',
          tone: 'warning',
          source: 'sync',
        });
      })
      .finally(() => {
        if (isMounted) setIsLoadingNotificationHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [canLoadNotificationHistory]);

  useEffect(() => {
    void refreshOperationalActivity();
  }, [canLoadOperationalActivity, dayPlanRefreshSignal]);

  async function refreshOperationalActivity() {
    if (!canLoadOperationalActivity) {
      setOperationalActivity([]);
      setCanLoadOlderOperationalActivity(false);
      setOperationalActivityUnavailable(false);
      return;
    }
    setOperationalActivityUnavailable(false);
    try {
      const items = await fetchOperationalActivity({ limit: 25 });
      setOperationalActivity(items);
      setCanLoadOlderOperationalActivity(items.length === 25);
    } catch {
      setOperationalActivity([]);
      setCanLoadOlderOperationalActivity(false);
      setOperationalActivityUnavailable(true);
    }
  }

  async function loadOlderOperationalActivity() {
    const before = operationalActivity[operationalActivity.length - 1]?.occurredAt;
    if (!before || isLoadingOlderOperationalActivity) return;
    setIsLoadingOlderOperationalActivity(true);
    try {
      const items = await fetchOperationalActivity({ before, limit: 25 });
      setOperationalActivity((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        return [...current, ...items.filter((item) => !existingIds.has(item.id))];
      });
      setCanLoadOlderOperationalActivity(items.length === 25);
    } catch {
      setCanLoadOlderOperationalActivity(false);
    } finally {
      setIsLoadingOlderOperationalActivity(false);
    }
  }

  async function queueJobLifecycleAction(
    jobId: string,
    action: JobLifecycleOfflineMutation['action'],
  ): Promise<boolean> {
    const job = jobs.find((item) => item.id === jobId);
    if (!job?.organizationId || !auth.userId) return false;
    try {
      const mutation = await enqueueJobLifecycleMutation({
        organizationId: job.organizationId,
        actorId: auth.userId,
        jobId,
        action,
      });
      setOfflineJobMutations((current) => [...current, mutation].sort(
        (left, right) => left.createdAt.localeCompare(right.createdAt),
      ));
      void requestPersistentOfflineStorage();
      return true;
    } catch {
      return false;
    }
  }

  async function discardReviewedJobConflict(mutation: JobLifecycleOfflineMutation) {
    try {
      await removeOfflineMutation(mutation.id);
    } catch {
      setStatusMessage('The reviewed job conflict could not be removed from this phone. Try again.');
      return;
    }
    setOfflineJobMutations((current) => current.filter((item) => item.id !== mutation.id));
    try {
      const serverJob = await fetchJobDetail(mutation.jobId);
      setJobs((current) => current.map((job) => job.id === serverJob.id ? serverJob : job));
      setStatusMessage(`Discarded the reviewed ${mutation.action} conflict and restored server job state.`);
    } catch {
      setStatusMessage(`Discarded the reviewed ${mutation.action} conflict; refresh when the API is available.`);
    }
    await replayJobLifecycleMutations();
  }

  async function handleChecklistItemChange(itemId: string, completed: boolean) {
    if (!selectedJobId || !selectedJob) return;
    let outcome = 'Checklist updated.';
    try {
      const result = await updateChecklistItem(selectedJobId, itemId, completed);
      if (!result.persisted) throw new Error('Checklist update used local fallback');
    } catch {
      if (selectedJob.organizationId && auth.userId) {
        try {
          const mutation = await enqueueChecklistMutation({
            organizationId: selectedJob.organizationId,
            actorId: auth.userId,
            jobId: selectedJobId,
            checklistItemId: itemId,
            completed,
          });
          setOfflineChecklistMutations((current) => [...current, mutation]);
          outcome = 'Checklist change saved locally and queued offline.';
        } catch {
          outcome = 'Checklist changed locally, but durable offline storage is unavailable.';
        }
      } else {
        outcome = 'Checklist changed locally without a resolved tenant; reconnect before continuing.';
      }
    }
    const checklist = selectedJob.checklist.map(
      (item) => item.id === itemId ? { ...item, completed } : item,
    );
    const completedChecklistItems = checklist.filter((item) => item.completed).length;
    setSelectedJob({ ...selectedJob, checklist, completedChecklistItems });
    setJobs((current) => current.map((job) => job.id === selectedJobId
      ? { ...job, completedChecklistItems }
      : job));
    setStatusMessage(outcome);
  }

  async function discardReviewedChecklistConflict(mutation: ChecklistOfflineMutation) {
    try {
      await removeOfflineMutation(mutation.id);
    } catch {
      setStatusMessage('The reviewed checklist conflict could not be removed from this phone.');
      return;
    }
    setOfflineChecklistMutations((current) => current.filter((item) => item.id !== mutation.id));
    try {
      const serverJob = await fetchJobDetail(mutation.jobId);
      setJobs((current) => current.map((job) => job.id === serverJob.id ? serverJob : job));
      if (selectedJobId === serverJob.id) setSelectedJob(serverJob);
      setStatusMessage('Discarded the reviewed checklist conflict and restored server state.');
    } catch {
      setStatusMessage('Discarded the reviewed checklist conflict; refresh when the API is available.');
    }
    await replayChecklistMutations();
  }

  async function discardReviewedPhotoConflict(mutation: PhotoUploadOfflineMutation) {
    try {
      await removeOfflineMutation(mutation.id);
    } catch {
      setStatusMessage('The reviewed photo conflict could not be removed from this phone.');
      return;
    }
    setOfflinePhotoMutations((current) => current.filter((item) => item.id !== mutation.id));
    try {
      setJobs(await fetchJobs());
      setStatusMessage('Discarded the reviewed photo conflict and refreshed server photo counts.');
    } catch {
      setStatusMessage('Discarded the reviewed photo conflict; refresh when the API is available.');
    }
    await replayPhotoMutations();
  }

  async function handleStartJob() {
    if (!selectedJobId) {
      return;
    }

    try {
      const result = await startJob(selectedJobId);
      if (!result.persisted) throw new Error('Job start used local fallback');
      setStatusMessage(`Started ${selectedJobId}.`);
    } catch {
      const queued = await queueJobLifecycleAction(selectedJobId, 'start');
      setStatusMessage(
        queued
          ? `Started ${selectedJobId} locally; the change is queued offline.`
          : `Started ${selectedJobId} locally, but durable offline storage is unavailable.`,
      );
      recordManagerActivity({
        title: 'Job started locally',
        message: `${selectedJobId} was started in browser state because the API is not reachable.`,
        tone: 'warning',
        source: 'job',
      });
    }

    setJobs((current) => current.map((job) => (job.id === selectedJobId ? { ...job, status: 'in_progress' } : job)));
    setSelectedJob((current) => (
      current?.id === selectedJobId ? { ...current, status: 'in_progress' } : current
    ));
  }

  async function handleCompleteJob() {
    if (!selectedJobId) {
      return;
    }

    const evidence = requiredPhotoEvidence(
      selectedJob?.beforePhotos ?? 0,
      selectedJob?.afterPhotos ?? 0,
      selectedJobTickets,
    );
    if (!evidence.ready) {
      setStatusMessage(
        `Cannot complete this job yet. Capture ${evidence.missing.join(' and ')} photo evidence first.`,
      );
      return;
    }

    try {
      const result = await completeJob(selectedJobId);
      if (!result.persisted) throw new Error('Job completion used local fallback');
      setStatusMessage(`Completed ${selectedJobId}.`);
      recordManagerActivity({
        title: 'Job completion ready',
        message: `${selectedJobId} was completed and is ready for manager review.`,
        tone: 'success',
        source: 'job',
      });
    } catch {
      const queued = await queueJobLifecycleAction(selectedJobId, 'complete');
      setStatusMessage(
        queued
          ? `Completed ${selectedJobId} locally; the change is queued offline.`
          : `Completed ${selectedJobId} locally, but durable offline storage is unavailable.`,
      );
      recordManagerActivity({
        title: 'Job completed locally',
        message: `${selectedJobId} was completed locally because the API is not reachable.`,
        tone: 'warning',
        source: 'job',
      });
    }

    setJobs((current) => current.map((job) => (job.id === selectedJobId ? { ...job, status: 'completed' } : job)));
    setSelectedJob((current) => (
      current?.id === selectedJobId
        ? {
            ...current,
            status: 'completed',
            completedChecklistItems: current.checklistItems,
            checklist: current.checklist.map((item) => ({ ...item, completed: true })),
          }
        : current
    ));
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

  async function refreshManagerReportQueue(filters: CompletionReportOperationalFilters = {}) {
    if (jobs.length === 0) return;

    setIsLoadingReportQueue(true);
    try {
      let reports: CompletionReportSnapshot[];
      try {
        reports = await fetchCompletionReports(filters);
      } catch {
        reports = await Promise.all(jobs.map((job) => fetchCompletionReport(job.id)));
        reports = reports.filter((report) => matchesCompletionReportOperationalFilters(report, filters));
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

  async function handleJobDispatchAssignment(
    jobId: string,
    crewId: string,
    scheduledDate: string,
    customerNotificationRequired: boolean,
  ) {
    const updated = await updateJobDispatchAssignment(jobId, {
      crewId,
      scheduledDate,
      customerNotificationRequired,
    });
    setJobs((current) => current.map((job) => job.id === updated.id ? updated : job));
    setStatusMessage(`${updated.customerName} moved to ${crewId} on ${scheduledDate}.`);
    setFirstOwnerProgressRefreshSignal((current) => current + 1);
  }

  async function handleCompleteDispatchCustomerNotification(
    jobId: string,
    channel: 'email' | 'sms' | 'phone',
  ) {
    try {
      await completeDispatchCustomerNotification(jobId, channel);
      await refreshOperationalActivity();
      setStatusMessage(`Customer notification follow-up recorded by ${channel}.`);
    } catch {
      setStatusMessage('Customer notification follow-up could not be recorded.');
    }
  }

  async function refreshNotificationHistory(filters: NotificationHistoryFilters) {
    setIsLoadingNotificationHistory(true);
    try {
      const items = await fetchNotificationHistory({
        entityType: filters.entityType === 'all' ? undefined : filters.entityType,
        status: filters.status === 'all' ? undefined : filters.status,
        limit: 25,
      });
      setNotificationHistory(items);
      setNotificationHistoryUnavailable(false);
      setStatusMessage('Notification delivery history refreshed.');
    } catch {
      setNotificationHistoryUnavailable(true);
      setStatusMessage('Could not refresh notification delivery history. Check the API connection and try again.');
      recordManagerActivity({
        title: 'Notification history refresh failed',
        message: 'Manager notification history could not refresh from the backend.',
        tone: 'warning',
        source: 'sync',
      });
    } finally {
      setIsLoadingNotificationHistory(false);
    }
  }

  async function handleRetryNotificationDelivery(
    notificationId: string,
    filters: NotificationHistoryFilters,
  ) {
    setIsLoadingNotificationHistory(true);
    try {
      const retried = await retryNotificationDelivery(notificationId);
      setNotificationHistory(await fetchNotificationHistory({
        entityType: filters.entityType === 'all' ? undefined : filters.entityType,
        status: filters.status === 'all' ? undefined : filters.status,
        limit: 25,
      }));
      setNotificationHistoryUnavailable(false);
      setStatusMessage(`${retried.id} queued for retry.`);
      recordManagerActivity({
        title: 'Notification retry queued',
        message: `${retried.channel} delivery for ${retried.entityId} was returned to the queue.`,
        tone: 'success',
        source: 'sync',
      });
    } catch {
      setStatusMessage('Could not retry the notification. Confirm it is failed or needs attention.');
      recordManagerActivity({
        title: 'Notification retry failed',
        message: 'A notification delivery retry could not be queued.',
        tone: 'warning',
        source: 'sync',
      });
    } finally {
      setIsLoadingNotificationHistory(false);
    }
  }

  async function handleResolveNotificationDelivery(
    notificationId: string,
    filters: NotificationHistoryFilters,
  ) {
    setIsLoadingNotificationHistory(true);
    try {
      const resolved = await resolveNotificationDelivery(notificationId);
      setNotificationHistory(await fetchNotificationHistory({
        entityType: filters.entityType === 'all' ? undefined : filters.entityType,
        status: filters.status === 'all' ? undefined : filters.status,
        limit: 25,
      }));
      setNotificationHistoryUnavailable(false);
      setStatusMessage(`${resolved.id} marked resolved.`);
      recordManagerActivity({
        title: 'Notification resolved',
        message: `${resolved.channel} delivery for ${resolved.entityId} was marked resolved.`,
        tone: 'success',
        source: 'sync',
      });
    } catch {
      setStatusMessage('Could not resolve the notification. Confirm it is failed or needs attention.');
      recordManagerActivity({
        title: 'Notification resolution failed',
        message: 'A notification delivery item could not be marked resolved.',
        tone: 'warning',
        source: 'sync',
      });
    } finally {
      setIsLoadingNotificationHistory(false);
    }
  }

  async function refreshPhotoProcessingHistory(filters: PhotoProcessingRecoveryFilters) {
    setIsLoadingPhotoProcessingHistory(true);
    try {
      const items = await fetchPhotoProcessingHistory({
        taskType: 'thumbnail_generation',
        status: filters.status === 'all' ? undefined : filters.status,
        limit: 25,
      });
      setPhotoProcessingHistory(items);
      setStatusMessage('Photo processing recovery queue refreshed.');
    } catch {
      setStatusMessage('Could not refresh photo processing history. Check the API connection and try again.');
      recordManagerActivity({
        title: 'Photo processing refresh failed',
        message: 'Manager photo processing recovery history could not refresh from the backend.',
        tone: 'warning',
        source: 'sync',
      });
    } finally {
      setIsLoadingPhotoProcessingHistory(false);
    }
  }

  async function handleRetryPhotoProcessing(
    processingJobId: string,
    filters: PhotoProcessingRecoveryFilters,
  ) {
    setIsLoadingPhotoProcessingHistory(true);
    try {
      const retried = await retryPhotoProcessingJob(processingJobId);
      setPhotoProcessingHistory(await fetchPhotoProcessingHistory({
        taskType: 'thumbnail_generation',
        status: filters.status === 'all' ? undefined : filters.status,
        limit: 25,
      }));
      setStatusMessage(`${retried.id} queued for photo processing retry.`);
      recordManagerActivity({
        title: 'Photo processing retry queued',
        message: `${retried.fileName} thumbnail work was returned to the queue.`,
        tone: 'success',
        source: 'photo',
      });
    } catch {
      setStatusMessage('Could not retry photo processing. Confirm the job is failed or needs attention.');
      recordManagerActivity({
        title: 'Photo processing retry failed',
        message: 'A thumbnail processing retry could not be queued.',
        tone: 'warning',
        source: 'photo',
      });
    } finally {
      setIsLoadingPhotoProcessingHistory(false);
    }
  }

  async function handleResolvePhotoProcessing(
    processingJobId: string,
    filters: PhotoProcessingRecoveryFilters,
  ) {
    setIsLoadingPhotoProcessingHistory(true);
    try {
      const resolved = await resolvePhotoProcessingJob(processingJobId);
      setPhotoProcessingHistory(await fetchPhotoProcessingHistory({
        taskType: 'thumbnail_generation',
        status: filters.status === 'all' ? undefined : filters.status,
        limit: 25,
      }));
      setStatusMessage(`${resolved.id} marked resolved.`);
      recordManagerActivity({
        title: 'Photo processing resolved',
        message: `${resolved.fileName} thumbnail work was marked resolved.`,
        tone: 'success',
        source: 'photo',
      });
    } catch {
      setStatusMessage('Could not resolve photo processing. Confirm the job is failed or needs attention.');
      recordManagerActivity({
        title: 'Photo processing resolution failed',
        message: 'A thumbnail processing job could not be marked resolved.',
        tone: 'warning',
        source: 'photo',
      });
    } finally {
      setIsLoadingPhotoProcessingHistory(false);
    }
  }

  async function refreshPhotoErasureDeletionHistory() {
    setIsLoadingPhotoErasureDeletionHistory(true);
    try {
      setPhotoErasureDeletionHistory(await fetchPhotoErasureDeletionHistory());
      setStatusMessage('Photo erasure deletion recovery queue refreshed.');
    } catch {
      setStatusMessage('Could not refresh photo erasure deletion history.');
    } finally {
      setIsLoadingPhotoErasureDeletionHistory(false);
    }
  }

  async function handleRetryPhotoErasureDeletion(id: string) {
    setIsLoadingPhotoErasureDeletionHistory(true);
    try {
      const retried = await retryPhotoErasureDeletionJob(id);
      setPhotoErasureDeletionHistory(await fetchPhotoErasureDeletionHistory());
      setStatusMessage(`${retried.id} queued for object deletion retry.`);
      recordManagerActivity({
        title: 'Photo erasure deletion retry queued',
        message: `${retried.objectKey} was returned to the deletion queue.`,
        tone: 'success',
        source: 'photo',
      });
    } catch {
      setStatusMessage('Could not retry the photo erasure object deletion.');
    } finally {
      setIsLoadingPhotoErasureDeletionHistory(false);
    }
  }

  async function handleResolvePhotoErasureDeletion(id: string) {
    setIsLoadingPhotoErasureDeletionHistory(true);
    try {
      const resolved = await resolvePhotoErasureDeletionJob(id);
      setPhotoErasureDeletionHistory(await fetchPhotoErasureDeletionHistory());
      setStatusMessage(`${resolved.id} marked resolved.`);
      recordManagerActivity({
        title: 'Photo erasure deletion resolved',
        message: `${resolved.objectKey} was manually resolved.`,
        tone: 'success',
        source: 'photo',
      });
    } catch {
      setStatusMessage('Could not resolve the photo erasure object deletion.');
    } finally {
      setIsLoadingPhotoErasureDeletionHistory(false);
    }
  }

  async function handleCustomerPrivacyExport(accountId: string) {
    setIsLoadingCustomerPrivacy(true);
    try {
      const privacyExport = await fetchCustomerPrivacyExport(accountId);
      setCustomerPrivacyExport(privacyExport);
      setCustomerPhotoErasureSummary(null);
      setStatusMessage(`Exported privacy data for ${privacyExport.account.customerName}.`);
      recordManagerActivity({
        title: 'Customer privacy export created',
        message: `${privacyExport.account.customerName} export includes ${privacyExport.photoEvidence.length} photo evidence metadata item${privacyExport.photoEvidence.length === 1 ? '' : 's'}.`,
        tone: 'success',
        source: 'sync',
      });
    } catch {
      setStatusMessage('Could not export customer privacy data. Confirm the account is in scope.');
      recordManagerActivity({
        title: 'Customer privacy export failed',
        message: 'A customer account privacy export could not be loaded from the backend.',
        tone: 'warning',
        source: 'sync',
      });
    } finally {
      setIsLoadingCustomerPrivacy(false);
    }
  }

  async function handleCustomerPhotoErasure(accountId: string, reason: string) {
    setIsLoadingCustomerPrivacy(true);
    try {
      const erasure = await eraseCustomerPhotoEvidence(accountId, reason);
      setCustomerPhotoErasureSummary(erasure);
      const privacyExport = await fetchCustomerPrivacyExport(accountId);
      setCustomerPrivacyExport(privacyExport);
      setStatusMessage(`Erased retained photo evidence for ${accountId}.`);
      recordManagerActivity({
        title: 'Customer photo evidence erased',
        message: `${erasure.erasedPhotoCount} photo evidence item${erasure.erasedPhotoCount === 1 ? '' : 's'} erased for ${accountId}.`,
        tone: 'success',
        source: 'photo',
      });
    } catch {
      setStatusMessage('Could not erase customer photo evidence. Confirm the reason and account scope.');
      recordManagerActivity({
        title: 'Customer photo erasure failed',
        message: 'A customer photo evidence erasure request could not be completed.',
        tone: 'warning',
        source: 'photo',
      });
    } finally {
      setIsLoadingCustomerPrivacy(false);
    }
  }

  async function handleStartReportReview(reportId: string) {
    setCompletionReportActionStatus('Starting manager review...');

    try {
      const action = await startCompletionReportReview(reportId);
      await refreshCompletionReport(action.jobId);
      await refreshOperationalActivity();
      setStatusMessage(`${action.reportId} is in manager review.`);
      setCompletionReportActionStatus(null);
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
      await refreshOperationalActivity();
      setStatusMessage(`${action.reportId} has changes requested.`);
      setCompletionReportActionStatus(null);
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
      await refreshOperationalActivity();
      setStatusMessage(`${action.reportId} resubmitted for manager review.`);
      setCompletionReportActionStatus(null);
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
      await refreshOperationalActivity();
      setStatusMessage(`${action.reportId} delivered to the customer portal.`);
      setCompletionReportActionStatus(null);
    } catch {
      setCompletionReportActionStatus(null);
      setStatusMessage('Could not deliver. Confirm the report passed review and delivery readiness checks.');
    }
  }

  async function handleQueueReportDeliveryNotification(
    reportId: string,
    channel: 'email' | 'sms',
    recipient: string,
  ) {
    setCompletionReportActionStatus('Queueing customer notification...');

    try {
      const notification = await queueCompletionReportDeliveryNotification(reportId, channel, recipient);
      try {
        setNotificationHistory(await fetchNotificationHistory({ limit: 25 }));
        setNotificationHistoryUnavailable(false);
      } catch {
        setNotificationHistoryUnavailable(true);
        recordManagerActivity({
          title: 'Notification history refresh failed',
          message: 'The customer notification was queued, but the history panel did not refresh.',
          tone: 'warning',
          source: 'sync',
        });
      }
      setStatusMessage(`${notification.reportId} notification queued for ${notification.recipient}.`);
      setCompletionReportActionStatus(null);
      recordManagerActivity({
        title: 'Completion report notification queued',
        message: `${notification.channel} delivery queued for ${notification.reportId}.`,
        tone: 'success',
        source: 'sync',
      });
    } catch (error) {
      setCompletionReportActionStatus(null);
      setStatusMessage(
        isApiErrorCode(error, 'completion_report_notification_preference_blocked')
          ? 'Delivery blocked by this customer’s account preferences. Enable the selected channel and use the configured account recipient.'
          : 'Could not queue the customer notification. Confirm the report is delivered and the recipient is valid.',
      );
    }
  }

  async function handlePhotoSelected(file: File, photoType: FieldPhotoType) {
    if (!selectedJobId) {
      return;
    }

    const metadata = await readPhotoUploadMetadata(file);
    const quality = assessPhotoQuality(file, metadata, selectedJobTickets);
    if (!quality.accepted) {
      setStatusMessage(`Photo not added: ${photoQualityMessage(quality)}.`);
      return;
    }

    let ticket: PhotoUploadTicket;

    try {
      ticket = await createPhotoUploadTicket(selectedJobId, file, photoType);
      await uploadPhotoToTicket(ticket, file);
      await completePhotoUpload(selectedJobId, ticket.photoId, metadata);
      ticket = {
        ...ticket,
        status: 'uploaded',
        fileSizeBytes: metadata.fileSizeBytes,
        imageWidthPx: metadata.imageWidthPx,
        imageHeightPx: metadata.imageHeightPx,
        metadataSource: 'client_reported',
      };
      setStatusMessage(`Uploaded ${photoType} photo evidence for ${file.name}.`);
      recordManagerActivity({
        title: 'Photo evidence uploaded',
        message: `${photoType} photo evidence was uploaded for ${selectedJobId}.`,
        tone: 'success',
        source: 'photo',
      });
    } catch {
      ticket = createLocalPhotoTicket(selectedJobId, file, photoType, metadata);
      let queued = false;
      if (selectedJob?.organizationId && auth.userId) {
        try {
          const mutation = await enqueuePhotoUploadMutation(
            {
              organizationId: selectedJob.organizationId,
              actorId: auth.userId,
              jobId: selectedJobId,
              photoType,
              fileName: file.name,
            },
            file,
          );
          setOfflinePhotoMutations((current) => [...current, mutation]);
          void requestPersistentOfflineStorage();
          queued = true;
        } catch {
          queued = false;
        }
      }
      setStatusMessage(
        queued
          ? `Saved ${photoType} photo in the durable offline queue.`
          : `Prepared ${photoType} photo locally, but it could not be queued for offline upload.`,
      );
      recordManagerActivity({
        title: queued ? 'Photo evidence queued offline' : 'Photo evidence saved locally',
        message: queued
          ? `${photoType} photo evidence for ${selectedJobId} is queued durably until the API is reachable.`
          : `${photoType} photo evidence for ${selectedJobId} is browser-local until the API is reachable.`,
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
    <main className="authenticated-workspace-shell min-h-screen overflow-x-hidden bg-bone text-ink md:pl-24 lg:pl-60">
      <DesktopWorkspaceNavigation
        activeView={mobileView}
        hasEnvironmentBanner={auth.authMode !== 'cognito'}
        hasSelectedJob={Boolean(selectedJobId)}
        navigationItems={activePersona.navigation}
        onChange={(view) => {
          if (view === 'manager') {
            setManagerWorkspaceSection(null);
            setManagerWorkspaceTool(null);
          }
          changeMobileView(view, true);
        }}
        onSignOut={hostedSignOut}
        personaLabel={activePersona.label}
        signedInName={auth.displayName || 'Signed-in user'}
      />
      <section className={`relative min-h-[20rem] overflow-hidden bg-emerald-950 px-8 py-8 text-white ${mobileView === 'home' ? 'hidden lg:block' : 'hidden'}`} id="workspace-home-hero">
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          src="/brand/grover-landscape-home-hero.webp"
        />
        <span className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-emerald-950/20" />
        <span className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        <div className="relative mx-auto flex min-h-[16rem] max-w-6xl flex-col">
          <div className="flex items-center justify-end gap-5">
            <p className="rounded-xl border border-white/15 bg-slate-950/30 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-sm">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="mt-auto grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <p className="text-base font-bold text-emerald-200">
                {homeGreeting(new Date().getHours())}, {auth.displayName?.split(/[\s@]/)[0] || 'there'}
              </p>
              <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold leading-[0.98] tracking-tight xl:text-6xl">
                {personaHomeHeadline(activePersona)}
              </h1>
              <p className="mt-4 max-w-xl text-lg font-medium leading-7 text-slate-100">
                {personaHomePromise(activePersona)}
              </p>
              <div className="mt-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em]">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
                  {activePersona.label}
                </span>
                <span className="text-emerald-300">Plan</span>
                <span aria-hidden="true" className="text-emerald-400">•</span>
                <span className="text-emerald-300">Care</span>
                <span aria-hidden="true" className="text-emerald-400">•</span>
                <span className="text-emerald-300">Proof</span>
              </div>
            </div>
            <aside className="rounded-2xl border border-white/15 bg-slate-950/45 p-5 shadow-grover-md backdrop-blur-md">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                {personaProgressLanguage(activePersona).eyebrow}
              </p>
              <p className="mt-3 text-4xl font-black">
                {workspaceRoles.length === 0
                  ? '—'
                  : isLoadingJobs
                    ? '…'
                    : `${jobs.filter((job) => job.status === 'completed').length}/${jobs.length}`}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-200">
                {workspaceRoles.length === 0
                  ? 'Protected work stays hidden'
                  : personaProgressLanguage(activePersona).completed}
              </p>
              <div className="my-4 h-px bg-white/15" />
              <p className="text-sm font-bold text-white">{workspaceGuidance.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{workspaceGuidance.description}</p>
            </aside>
          </div>
        </div>
      </section>

      <MobileWorkspaceHeader
        activePersonaId={activePersona.id}
        assignedJobCount={jobs.length}
        availablePersonas={availablePersonas}
        onBackToJobs={() => changeMobileView('jobs')}
        onPersonaChange={(personaId) => {
          const persona = selectWorkspacePersona(personaId);
          if (!persona) return;
          if (persona.defaultView === 'manager') {
            setManagerWorkspaceSection(null);
            setManagerWorkspaceTool(null);
          }
          changeMobileView(persona.defaultView, true);
        }}
        onSignOut={hostedSignOut}
        pendingChangeCount={
          fieldRecovery.pendingChangeCount
        }
        routeOverview={crewRouteOverview}
        personaDescription={activePersona.description}
        personaLabel={activePersona.label}
        signedInName={auth.displayName || 'Signed-in user'}
        selectedCustomerName={selectedJob?.customerName}
        selectedJobStatus={selectedJob?.status}
        selectedPropertyAddress={selectedJob?.propertyAddress}
        view={mobileView}
      />

      <section className="mx-auto grid max-w-7xl gap-5 px-3 py-4 sm:gap-6 sm:px-6 sm:py-8 lg:grid-cols-1 lg:gap-4 lg:px-8 lg:py-6">
        <div className="min-w-0">
          <div className={mobileView === 'home' ? 'block' : 'hidden'}>
            <WorkspaceHomePanel
              assignedJobCount={homeWorkSummary.assigned}
              completedJobCount={homeWorkSummary.completed}
              hasSelectedJob={Boolean(selectedJobId)}
              hasWorkspaceRole={workspaceRoles.length > 0}
              onOpen={(view) => {
                if (view === 'manager') {
                  setManagerWorkspaceSection(null);
                  setManagerWorkspaceTool(null);
                }
                changeMobileView(view, true);
              }}
              pendingChangeCount={
                fieldRecovery.pendingChangeCount
              }
              persona={activePersona}
              portalReadState={portalHomeReadState}
              routeOverview={crewRouteOverview}
              signedInName={auth.displayName || 'Signed-in user'}
            />
          </div>
          <div className={`${workspaceSurfaces.fieldOperations && mobileView === 'route' ? 'block' : 'hidden'} scroll-mt-16`} id="today-route">
            <DayPlanPanel
              actorId={auth.userId}
              jobDetailsEnabled={fieldControls.jobDetails}
              onSelectJob={selectJobForReview}
              onOverviewChange={handleCrewRouteOverviewChange}
              refreshSignal={dayPlanRefreshSignal}
              routeChangesEnabled={fieldControls.routeChanges}
              stopProgressEnabled={fieldControls.stopProgress}
            />
          </div>
          <AssignedJobsPanel
            className={workspaceSurfaces.fieldOperations && mobileView === 'jobs' ? 'block' : 'hidden'}
            jobs={jobs}
            jobsUnavailable={jobsUnavailable}
            onSelectJob={selectJobForReview}
            recovery={(
              <FieldOfflineRecoveryPanel
                checklistMutations={offlineChecklistMutations}
                isOnline={navigator.onLine}
                isReplayingChecklist={isReplayingChecklistMutations}
                isReplayingJobs={isReplayingJobMutations}
                isReplayingPhotos={isReplayingPhotoMutations}
                jobMutations={offlineJobMutations}
                jobs={jobs}
                onDiscardChecklistConflict={discardReviewedChecklistConflict}
                onDiscardJobConflict={discardReviewedJobConflict}
                onDiscardPhotoConflict={discardReviewedPhotoConflict}
                onReplayChecklist={replayChecklistMutations}
                onReplayJobs={replayJobLifecycleMutations}
                onReplayPhotos={replayPhotoMutations}
                photoMutations={offlinePhotoMutations}
                recovery={fieldRecovery}
                selectedJob={selectedJob}
              />
            )}
            selectedJobId={selectedJobId}
            statusMessage={statusMessage}
          />

          <div className={workspaceSurfaces.customerCare && mobileView === 'customer' ? 'space-y-6' : 'hidden'} id="customer-workspace">
            {customerWorkspaceMode === 'portfolio' ? (
              <PropertyManagerAuthorizedPortfolioPanel
                rolloutUnit={managedPersonaUnit}
                properties={customerPortalProperties}
                visits={customerPortalVisits}
                readState={portalHomeReadState}
                onRetry={() => setCustomerPortalVisitRefreshSignal((current) => current + 1)}
                onReturnHome={() => changeMobileView('home', true)}
              />
            ) : customerWorkspaceMode === 'yard' ? (
              <YardOwnerPortalPanel
                customerDisplayName={auth.displayName}
                rolloutUnit={managedPersonaUnit}
                properties={customerPortalProperties}
                visits={customerPortalVisits}
                isLoadingVisits={isLoadingCustomerPortalVisits}
                visitReadError={customerPortalVisitError}
                onRetryVisits={() => setCustomerPortalVisitRefreshSignal((current) => current + 1)}
                onReturnHome={() => changeMobileView('home', true)}
              />
            ) : (
              <WorkspaceStatusNotice
                detail="This proposed persona does not yet have an authoritative customer-account workflow. No customer data is shown."
                title={`${activePersona.label} customer workspace is not available.`}
                tone="neutral"
              />
            )}
          </div>

          {canUseManagerTools ? (
          <details className={`${mobileView === 'manager' ? 'block' : 'hidden'} mt-0 scroll-mt-16 rounded-2xl border border-slate-200 bg-paper p-3 shadow-grover-sm open:bg-transparent open:p-0 open:shadow-none`} id="manager-tools" open={mobileView === 'manager' ? true : undefined}>
            <summary className="cursor-pointer list-none rounded-xl bg-forest px-4 py-3 font-semibold text-white [&::-webkit-details-marker]:hidden">
              {managerWorkspaceHeading}
              <span className="ml-2 text-xs font-normal text-slate-300">{managerWorkspaceDescription}</span>
            </summary>
            <div className="mt-5 space-y-6">
          {managerWorkspaceSection === null ? (
            <ManagerWorkspaceMenu
              activeSection={managerWorkspaceSection}
              capabilities={activeWorkspace.capabilities}
              onChange={(section) => {
                setManagerWorkspaceSection(section);
                setManagerWorkspaceTool(
                  section === 'team' && activePersona.id === 'company-owner'
                    ? 'team-overview'
                    : null,
                );
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              personaId={activePersona.id}
              rolloutUnit={managedPersonaUnit}
              signals={managerWorkspaceSignals}
            />
          ) : null}
          {managerWorkspaceSection ? (
            <ManagerWorkspaceToolMenu
              activeTool={managerWorkspaceTool}
              capabilities={activeWorkspace.capabilities}
              onBack={() => {
                setManagerWorkspaceSection(null);
                setManagerWorkspaceTool(null);
              }}
              onClear={() => setManagerWorkspaceTool(null)}
              onChange={(tool) => {
                setManagerWorkspaceTool(tool);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              personaId={activePersona.id}
              rolloutUnit={managedPersonaUnit}
              section={managerWorkspaceSection}
            />
          ) : null}
          <ManagerToolSurface activeTool={activeAuthorizedManagerTool} tool="owner-setup">
          <FirstOwnerOnboardingPanel
            providerEntryMode={providerEntryMode}
            crewBranchRequest={crewAdministrationBranch}
            crewSelectionRequest={crewAdministrationSelection}
            crewSelectionSignal={crewAdministrationSelectionSignal}
            crewTerritoryRequest={crewAdministrationTerritory}
            crewInspectionReturnLabel={
              crewAdministrationReturnTarget === 'team-activity'
                ? 'Return to owner activity'
                : undefined
            }
            crewInspectionSummary={crewAdministrationInspectionSummary}
            crewInspectionAuditLabel={crewAdministrationInspectionAuditLabel}
            crewInspectionAuditId={crewAdministrationInspectionAuditId}
            crewInspectedDestinationBranchId={
              crewAdministrationInspectedDestinationBranchId
            }
            crewInspectedDestinationTerritoryId={
              crewAdministrationInspectedDestinationTerritoryId
            }
            hierarchyRefreshSignal={dispatchHierarchyRefreshSignal}
            onOpenSetupStep={openFirstOwnerSetupStep}
            refreshSignal={firstOwnerProgressRefreshSignal}
            onCrewCreated={() => {
              setCrewRefreshSignal((current) => current + 1);
              setDispatchHierarchyRefreshSignal((current) => current + 1);
            }}
            onCrewChanged={() => {
              setCrewRefreshSignal((current) => current + 1);
              setDispatchHierarchyRefreshSignal((current) => current + 1);
              setTeamActivityRefreshSignal((current) => current + 1);
            }}
            onReturnToDispatchHierarchy={() => {
              setManagerWorkspaceSection('schedule');
              setManagerWorkspaceTool('dispatch-hierarchy');
              window.setTimeout(() => {
                const target = document.getElementById('dispatch-hierarchy-administration');
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target?.focus({ preventScroll: true });
              }, 0);
            }}
            onReturnFromCrewInspection={() => {
              setManagerWorkspaceSection('team');
              setManagerWorkspaceTool('team-activity');
              const inspectedAuditId = crewAdministrationInspectionAuditId;
              setCrewAdministrationReturnTarget(undefined);
              setCrewAdministrationInspectionSummary(undefined);
              setCrewAdministrationInspectionAuditLabel(undefined);
              setCrewAdministrationInspectionAuditId(undefined);
              setCrewAdministrationInspectedDestinationBranchId(undefined);
              setCrewAdministrationInspectedDestinationTerritoryId(undefined);
              setTeamActivityReturnedAuditId(inspectedAuditId);
              setTeamActivityReturnedAuditSignal((current) => current + 1);
              window.setTimeout(() => {
                const target = inspectedAuditId
                  ? document.getElementById(`team-activity-${inspectedAuditId}`)
                  : document.getElementById('team-activity-review');
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target?.focus({ preventScroll: true });
              }, 0);
            }}
            onFindLatestCrewHierarchyMove={(crew) => {
              setManagerWorkspaceSection('team');
              setManagerWorkspaceTool('team-activity');
              setCrewAdministrationReturnTarget(undefined);
              setCrewAdministrationInspectionSummary(undefined);
              setCrewAdministrationInspectionAuditLabel(undefined);
              setCrewAdministrationInspectionAuditId(undefined);
              setCrewAdministrationInspectedDestinationBranchId(undefined);
              setCrewAdministrationInspectedDestinationTerritoryId(undefined);
              setTeamActivityRequestedCrewId(crew.id);
              setTeamActivityRequestedCrewBranchId(crew.branchId ?? undefined);
              setTeamActivityRequestedCrewTerritoryId(crew.territoryId ?? undefined);
              setTeamActivityRequestedCrewSignal((current) => current + 1);
              window.setTimeout(() => {
                const target = document.getElementById('team-activity-review');
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target?.focus({ preventScroll: true });
              }, 0);
            }}
            onOrganizationReady={(organizationName, organizationId) => {
              setActiveManagerOrganizationId(organizationId);
              setFirstOwnerProgressRefreshSignal((current) => current + 1);
              setStatusMessage(`${organizationName} owner setup completed.`);
              recordManagerActivity({
                title: 'Organization owner setup completed',
                message: `${organizationName} was created with the signed-in user as owner.`,
                tone: 'success',
                source: 'sync',
              });
            }}
          />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="scroll-mt-20"
            id="first-owner-day-plan"
            tool="day-plan"
          >
            <ManagerDayPlanPanel
              crewRefreshSignal={crewRefreshSignal}
              jobs={jobs}
              onDayPlanPublished={(dayPlan) => {
                setDayPlanRefreshSignal((current) => current + 1);
                setFirstOwnerProgressRefreshSignal((current) => current + 1);
                recordManagerActivity({
                  title: 'Day plan published',
                  message: `${dayPlan.crewId} route for ${dayPlan.serviceDate} was published and crew route refreshed.`,
                  tone: 'success',
                  source: 'route',
                });
              }}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="company-readiness"
          >
            <ManagementCompanyPreviewPanel
              company={managementCompanyPreview}
              crews={managementCompanyPreviewCrews}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6 scroll-mt-20"
            id="property-operational-profile"
            tool="property-profile"
          >
            <ManagerPropertyOnboardingPanel
              properties={managerPropertyOnboardingOptions}
              requestedPropertyId={requestedOperationalProfilePropertyId}
              onSaved={(profile) => {
                setPropertyOnboardingRefreshSignal((current) => current + 1);
                setCustomerAccountRefreshSignal((current) => current + 1);
                setStatusMessage(`Saved onboarding profile for ${profile.propertyId}.`);
                recordManagerActivity({
                  title: 'Property onboarding saved',
                  message: `${profile.propertyId} is ${profile.onboardingStatus} and ${profile.persisted ? 'persisted' : 'using local fallback'}.`,
                  tone: profile.persisted ? 'success' : 'warning',
                  source: 'sync',
                });
              }}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6 scroll-mt-20"
            id="property-service-setup"
            tool="property-service"
          >
            <ManagerPropertySetupPanel
              properties={managerCustomerProperties}
              onboardingRefreshSignal={propertyOnboardingRefreshSignal}
              requestedPropertyId={requestedServiceSetupPropertyId}
              onSetupChanged={() => setCustomerAccountRefreshSignal((current) => current + 1)}
              onPropertyUpdated={(property) => registerManagerProperties([property])}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="customer-accounts"
          >
            <ManagerCustomerAccountOnboardingPanel
              organizationId={activeManagerOrganizationId}
              onOpenPropertyWorkspace={openPropertyWorkspace}
              refreshSignal={customerAccountRefreshSignal}
              onPropertiesLoaded={registerManagerProperties}
              onPropertyCreated={(property) => {
                registerManagerProperties([property]);
                setStatusMessage(`${property.displayName} is ready for operational onboarding.`);
              }}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6 scroll-mt-20"
            tool="team-members"
          >
            <ManagerTeamMembershipsPanel
              actorUserId={auth.userId}
              onTeamChanged={() => {
                setTeamActivityRefreshSignal((current) => current + 1);
                setFirstOwnerProgressRefreshSignal((current) => current + 1);
              }}
              organizationId={activeManagerOrganizationId}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="team-overview"
          >
            <TeamOrganizationOverviewPanel
              organizationId={activeManagerOrganizationId}
              refreshSignal={
                teamActivityRefreshSignal
                + firstOwnerProgressRefreshSignal
                + crewRefreshSignal
                + dispatchHierarchyRefreshSignal
              }
              onOpenMembers={() => setManagerWorkspaceTool('team-members')}
              onOpenInvitations={() => setManagerWorkspaceTool('team-invitations')}
              onOpenActivity={() => setManagerWorkspaceTool('team-activity')}
              onOpenHierarchy={() => {
                setManagerWorkspaceSection('schedule');
                setManagerWorkspaceTool('dispatch-hierarchy');
                window.setTimeout(() => {
                  const target = document.getElementById('dispatch-hierarchy-administration');
                  target?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                  target?.focus({ preventScroll: true });
                }, 0);
              }}
              onOpenCrews={() => {
                setManagerWorkspaceSection('overview');
                setManagerWorkspaceTool('owner-setup');
                setCrewAdministrationReturnTarget(undefined);
                window.setTimeout(() => {
                  const target = document.getElementById('crew-administration');
                  target?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                  target?.focus({ preventScroll: true });
                }, 0);
              }}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6 scroll-mt-20"
            id="first-owner-team-invitations"
            tool="team-invitations"
          >
            <ManagerTeamInvitationsPanel
              onTeamChanged={() => {
                setTeamActivityRefreshSignal((current) => current + 1);
                setFirstOwnerProgressRefreshSignal((current) => current + 1);
              }}
              organizationId={activeManagerOrganizationId}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6 scroll-mt-20"
            tool="team-activity"
          >
            <ManagerTeamActivityPanel
              onOpenCrew={(activity) => {
                setManagerWorkspaceSection('overview');
                setManagerWorkspaceTool('owner-setup');
                setCrewAdministrationSelection(activity.targetId);
                setCrewAdministrationBranch(undefined);
                setCrewAdministrationTerritory(undefined);
                setCrewAdministrationReturnTarget('team-activity');
                setCrewAdministrationInspectionSummary(
                  `${
                    activity.crossBranchMove ? 'Cross-branch' : 'Within-branch'
                  } audited move: ${
                    activity.sourceBranchLabel ?? 'unknown branch'
                  } · ${
                    activity.sourceTerritoryLabel ?? 'unknown territory'
                  } → ${
                    activity.destinationBranchLabel ?? 'unknown branch'
                  } · ${
                    activity.destinationTerritoryLabel ?? 'unknown territory'
                  }`,
                );
                setCrewAdministrationInspectionAuditLabel(
                  `Audit ${activity.id} · ${new Date(activity.occurredAt).toLocaleString()}`,
                );
                setCrewAdministrationInspectionAuditId(activity.id);
                setCrewAdministrationInspectedDestinationBranchId(
                  activity.destinationBranchId,
                );
                setCrewAdministrationInspectedDestinationTerritoryId(
                  activity.destinationTerritoryId,
                );
                setCrewAdministrationSelectionSignal((current) => current + 1);
                const target = document.getElementById('crew-administration');
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target?.focus({ preventScroll: true });
              }}
              organizationId={activeManagerOrganizationId}
              requestedCrewId={teamActivityRequestedCrewId}
              requestedCrewBranchId={teamActivityRequestedCrewBranchId}
              requestedCrewSignal={teamActivityRequestedCrewSignal}
              requestedCrewTerritoryId={teamActivityRequestedCrewTerritoryId}
              returnedAuditId={teamActivityReturnedAuditId}
              returnedAuditSignal={teamActivityReturnedAuditSignal}
              refreshSignal={teamActivityRefreshSignal}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="customer-portal"
          >
            <CustomerPortalPreviewPanel
              customer={customerPortalPreviewCustomer}
              properties={customerPortalPreviewProperties}
              workSummaries={customerPortalPreviewWorkSummaries}
              completionReportsByProperty={propertyCompletionReports}
              isLoadingReportHistory={isLoadingPropertyCompletionReports}
              hasReportHistoryError={hasPropertyCompletionReportHistoryError}
              projectBids={customerProjectBids}
              isLoadingProjectBids={isLoadingCustomerProjectBids}
              hasProjectBidHistoryError={hasCustomerProjectBidHistoryError}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="customer-portfolios"
          >
            <CustomerPortfolioSummaryPanel
              customer={customerPortalPreviewCustomer}
              portfolios={customerPortalPreviewPortfolios}
              properties={customerPortalPreviewProperties}
              links={customerPortalPreviewPortfolioLinks}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="operations-activity"
          >
            <ManagerActivityHistoryPanel
              items={visibleManagerActivity}
              isHistoryPersisted={isManagerActivityPersisted}
              isOperationalActivityUnavailable={operationalActivityUnavailable}
              canLoadOlder={canLoadOlderOperationalActivity}
              isLoadingOlder={isLoadingOlderOperationalActivity}
              onLoadOlder={() => void loadOlderOperationalActivity()}
              onResetHistory={resetManagerActivityHistory}
              onCompleteDispatchNotification={handleCompleteDispatchCustomerNotification}
              onOpenOperationalException={(exceptionId) => {
                setRequestedOperationalExceptionId(exceptionId);
                setRequestedOperationalExceptionSignal((current) => current + 1);
                setManagerWorkspaceSection('recovery');
                setManagerWorkspaceTool('operational-exceptions');
              }}
            />
          </ManagerToolSurface>
          {canReviewMarketingLeads ? (
            <ManagerToolSurface
              activeTool={activeAuthorizedManagerTool}
              className="mt-6"
              tool="conversion-dashboard"
            >
              <ManagerMarketingConversionDashboard />
            </ManagerToolSurface>
          ) : null}
          {canReviewMarketingLeads ? (
            <ManagerToolSurface
              activeTool={activeAuthorizedManagerTool}
              className="mt-6"
              tool="marketing-leads"
            >
              <ManagerMarketingLeadInboxPanel />
            </ManagerToolSurface>
          ) : null}
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="notifications"
          >
            <ManagerNotificationHistoryPanel
              notifications={notificationHistory}
              isUnavailable={notificationHistoryUnavailable}
              isLoading={isLoadingNotificationHistory}
              onRefresh={(filters) => void refreshNotificationHistory(filters)}
              onRetry={(notificationId, filters) => void handleRetryNotificationDelivery(notificationId, filters)}
              onResolve={(notificationId, filters) => void handleResolveNotificationDelivery(notificationId, filters)}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="photo-processing"
          >
            <ManagerPhotoProcessingRecoveryPanel
              items={photoProcessingHistory}
              isLoading={isLoadingPhotoProcessingHistory}
              onRefresh={(filters) => void refreshPhotoProcessingHistory(filters)}
              onRetry={(processingJobId, filters) => void handleRetryPhotoProcessing(processingJobId, filters)}
              onResolve={(processingJobId, filters) => void handleResolvePhotoProcessing(processingJobId, filters)}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="operational-exceptions"
          >
            <ManagerOperationalExceptionsPanel
              organizationId={activeManagerOrganizationId}
              onActivityChanged={() => void refreshOperationalActivity()}
              requestedExceptionId={requestedOperationalExceptionId}
              requestedExceptionSignal={requestedOperationalExceptionSignal}
              onOpenAffectedResource={(resourceType, resourceId) => {
                if (resourceType === 'job') {
                  setSelectedJobId(resourceId);
                  changeMobileView('job', true);
                  return;
                }
                if (resourceType === 'property') {
                  openPropertyWorkspace(resourceId, 'operational-profile');
                  return;
                }
                setManagerWorkspaceSection('schedule');
                setManagerWorkspaceTool('day-plan');
                window.setTimeout(() => {
                  document.getElementById('first-owner-day-plan')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }, 0);
              }}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="customer-privacy"
          >
            <ManagerCustomerPrivacyPanel
              accountIds={privacyAccountIds}
              exportResult={customerPrivacyExport}
              erasureResult={customerPhotoErasureSummary}
              isLoading={isLoadingCustomerPrivacy}
              onExport={(accountId) => void handleCustomerPrivacyExport(accountId)}
              onErasePhotos={(accountId, reason) => void handleCustomerPhotoErasure(accountId, reason)}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="photo-erasure"
          >
            <ManagerPhotoErasureRecoveryPanel
              items={photoErasureDeletionHistory}
              isLoading={isLoadingPhotoErasureDeletionHistory}
              onRefresh={() => void refreshPhotoErasureDeletionHistory()}
              onRetry={(id) => void handleRetryPhotoErasureDeletion(id)}
              onResolve={(id) => void handleResolvePhotoErasureDeletion(id)}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="dispatch-hierarchy"
          >
            {canManageDispatchHierarchy ? (
              <ManagerDispatchHierarchyPanel
                organizationId={activeManagerOrganizationId}
                onOpenCrewAdministration={(request) => {
                  setManagerWorkspaceSection('overview');
                  setManagerWorkspaceTool('owner-setup');
                  setCrewAdministrationReturnTarget(undefined);
                  setCrewAdministrationInspectionSummary(undefined);
                  setCrewAdministrationInspectionAuditLabel(undefined);
                  setCrewAdministrationInspectionAuditId(undefined);
                  setCrewAdministrationInspectedDestinationBranchId(undefined);
                  setCrewAdministrationInspectedDestinationTerritoryId(undefined);
                  setCrewAdministrationSelection(request?.crewId);
                  setCrewAdministrationBranch(request?.branchId);
                  setCrewAdministrationTerritory(request?.territoryId);
                  setCrewAdministrationSelectionSignal((current) => current + 1);
                  const target = document.getElementById('crew-administration');
                  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  target?.focus({ preventScroll: true });
                }}
                refreshSignal={dispatchHierarchyRefreshSignal}
                onChanged={() => {
                  setDispatchHierarchyRefreshSignal((current) => current + 1);
                  setTeamActivityRefreshSignal((current) => current + 1);
                }}
              />
            ) : null}
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="dispatch-workload"
          >
            <ManagerDispatchWorkloadPanel
              hierarchyRefreshSignal={dispatchHierarchyRefreshSignal}
              jobs={jobs}
              onReassign={handleJobDispatchAssignment}
              onSelectJob={selectJobForReview}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="completion-reports"
          >
            <ManagerCompletionReportQueuePanel
              reports={managerReportQueueReports}
              isLoading={isLoadingReportQueue}
              onRefresh={(filters) => void refreshManagerReportQueue(filters)}
              onSelectJob={(jobId) => {
                setSelectedJobId(jobId);
                setRequestedJobWorkflow('report');
                changeMobileView('job', true);
              }}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="visit-questions"
          >
            <ProviderCustomerVisitQuestionsPanel />
          </ManagerToolSurface>
            </div>
          </details>
          ) : null}
        </div>

        <div className={`${workspaceSurfaces.fieldOperations && mobileView === 'job' ? 'block' : 'hidden'} min-w-0 scroll-mt-16 lg:mx-auto lg:w-full lg:max-w-4xl`} id="job-detail" ref={jobDetailRef}>
          {jobDetailUnavailable ? (
            <WorkspaceStatusNotice
              className="mb-3"
              detail="Job details remain hidden until API readiness recovers."
              role="alert"
              title="Persisted job access could not be verified."
              tone="warning"
            />
          ) : null}
          {jobAddOnsUnavailable ? (
            <WorkspaceStatusNotice
              className="mb-3"
              detail="Add-ons remain hidden until API readiness recovers."
              role="alert"
              title="Persisted add-on context could not be loaded."
              tone="warning"
            />
          ) : null}
          {photoEvidenceUnavailable ? (
            <WorkspaceStatusNotice
              className="mb-3"
              detail="Proof remains hidden until API readiness recovers."
              role="alert"
              title="Persisted photo evidence could not be loaded."
              tone="warning"
            />
          ) : null}
          <JobDetailPanel
            job={selectedJob}
            executionEnabled={fieldControls.stopProgress}
            fieldEvidenceEnabled={fieldControls.fieldEvidence}
            isLoading={isLoadingDetail}
            addOns={selectedJobAddOns}
            uploadTickets={selectedJobTickets}
            reportSnapshot={selectedCompletionReport?.jobId === selectedJobId ? selectedCompletionReport : null}
            onStart={handleStartJob}
            onComplete={handleCompleteJob}
            onChecklistItemChange={handleChecklistItemChange}
            onPhotoSelected={handlePhotoSelected}
            onAddOnStatusChange={handleAddOnStatusChange}
            onStartReportReview={handleStartReportReview}
            onRequestReportChanges={handleRequestReportChanges}
            onResubmitReport={handleResubmitReport}
            onDeliverReport={handleDeliverReport}
            onQueueReportDeliveryNotification={handleQueueReportDeliveryNotification}
            reportActionStatus={completionReportActionStatus}
            reportEnabled={fieldControls.report}
            requestedWorkflow={requestedJobWorkflow}
          />
        </div>
      </section>
      <MobileWorkspaceNavigation
        activeView={mobileView}
        hasSelectedJob={Boolean(selectedJobId)}
        navigationItems={activePersona.navigation}
        onChange={(view) => {
          if (view === 'manager') {
            setManagerWorkspaceSection(null);
            setManagerWorkspaceTool(null);
          }
          changeMobileView(view);
        }}
      />
    </main>
  );
}
