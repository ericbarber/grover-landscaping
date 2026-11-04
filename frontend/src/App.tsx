import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { isApiErrorCode } from './api/apiError';
import {
  completeJob,
  completeDispatchCustomerNotification,
  fetchCompletionReport,
  updateJobDispatchAssignment,
  startJob,
  updateChecklistItem,
  type CustomerPropertyRecord,
  type JobAddOn,
  type PhotoUploadTicket,
  type PropertyCompletionReportSummary,
} from './api/client';
import { useAuth } from './auth/AuthProvider';
import type {
  ChecklistOfflineMutation,
  JobLifecycleOfflineMutation,
  PhotoUploadOfflineMutation,
} from './domain/offlineMutationQueue';
import { requiredPhotoEvidence } from './domain/photoQuality';
import { workspaceGuidanceForRoles, workspaceRolesForAccess } from './domain/workspaceAccess';
import { useWorkspaceSelection } from './workspaces/core/useWorkspaceSelection';
import { useWorkspaceViewNavigation } from './workspaces/core/useWorkspaceViewNavigation';
import {
  DesktopWorkspaceNavigation,
  MobileWorkspaceHeader,
  MobileWorkspaceNavigation,
} from './components/MobileWorkspaceShell';
import {
  ManagerWorkspaceMenu,
  ManagerWorkspaceToolMenu,
} from './components/ManagerWorkspaceMenu';
import {
  managerWorkspaceSectionSignalsForPersona,
  managerWorkspaceSectionsForPersona,
  managerWorkspaceToolsForPersona,
  type ManagerWorkspaceTool,
} from './workspaces/features/management/managerWorkspace';
import { useManagerWorkspaceNavigation } from './workspaces/features/management/useManagerWorkspaceNavigation';
import {
  CustomerHistoryMenu,
} from './components/CustomerHistoryMenu';
import {
  WorkspaceHomePanel,
} from './components/WorkspaceHomePanel';
import {
  homeGreeting,
  homeProgressSummary,
  personaHomeHeadline,
  personaHomePromise,
  personaProgressLanguage,
} from './workspaces/features/home/workspaceHome';
import {
  customerHomeWorkSummary,
  customerWorkspaceModeForPersona,
  personaUsesAuthorizedCustomerRead,
  personaUsesManagerCustomerPreview,
} from './workspaces/features/customer/customerWorkspace';
import { useCustomerPortalCollection } from './workspaces/features/customer/useCustomerPortalCollection';
import { useCustomerPropertyReportHistory } from './workspaces/features/customer/useCustomerPropertyReportHistory';
import { useCustomerProjectBidHistory } from './workspaces/features/customer/useCustomerProjectBidHistory';
import { useCustomerHistoryNavigation } from './workspaces/features/customer/useCustomerHistoryNavigation';
import {
  fieldRecoveryState,
  mergePhotoEvidence,
  type FieldPhotoType,
} from './workspaces/features/field/fieldWorkspace';
import { useFieldJobSelection } from './workspaces/features/field/useFieldJobSelection';
import { useFieldPhotoEvidence } from './workspaces/features/field/useFieldPhotoEvidence';
import { useFieldCompletionReport } from './workspaces/features/field/useFieldCompletionReport';
import { useFieldJobs } from './workspaces/features/field/useFieldJobs';
import { useFieldOfflineRecovery } from './workspaces/features/field/useFieldOfflineRecovery';
import { useFieldJobNavigation } from './workspaces/features/field/useFieldJobNavigation';
import { useFieldRouteOverview } from './workspaces/features/field/useFieldRouteOverview';
import {
  reviewedFieldConflictMessage,
  runChecklistMutationCommand,
  runFieldAddOnMutationCommand,
  runFieldPhotoUploadCommand,
  runJobLifecycleMutationCommand,
} from './workspaces/features/field/fieldMutationCommands';
import { WorkspaceStatusBadge, WorkspaceStatusNotice } from './components/WorkspaceStatus';
import { AssignedJobsPanel } from './components/AssignedJobsPanel';
import { FieldOfflineRecoveryPanel } from './components/FieldOfflineRecoveryPanel';
import { JobDetailPanel } from './components/JobDetailPanel';
import { CustomerPortfolioSummaryPanel } from './components/CustomerPortfolioSummaryPanel';
import { PropertyManagerAuthorizedPortfolioPanel } from './components/PropertyManagerAuthorizedPortfolioPanel';
import { PropertyManagerInvitationInbox } from './components/PropertyManagerInvitationInbox';
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
  type CompletionReportOperationalFilters,
} from './domain/completionReportOperationalFilters';
import { useManagerCompletionReportQueue } from './workspaces/features/management/useManagerCompletionReportQueue';
import { useManagerCompletionReportActions } from './workspaces/features/management/useManagerCompletionReportActions';
import { useManagerCompletionReportNotifications } from './workspaces/features/management/useManagerCompletionReportNotifications';
import {
  useManagerNotificationHistory,
  type ManagerNotificationHistoryFilters,
} from './workspaces/features/management/useManagerNotificationHistory';
import {
  useManagerPhotoProcessingRecovery,
  type ManagerPhotoProcessingFilters,
} from './workspaces/features/management/useManagerPhotoProcessingRecovery';
import { useManagerPhotoErasureRecovery } from './workspaces/features/management/useManagerPhotoErasureRecovery';
import { useManagerCustomerPrivacy } from './workspaces/features/management/useManagerCustomerPrivacy';
import { useManagerOperationalActivity } from './workspaces/features/management/useManagerOperationalActivity';
import { useManagerCrewNavigation } from './workspaces/features/management/useManagerCrewNavigation';
import { useManagerRefreshSignals } from './workspaces/features/management/useManagerRefreshSignals';
import { useManagerPropertyWorkspace } from './workspaces/features/management/useManagerPropertyWorkspace';
import { useManagerOperationalExceptionNavigation } from './workspaces/features/management/useManagerOperationalExceptionNavigation';
import { buildManagerTodayQueue } from './domain/managerTodayQueue';
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
} from './components/ManagerNotificationHistoryPanel';
import { ManagerPhotoProcessingRecoveryPanel } from './components/ManagerPhotoProcessingRecoveryPanel';
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
  type CompanyProfile,
  type CrewProfile,
  type CustomerAccountProfile,
  type CustomerPortalWorkSummary,
  type CustomerPropertyProfile,
} from './domain/jobs';
import { notificationsToManagerActivity } from './domain/notificationManagerActivity';
import { operationsToManagerActivity } from './domain/operationalManagerActivity';
import type { PortfolioPropertyLink, PropertyPortfolio } from './domain/propertyPortfolios';
import { projectBidTotalCents, type ProjectBid } from './domain/stopProgress';
import { useManagerLocalActivity } from './workspaces/features/management/useManagerLocalActivity';

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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
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
  const historyNavigation = useCustomerHistoryNavigation();
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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
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
        activeView={historyNavigation.activeView}
        bidCount={projectBids.length}
        onChange={historyNavigation.changeView}
        propertyCount={visibleProperties.length}
      />

      <div className={`${historyNavigation.activeView === 'properties' ? 'block' : 'hidden'} mt-5 space-y-3 lg:block`}>
        <div className={`${historyNavigation.selectedPropertyId ? 'hidden' : 'grid'} gap-2 lg:hidden`}>
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
                onClick={() => historyNavigation.selectProperty(property.id)}
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
          const mobilePropertyReports = historyNavigation.expandedReportPropertyId === property.id
            ? propertyReports
            : propertyReports.slice(0, 2);

          return (
            <article
              key={property.id}
              className={`${historyNavigation.selectedPropertyId === property.id ? 'block' : 'hidden'} rounded-xl border border-slate-200 p-4 lg:block`}
            >
              <button
                className="mb-3 min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 lg:hidden"
                onClick={historyNavigation.showAllProperties}
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
                      onClick={() => historyNavigation.toggleOlderReports(property.id)}
                      type="button"
                    >
                      {historyNavigation.expandedReportPropertyId === property.id
                        ? 'Show recent reports'
                        : `Show ${propertyReports.length - 2} older reports`}
                    </button>
                  ) : null}
                  <div className="hidden space-y-2 lg:block">
                    {(historyNavigation.expandedReportPropertyId === property.id
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
        <div className={`${historyNavigation.activeView === 'bids' ? 'block' : 'hidden'} mt-5 space-y-2 lg:block`}>
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
      ) : historyNavigation.activeView === 'bids' ? (
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
  const {
    jobs,
    setJobs,
    selectedJobId,
    setSelectedJobId,
    readState: fieldJobsReadState,
    isLoadingJobs,
    jobsUnavailable,
  } = useFieldJobs();
  const availableWorkspaceViews = useMemo(
    () => activePersona.navigation.map(({ view }) => view),
    [activePersona.navigation],
  );
  const workspaceViewNavigation = useWorkspaceViewNavigation(
    activePersona.defaultView,
    availableWorkspaceViews,
  );
  const mobileView = workspaceViewNavigation.view;
  const openFieldJobView = useCallback((resetDestination: boolean) => {
    workspaceViewNavigation.openView('job', resetDestination);
  }, [workspaceViewNavigation.openView]);
  const fieldJobNavigation = useFieldJobNavigation({
    selectedJobId,
    selectJob: setSelectedJobId,
    openJobView: openFieldJobView,
  });
  const {
    selectedJob,
    setSelectedJob,
    jobDetailUnavailable,
    isLoadingDetail,
    selectedJobAddOns,
    setSelectedJobAddOns,
    jobAddOnsUnavailable,
  } = useFieldJobSelection(selectedJobId, jobs);
  const {
    uploadTickets,
    setUploadTickets,
    photoEvidenceUnavailable,
  } = useFieldPhotoEvidence(selectedJobId);
  const [statusMessage, setStatusMessage] = useState('Loading jobs from local API...');
  const operationalExceptionNavigation = useManagerOperationalExceptionNavigation();
  const managerProperties = useManagerPropertyWorkspace(
    'org_demo_landscaping',
    initialManagerCustomerProperties,
  );
  const {
    properties: customerPortalProperties,
    visits: customerPortalVisits,
    isLoading: isLoadingCustomerPortalVisits,
    readError: customerPortalVisitError,
    readState: portalHomeReadState,
    refresh: refreshCustomerPortalVisits,
  } = useCustomerPortalCollection({
    enabled: personaUsesAuthorizedCustomerRead(activePersona.id) && Boolean(auth.userId),
    subjectKey: `${activePersona.id}:${auth.userId ?? ''}`,
  });
  const fieldRouteOverview = useFieldRouteOverview({
    enabled: workspaceSurfaces.fieldOperations,
    scopeKey: `${activePersona.id}:${auth.userId ?? ''}`,
  });
  const managerRefresh = useManagerRefreshSignals();
  const crewNavigation = useManagerCrewNavigation();
  const {
    jobMutations: offlineJobMutations,
    checklistMutations: offlineChecklistMutations,
    photoMutations: offlinePhotoMutations,
    isReplayingJobs: isReplayingJobMutations,
    isReplayingChecklist: isReplayingChecklistMutations,
    isReplayingPhotos: isReplayingPhotoMutations,
    replayJobs: replayJobLifecycleMutations,
    replayChecklist: replayChecklistMutations,
    replayPhotos: replayPhotoMutations,
    queueJobLifecycle,
    queueChecklist,
    queuePhoto,
    discardJobConflict,
    discardChecklistConflict,
    discardPhotoConflict,
  } = useFieldOfflineRecovery({
    actorId: auth.userId,
    selectedJobId,
    setJobs,
    setSelectedJob,
    setUploadTickets,
  });
  const managerNavigation = useManagerWorkspaceNavigation({
    personaId: activePersona.id,
    rolloutUnit: managedPersonaUnit,
    capabilities: activeWorkspace.capabilities,
  });
  const {
    items: managerActivity,
    isPersisted: isManagerActivityPersisted,
    record: recordManagerActivity,
    reset: resetManagerActivityHistory,
  } = useManagerLocalActivity();
  useEffect(() => {
    if (fieldJobsReadState === 'ready') {
      setStatusMessage('Connected to the local API.');
    } else if (fieldJobsReadState === 'unavailable') {
      setStatusMessage('Persisted field work is unavailable. Seed jobs were not substituted.');
    } else if (fieldJobsReadState === 'fallback') {
      setStatusMessage('Using seed data because the local API is not reachable yet.');
      recordManagerActivity({
        title: 'Seed data fallback active',
        message: 'The dashboard is using seed jobs because the API is not reachable.',
        tone: 'warning',
        source: 'sync',
      });
    }
  }, [fieldJobsReadState, recordManagerActivity]);
  const jobDetailRef = useRef<HTMLDivElement>(null);
  const providerEntryOpened = useRef(false);
  const homeWorkSummary = customerHomeWorkSummary(
    activePersona.id,
    customerPortalVisits,
    jobs,
  );
  const desktopHomeProgress = homeProgressSummary({
    assignedJobCount: homeWorkSummary.assigned,
    completedJobCount: homeWorkSummary.completed,
    hasWorkspaceRole: workspaceRoles.length > 0,
    isLoadingWork: isLoadingJobs,
    personaId: activePersona.id,
    portalReadState: portalHomeReadState,
    routeOverview: fieldRouteOverview.overview,
  });
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
  const activeAuthorizedManagerTool = managerNavigation.tool;
  const canLoadCustomerPortalPreview = enabledManagerTools.has('customer-portal');
  const canLoadCompletionReportQueue = enabledManagerTools.has('completion-reports');
  const canLoadNotificationHistory = enabledManagerTools.has('notifications');
  const canLoadOperationalActivity = enabledManagerTools.has('operations-activity');
  const canLoadPhotoProcessingHistory = enabledManagerTools.has('photo-processing');
  const canUseCustomerPrivacy = enabledManagerTools.has('customer-privacy');
  const canUsePhotoErasureRecovery = enabledManagerTools.has('photo-erasure');
  const handleInitialNotificationHistoryUnavailable = useCallback(() => {
    recordManagerActivity({
      title: 'Notification history unavailable',
      message: 'Delivery notification history could not be loaded from the API.',
      tone: 'warning',
      source: 'sync',
    });
  }, [recordManagerActivity]);
  const {
    items: notificationHistory,
    isLoading: isLoadingNotificationHistory,
    isUnavailable: notificationHistoryUnavailable,
    applyExternalRefresh: applyNotificationHistoryRefresh,
    refresh: refreshManagerNotificationHistory,
    retry: retryManagerNotificationDelivery,
    resolve: resolveManagerNotificationDelivery,
  } = useManagerNotificationHistory({
    enabled: canLoadNotificationHistory,
    onInitialUnavailable: handleInitialNotificationHistoryUnavailable,
  });
  const handleInitialPhotoProcessingUnavailable = useCallback(() => {
    recordManagerActivity({
      title: 'Photo processing history unavailable',
      message: 'Photo processing recovery history could not be loaded from the API.',
      tone: 'warning',
      source: 'sync',
    });
  }, [recordManagerActivity]);
  const {
    items: photoProcessingHistory,
    isLoading: isLoadingPhotoProcessingHistory,
    refresh: refreshManagerPhotoProcessingHistory,
    retry: retryManagerPhotoProcessing,
    resolve: resolveManagerPhotoProcessing,
  } = useManagerPhotoProcessingRecovery({
    enabled: canLoadPhotoProcessingHistory,
    onInitialUnavailable: handleInitialPhotoProcessingUnavailable,
  });
  const {
    items: photoErasureDeletionHistory,
    isLoading: isLoadingPhotoErasureDeletionHistory,
    refresh: refreshManagerPhotoErasureDeletionHistory,
    retry: retryManagerPhotoErasureDeletion,
    resolve: resolveManagerPhotoErasureDeletion,
  } = useManagerPhotoErasureRecovery({
    enabled: canUsePhotoErasureRecovery,
  });
  const {
    privacyExport: customerPrivacyExport,
    erasure: customerPhotoErasureSummary,
    isLoading: isLoadingCustomerPrivacy,
    exportAccount: exportManagerCustomerPrivacy,
    erasePhotos: eraseManagerCustomerPhotos,
  } = useManagerCustomerPrivacy({
    enabled: canUseCustomerPrivacy,
  });
  const {
    items: operationalActivity,
    isUnavailable: operationalActivityUnavailable,
    canLoadOlder: canLoadOlderOperationalActivity,
    isLoadingOlder: isLoadingOlderOperationalActivity,
    refresh: refreshOperationalActivity,
    loadOlder: loadOlderOperationalActivity,
  } = useManagerOperationalActivity({
    enabled: canLoadOperationalActivity,
    refreshSignal: managerRefresh.signals.dayPlan,
  });
  const managerPreviewPropertyIds = useMemo(
    () => filterPropertiesForCustomerPortal(
      customerPortalPreviewProperties,
      customerPortalPreviewCustomer,
    ).map((property) => property.id),
    [],
  );
  const handlePartialCustomerReportHistory = useCallback(() => {
    recordManagerActivity({
      title: 'Customer report history unavailable',
      message: 'Delivered property report history could not be loaded for every customer portal property.',
      tone: 'warning',
      source: 'sync',
    });
  }, [recordManagerActivity]);
  const {
    reportsByProperty: propertyCompletionReports,
    isLoading: isLoadingPropertyCompletionReports,
    hasError: hasPropertyCompletionReportHistoryError,
  } = useCustomerPropertyReportHistory({
    enabled: personaUsesManagerCustomerPreview(
      activePersona.id,
      canLoadCustomerPortalPreview,
    ),
    propertyIds: managerPreviewPropertyIds,
    onPartialUnavailable: handlePartialCustomerReportHistory,
  });
  const handleCustomerBidHistoryUnavailable = useCallback(() => {
    recordManagerActivity({
      title: 'Customer bid history unavailable',
      message: 'Customer account bid history could not be loaded for the portal preview.',
      tone: 'warning',
      source: 'sync',
    });
  }, [recordManagerActivity]);
  const {
    bids: customerProjectBids,
    isLoading: isLoadingCustomerProjectBids,
    hasError: hasCustomerProjectBidHistoryError,
  } = useCustomerProjectBidHistory({
    enabled: personaUsesManagerCustomerPreview(
      activePersona.id,
      canLoadCustomerPortalPreview,
    ),
    accountId: customerPortalPreviewCustomer.id,
    onUnavailable: handleCustomerBidHistoryUnavailable,
  });
  const handlePartialManagerReportQueue = useCallback(() => {
    recordManagerActivity({
      title: 'Report queue partially loaded',
      message: 'Some completion report snapshots could not be loaded for the manager review queue.',
      tone: 'warning',
      source: 'sync',
    });
  }, [recordManagerActivity]);
  const {
    reports: managerReportQueueReports,
    snapshots: completionReportSnapshots,
    isLoading: isLoadingReportQueue,
    upsertReport: upsertManagerReport,
    refresh: refreshManagerReports,
  } = useManagerCompletionReportQueue({
    enabled: canLoadCompletionReportQueue,
    jobs,
    onPartialLoad: handlePartialManagerReportQueue,
  });
  const showManagerTodayQueue = activePersona.id === 'company-owner'
    || activePersona.id === 'company-manager';
  const managerTodayItems = useMemo(
    () => showManagerTodayQueue
      ? buildManagerTodayQueue(jobs, managerReportQueueReports)
      : [],
    [jobs, managerReportQueueReports, showManagerTodayQueue],
  );
  const managerTodayState = isLoadingJobs
    || (canLoadCompletionReportQueue && isLoadingReportQueue)
    ? 'loading' as const
    : jobsUnavailable
      ? 'unavailable' as const
      : 'ready' as const;
  const {
    selectedCompletionReport,
    setSelectedCompletionReport,
  } = useFieldCompletionReport(selectedJobId, {
    onLoaded: (report) => {
      upsertManagerReport(report);
      setUploadTickets((current) => mergePhotoEvidence(current, report.jobId, report.photoEvidence));
    },
    onFallback: (jobId) => {
      recordManagerActivity({
        title: 'Completion report fallback active',
        message: `${jobId} completion report is using browser-local evidence until the API is reachable.`,
        tone: 'warning',
        source: 'photo',
      });
    },
  });
  const {
    actionStatus: managerReportActionStatus,
    startReview: startManagerReportReview,
    requestChanges: requestManagerReportChanges,
    resubmit: resubmitManagerReport,
    deliver: deliverManagerReport,
  } = useManagerCompletionReportActions({
    refreshReport: refreshCompletionReport,
    refreshActivity: refreshOperationalActivity,
  });
  const {
    actionStatus: reportNotificationActionStatus,
    queueDelivery: queueManagerReportDeliveryNotification,
  } = useManagerCompletionReportNotifications();
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
    if (!providerEntryMode || providerEntryOpened.current || activePersona.id !== 'company-owner') return;
    providerEntryOpened.current = true;
    workspaceViewNavigation.openView('manager', true);
    managerNavigation.openTool('overview', 'owner-setup');
  }, [
    activePersona.id,
    managerNavigation.openTool,
    providerEntryMode,
    workspaceViewNavigation.openView,
  ]);

  function openPropertyWorkspace(
    propertyId: string,
    workspace: 'operational-profile' | 'service-setup',
  ) {
    managerNavigation.openTool(
      'customers',
      workspace === 'operational-profile' ? 'property-profile' : 'property-service',
    );
    const managerTools = document.getElementById('manager-tools') as HTMLDetailsElement | null;
    if (managerTools) managerTools.open = true;
    managerProperties.requestPropertyWorkspace(propertyId, workspace);
    window.setTimeout(() => {
      document.getElementById(`property-${workspace}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  function openFirstOwnerSetupStep(
    target: 'operational-profile' | 'service-setup' | 'customer-accounts' | 'day-plan' | 'completion-reports' | 'team-invitations',
  ) {
    managerNavigation.openTool(
      target === 'day-plan'
        ? 'schedule'
        : target === 'completion-reports'
          ? 'reports'
          : target === 'team-invitations'
            ? 'team'
            : 'customers',
      target === 'day-plan'
        ? 'day-plan'
        : target === 'completion-reports'
          ? 'completion-reports'
        : target === 'team-invitations'
          ? 'team-invitations'
          : target === 'customer-accounts'
            ? 'customer-accounts'
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

  async function discardReviewedJobConflict(mutation: JobLifecycleOfflineMutation) {
    const outcome = await discardJobConflict(mutation);
    setStatusMessage(reviewedFieldConflictMessage('job', outcome, mutation.action));
  }

  async function handleChecklistItemChange(itemId: string, completed: boolean) {
    if (!selectedJobId || !selectedJob) return;
    const result = await runChecklistMutationCommand({
      persist: () => updateChecklistItem(selectedJobId, itemId, completed),
      queue: selectedJob.organizationId && auth.userId
        ? () => queueChecklist(
          selectedJob.organizationId,
          selectedJobId,
          itemId,
          completed,
        )
        : undefined,
    });
    const checklist = selectedJob.checklist.map(
      (item) => item.id === itemId ? { ...item, completed } : item,
    );
    const completedChecklistItems = checklist.filter((item) => item.completed).length;
    setSelectedJob({ ...selectedJob, checklist, completedChecklistItems });
    setJobs((current) => current.map((job) => job.id === selectedJobId
      ? { ...job, completedChecklistItems }
      : job));
    setStatusMessage(result.message);
  }

  async function discardReviewedChecklistConflict(mutation: ChecklistOfflineMutation) {
    const outcome = await discardChecklistConflict(mutation);
    setStatusMessage(reviewedFieldConflictMessage('checklist', outcome));
  }

  async function discardReviewedPhotoConflict(mutation: PhotoUploadOfflineMutation) {
    const outcome = await discardPhotoConflict(mutation);
    setStatusMessage(reviewedFieldConflictMessage('photo', outcome));
  }

  async function handleStartJob() {
    if (!fieldControls.stopProgress || !selectedJobId) {
      return;
    }

    const organizationId = selectedJob?.organizationId
      ?? jobs.find((job) => job.id === selectedJobId)?.organizationId;
    const result = await runJobLifecycleMutationCommand({
      jobId: selectedJobId,
      action: 'start',
      persist: () => startJob(selectedJobId),
      queue: organizationId && auth.userId
        ? () => queueJobLifecycle(organizationId, selectedJobId, 'start')
        : undefined,
    });
    setStatusMessage(result.message);
    if (result.outcome !== 'persisted') {
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
    if (!fieldControls.fieldEvidence || !selectedJobId) {
      return;
    }

    const evidence = requiredPhotoEvidence(
      selectedJob?.beforePhotos ?? 0,
      selectedJob?.afterPhotos ?? 0,
      selectedJobTickets,
    );
    if (!evidence.ready) {
      setStatusMessage(
        `Cannot complete this job yet. Add ${evidence.missing.join(' and ')} ${evidence.missing.length === 1 ? 'photo' : 'photos'} first.`,
      );
      return;
    }

    const organizationId = selectedJob?.organizationId
      ?? jobs.find((job) => job.id === selectedJobId)?.organizationId;
    const result = await runJobLifecycleMutationCommand({
      jobId: selectedJobId,
      action: 'complete',
      persist: () => completeJob(selectedJobId),
      queue: organizationId && auth.userId
        ? () => queueJobLifecycle(organizationId, selectedJobId, 'complete')
        : undefined,
    });
    setStatusMessage(result.message);
    if (result.outcome === 'persisted') {
      recordManagerActivity({
        title: 'Job completion ready',
        message: `${selectedJobId} was completed and is ready for manager review.`,
        tone: 'success',
        source: 'job',
      });
    } else {
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
    if (result.outcome === 'persisted') {
      managerRefresh.markFirstOwnerProgressChanged();
    }
  }

  async function handleAddOnStatusChange(addOnId: string, status: JobAddOn['status']) {
    if (!fieldControls.stopProgress || !selectedJobId) return;

    const result = await runFieldAddOnMutationCommand({
      jobId: selectedJobId,
      addOnId,
      status,
    });
    if (result.addOn) {
      setSelectedJobAddOns((current) => current.map(
        (addOn) => addOn.id === result.addOn?.id ? result.addOn : addOn,
      ));
    }
    if (result.report) setSelectedCompletionReport(result.report);
    setStatusMessage(result.message);
  }

  async function refreshCompletionReport(jobId: string) {
    const report = await fetchCompletionReport(jobId);
    setSelectedCompletionReport(report);
    upsertManagerReport(report);
    setUploadTickets((current) => mergePhotoEvidence(current, jobId, report.photoEvidence));
    return report;
  }

  async function refreshManagerReportQueue(filters: CompletionReportOperationalFilters = {}) {
    const outcome = await refreshManagerReports(filters);
    if (outcome === 'empty') return;
    if (outcome === 'refreshed') {
      setStatusMessage('Completion report review queue refreshed.');
      return;
    }
    setStatusMessage('Could not refresh every completion report. Check the API connection and try again.');
    recordManagerActivity({
      title: 'Report queue refresh failed',
      message: 'The manager completion report queue could not refresh all job reports.',
      tone: 'warning',
      source: 'sync',
    });
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
    managerRefresh.markFirstOwnerProgressChanged();
  }

  async function handleCompleteDispatchCustomerNotification(
    jobId: string,
    channel: 'email' | 'sms' | 'phone',
  ) {
    try {
      await completeDispatchCustomerNotification(jobId, channel);
      const activityRefreshed = await refreshOperationalActivity();
      setStatusMessage(activityRefreshed
        ? `Customer notification follow-up recorded by ${channel}.`
        : `Customer notification follow-up recorded by ${channel}. Activity could not be refreshed.`);
    } catch {
      setStatusMessage('Customer notification follow-up could not be recorded.');
    }
  }

  async function refreshNotificationHistory(
    filters: ManagerNotificationHistoryFilters,
  ) {
    if (await refreshManagerNotificationHistory(filters)) {
      setStatusMessage('Notification delivery history refreshed.');
    } else {
      setStatusMessage('Could not refresh notification delivery history. Check the API connection and try again.');
      recordManagerActivity({
        title: 'Notification history refresh failed',
        message: 'Manager notification history could not refresh from the backend.',
        tone: 'warning',
        source: 'sync',
      });
    }
  }

  async function handleRetryNotificationDelivery(
    notificationId: string,
    filters: ManagerNotificationHistoryFilters,
  ) {
    const result = await retryManagerNotificationDelivery(notificationId, filters);
    if (result.ok) {
      setStatusMessage(`${result.item.id} queued for retry.`);
      recordManagerActivity({
        title: 'Notification retry queued',
        message: `${result.item.channel} delivery for ${result.item.entityId} was returned to the queue.`,
        tone: 'success',
        source: 'sync',
      });
    } else {
      setStatusMessage('Could not retry the notification. Confirm it is failed or needs attention.');
      recordManagerActivity({
        title: 'Notification retry failed',
        message: 'A notification delivery retry could not be queued.',
        tone: 'warning',
        source: 'sync',
      });
    }
  }

  async function handleResolveNotificationDelivery(
    notificationId: string,
    filters: ManagerNotificationHistoryFilters,
  ) {
    const result = await resolveManagerNotificationDelivery(notificationId, filters);
    if (result.ok) {
      setStatusMessage(`${result.item.id} marked resolved.`);
      recordManagerActivity({
        title: 'Notification resolved',
        message: `${result.item.channel} delivery for ${result.item.entityId} was marked resolved.`,
        tone: 'success',
        source: 'sync',
      });
    } else {
      setStatusMessage('Could not resolve the notification. Confirm it is failed or needs attention.');
      recordManagerActivity({
        title: 'Notification resolution failed',
        message: 'A notification delivery item could not be marked resolved.',
        tone: 'warning',
        source: 'sync',
      });
    }
  }

  async function refreshPhotoProcessingHistory(filters: ManagerPhotoProcessingFilters) {
    if (await refreshManagerPhotoProcessingHistory(filters)) {
      setStatusMessage('Photo processing recovery queue refreshed.');
    } else {
      setStatusMessage('Could not refresh photo processing history. Check the API connection and try again.');
      recordManagerActivity({
        title: 'Photo processing refresh failed',
        message: 'Manager photo processing recovery history could not refresh from the backend.',
        tone: 'warning',
        source: 'sync',
      });
    }
  }

  async function handleRetryPhotoProcessing(
    processingJobId: string,
    filters: ManagerPhotoProcessingFilters,
  ) {
    const result = await retryManagerPhotoProcessing(processingJobId, filters);
    if (result.ok) {
      setStatusMessage(`${result.item.id} queued for photo processing retry.`);
      recordManagerActivity({
        title: 'Photo processing retry queued',
        message: `${result.item.fileName} thumbnail work was returned to the queue.`,
        tone: 'success',
        source: 'photo',
      });
    } else {
      setStatusMessage('Could not retry photo processing. Confirm the job is failed or needs attention.');
      recordManagerActivity({
        title: 'Photo processing retry failed',
        message: 'A thumbnail processing retry could not be queued.',
        tone: 'warning',
        source: 'photo',
      });
    }
  }

  async function handleResolvePhotoProcessing(
    processingJobId: string,
    filters: ManagerPhotoProcessingFilters,
  ) {
    const result = await resolveManagerPhotoProcessing(processingJobId, filters);
    if (result.ok) {
      setStatusMessage(`${result.item.id} marked resolved.`);
      recordManagerActivity({
        title: 'Photo processing resolved',
        message: `${result.item.fileName} thumbnail work was marked resolved.`,
        tone: 'success',
        source: 'photo',
      });
    } else {
      setStatusMessage('Could not resolve photo processing. Confirm the job is failed or needs attention.');
      recordManagerActivity({
        title: 'Photo processing resolution failed',
        message: 'A thumbnail processing job could not be marked resolved.',
        tone: 'warning',
        source: 'photo',
      });
    }
  }

  async function refreshPhotoErasureDeletionHistory() {
    if (await refreshManagerPhotoErasureDeletionHistory()) {
      setStatusMessage('Photo erasure deletion recovery queue refreshed.');
    } else {
      setStatusMessage('Could not refresh photo erasure deletion history.');
    }
  }

  async function handleRetryPhotoErasureDeletion(id: string) {
    const result = await retryManagerPhotoErasureDeletion(id);
    if (result.ok) {
      setStatusMessage(`${result.item.id} queued for object deletion retry.`);
      recordManagerActivity({
        title: 'Photo erasure deletion retry queued',
        message: `${result.item.objectKey} was returned to the deletion queue.`,
        tone: 'success',
        source: 'photo',
      });
    } else {
      setStatusMessage('Could not retry the photo erasure object deletion.');
    }
  }

  async function handleResolvePhotoErasureDeletion(id: string) {
    const result = await resolveManagerPhotoErasureDeletion(id);
    if (result.ok) {
      setStatusMessage(`${result.item.id} marked resolved.`);
      recordManagerActivity({
        title: 'Photo erasure deletion resolved',
        message: `${result.item.objectKey} was manually resolved.`,
        tone: 'success',
        source: 'photo',
      });
    } else {
      setStatusMessage('Could not resolve the photo erasure object deletion.');
    }
  }

  async function handleCustomerPrivacyExport(accountId: string) {
    const result = await exportManagerCustomerPrivacy(accountId);
    if (result.ok) {
      setStatusMessage(`Exported privacy data for ${result.privacyExport.account.customerName}.`);
      recordManagerActivity({
        title: 'Customer privacy export created',
        message: `${result.privacyExport.account.customerName} export includes ${result.privacyExport.photoEvidence.length} photo evidence metadata item${result.privacyExport.photoEvidence.length === 1 ? '' : 's'}.`,
        tone: 'success',
        source: 'sync',
      });
    } else {
      setStatusMessage('Could not export customer privacy data. Confirm the account is in scope.');
      recordManagerActivity({
        title: 'Customer privacy export failed',
        message: 'A customer account privacy export could not be loaded from the backend.',
        tone: 'warning',
        source: 'sync',
      });
    }
  }

  async function handleCustomerPhotoErasure(accountId: string, reason: string) {
    const result = await eraseManagerCustomerPhotos(accountId, reason);
    if (result.ok) {
      setStatusMessage(result.privacyExport
        ? `Erased retained photo evidence for ${accountId}.`
        : `Erased retained photo evidence for ${accountId}. The latest export could not be refreshed.`);
      recordManagerActivity({
        title: 'Customer photo evidence erased',
        message: `${result.erasure.erasedPhotoCount} photo evidence item${result.erasure.erasedPhotoCount === 1 ? '' : 's'} erased for ${accountId}.`,
        tone: 'success',
        source: 'photo',
      });
      if (!result.privacyExport) {
        recordManagerActivity({
          title: 'Customer privacy export refresh failed',
          message: `Photo evidence was erased for ${accountId}, but the updated privacy export could not be loaded.`,
          tone: 'warning',
          source: 'sync',
        });
      }
    } else {
      setStatusMessage('Could not erase customer photo evidence. Confirm the reason and account scope.');
      recordManagerActivity({
        title: 'Customer photo erasure failed',
        message: 'A customer photo evidence erasure request could not be completed.',
        tone: 'warning',
        source: 'photo',
      });
    }
  }

  async function handleStartReportReview(reportId: string) {
    const result = await startManagerReportReview(reportId);
    if (!result.ok) {
      setStatusMessage('Could not start manager review. Confirm the report is submitted and persisted.');
      return;
    }
    setStatusMessage(`${result.action.reportId} is in manager review.`);
  }

  async function handleRequestReportChanges(reportId: string, reason: string) {
    const result = await requestManagerReportChanges(reportId, reason);
    if (!result.ok) {
      setStatusMessage('Could not request changes. Confirm the report is currently in review.');
      return;
    }
    setStatusMessage(`${result.action.reportId} has changes requested.`);
  }

  async function handleResubmitReport(reportId: string) {
    const result = await resubmitManagerReport(reportId);
    if (!result.ok) {
      setStatusMessage('Could not resubmit. Confirm the report is change-requested and delivery-ready.');
      return;
    }
    setStatusMessage(`${result.action.reportId} resubmitted for manager review.`);
  }

  async function handleDeliverReport(reportId: string) {
    const result = await deliverManagerReport(reportId);
    if (!result.ok) {
      setStatusMessage('Could not deliver. Confirm the report passed review and delivery readiness checks.');
      return;
    }
    setStatusMessage(`${result.action.reportId} delivered to the customer portal.`);
    managerRefresh.markFirstOwnerProgressChanged();
  }

  async function handleQueueReportDeliveryNotification(
    reportId: string,
    channel: 'email' | 'sms',
    recipient: string,
  ) {
    const result = await queueManagerReportDeliveryNotification(reportId, channel, recipient);
    if (!result.ok) {
      setStatusMessage(
        isApiErrorCode(result.error, 'completion_report_notification_preference_blocked')
          ? 'Delivery blocked by this customer’s account preferences. Enable the selected channel and use the configured account recipient.'
          : 'Could not queue the customer notification. Confirm the report is delivered and the recipient is valid.',
      );
      return;
    }

    if (result.history) {
      applyNotificationHistoryRefresh(result.history);
    } else {
      applyNotificationHistoryRefresh(null);
      recordManagerActivity({
        title: 'Notification history refresh failed',
        message: 'The customer notification was queued, but the history panel did not refresh.',
        tone: 'warning',
        source: 'sync',
      });
    }
    setStatusMessage(
      `${result.notification.reportId} notification queued for ${result.notification.recipient}.`,
    );
    recordManagerActivity({
      title: 'Completion report notification queued',
      message: `${result.notification.channel} delivery queued for ${result.notification.reportId}.`,
      tone: 'success',
      source: 'sync',
    });
  }

  async function handlePhotoSelected(file: File, photoType: FieldPhotoType) {
    if (!selectedJobId) {
      return;
    }

    const result = await runFieldPhotoUploadCommand({
      jobId: selectedJobId,
      photoType,
      file,
      existingPhotos: selectedJobTickets,
      queue: selectedJob?.organizationId && auth.userId
        ? () => queuePhoto(selectedJob.organizationId, selectedJobId, photoType, file)
        : undefined,
    });
    setStatusMessage(result.message);
    if (!result.ticket) return;
    const ticket = result.ticket;
    if (result.activity) recordManagerActivity(result.activity);

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
        activePersonaId={activePersona.id}
        activeView={mobileView}
        availablePersonas={availablePersonas}
        hasEnvironmentBanner={auth.authMode !== 'cognito'}
        hasSelectedJob={Boolean(selectedJobId)}
        navigationItems={activePersona.navigation}
        onChange={(view) => {
          if (view === 'manager') {
            managerNavigation.openRoot();
          }
          workspaceViewNavigation.openView(view, true);
        }}
        onPersonaChange={(personaId) => {
          const persona = selectWorkspacePersona(personaId);
          if (!persona) return;
          if (persona.defaultView === 'manager') {
            managerNavigation.openRoot();
          }
          workspaceViewNavigation.openView(persona.defaultView, true);
        }}
        onSignOut={hostedSignOut}
        personaLabel={activePersona.label}
        signedInName={auth.displayName || 'Signed-in user'}
      />
      <section className={`relative min-h-80 overflow-hidden bg-emerald-950 px-8 py-8 text-white ${mobileView === 'home' ? 'hidden lg:block' : 'hidden'}`} id="workspace-home-hero">
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          src="/brand/yardfolio-landscape-home-hero.webp"
        />
        <span className="absolute inset-0 bg-linear-to-r from-slate-950/95 via-slate-950/75 to-emerald-950/20" />
        <span className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        <div className="relative mx-auto flex min-h-64 max-w-6xl flex-col">
          <div className="flex items-center justify-end gap-5">
            <p className="rounded-xl border border-white/15 bg-slate-950/30 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-xs">
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
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-xs">
                  {activePersona.label}
                </span>
                <span className="text-emerald-300">Plan</span>
                <span aria-hidden="true" className="text-emerald-400">•</span>
                <span className="text-emerald-300">Care</span>
                <span aria-hidden="true" className="text-emerald-400">•</span>
                <span className="text-emerald-300">Proof</span>
              </div>
            </div>
            <aside className="rounded-2xl border border-white/15 bg-slate-950/45 p-5 shadow-yardfolio-md backdrop-blur-md">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                {personaProgressLanguage(activePersona).eyebrow}
              </p>
              <p className="mt-3 text-4xl font-black">
                {desktopHomeProgress.state === 'loading'
                  ? '…'
                  : desktopHomeProgress.state === 'ready'
                    ? `${desktopHomeProgress.completed}/${desktopHomeProgress.total}`
                    : '—'}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-200">
                {workspaceRoles.length === 0
                  ? 'Protected work stays hidden'
                  : desktopHomeProgress.state === 'loading'
                    ? `Checking ${personaProgressLanguage(activePersona).total}`
                    : desktopHomeProgress.state === 'unavailable'
                      ? `${personaProgressLanguage(activePersona).eyebrow} unavailable`
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
        onBackToJobs={() => workspaceViewNavigation.openView('jobs')}
        onPersonaChange={(personaId) => {
          const persona = selectWorkspacePersona(personaId);
          if (!persona) return;
          if (persona.defaultView === 'manager') {
            managerNavigation.openRoot();
          }
          workspaceViewNavigation.openView(persona.defaultView, true);
        }}
        onSignOut={hostedSignOut}
        pendingChangeCount={
          fieldRecovery.pendingChangeCount
        }
        routeOverview={fieldRouteOverview.overview}
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
              managerTodayQueue={showManagerTodayQueue ? {
                items: managerTodayItems,
                state: managerTodayState,
                onOpenAll: () => workspaceViewNavigation.openView('jobs', true),
                onOpenItem: (item) => {
                  fieldJobNavigation.openJob(item.jobId, item.workflow, true);
                },
              } : undefined}
              onOpen={(view) => {
                if (view === 'manager') {
                  managerNavigation.openRoot();
                }
                workspaceViewNavigation.openView(view, true);
              }}
              pendingChangeCount={
                fieldRecovery.pendingChangeCount
              }
              persona={activePersona}
              portalReadState={portalHomeReadState}
              routeOverview={fieldRouteOverview.overview}
              signedInName={auth.displayName || 'Signed-in user'}
            />
          </div>
          <div className={`${workspaceSurfaces.fieldOperations && mobileView === 'route' ? 'block' : 'hidden'} scroll-mt-16`} id="today-route">
            <DayPlanPanel
              actorId={auth.userId}
              jobDetailsEnabled={fieldControls.jobDetails}
              onSelectJob={fieldJobNavigation.openJob}
              onOverviewChange={fieldRouteOverview.updateOverview}
              refreshSignal={managerRefresh.signals.dayPlan}
              routeChangesEnabled={fieldControls.routeChanges}
              stopProgressEnabled={fieldControls.stopProgress}
            />
          </div>
          <AssignedJobsPanel
            className={workspaceSurfaces.fieldOperations && mobileView === 'jobs' ? 'block' : 'hidden'}
            jobs={jobs}
            jobsUnavailable={jobsUnavailable}
            onSelectJob={fieldJobNavigation.openJob}
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
              <div className="space-y-6">
                <PropertyManagerInvitationInbox
                  onAccepted={() => void refreshCustomerPortalVisits()}
                />
                <PropertyManagerAuthorizedPortfolioPanel
                  rolloutUnit={managedPersonaUnit}
                  properties={customerPortalProperties}
                  visits={customerPortalVisits}
                  readState={portalHomeReadState}
                  onRetry={() => void refreshCustomerPortalVisits()}
                  onReturnHome={() => workspaceViewNavigation.openView('home', true)}
                />
              </div>
            ) : customerWorkspaceMode === 'yard' ? (
              <YardOwnerPortalPanel
                customerDisplayName={auth.displayName}
                rolloutUnit={managedPersonaUnit}
                properties={customerPortalProperties}
                visits={customerPortalVisits}
                isLoadingVisits={isLoadingCustomerPortalVisits}
                visitReadError={customerPortalVisitError}
                onRetryVisits={() => void refreshCustomerPortalVisits()}
                onReturnHome={() => workspaceViewNavigation.openView('home', true)}
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
          <details className={`${mobileView === 'manager' ? 'block' : 'hidden'} mt-0 scroll-mt-16 rounded-2xl border border-slate-200 bg-paper p-3 shadow-yardfolio-sm open:bg-transparent open:p-0 open:shadow-none`} id="manager-tools" open={mobileView === 'manager' ? true : undefined}>
            <summary className="cursor-pointer list-none rounded-xl bg-forest px-4 py-3 font-semibold text-white [&::-webkit-details-marker]:hidden">
              {managerWorkspaceHeading}
              <span className="ml-2 text-xs font-normal text-slate-300">{managerWorkspaceDescription}</span>
            </summary>
            <div className="mt-5 space-y-6">
          {managerNavigation.section === null ? (
            <ManagerWorkspaceMenu
              activeSection={managerNavigation.section}
              capabilities={activeWorkspace.capabilities}
              onChange={(section) => {
                managerNavigation.openSection(section);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              personaId={activePersona.id}
              rolloutUnit={managedPersonaUnit}
              signals={managerWorkspaceSignals}
            />
          ) : null}
          {managerNavigation.section ? (
            <ManagerWorkspaceToolMenu
              activeTool={managerNavigation.tool}
              capabilities={activeWorkspace.capabilities}
              onBack={managerNavigation.openRoot}
              onClear={() => managerNavigation.selectTool(null)}
              onChange={(tool) => {
                managerNavigation.selectTool(tool);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              personaId={activePersona.id}
              rolloutUnit={managedPersonaUnit}
              section={managerNavigation.section}
            />
          ) : null}
          <ManagerToolSurface activeTool={activeAuthorizedManagerTool} tool="owner-setup">
          <FirstOwnerOnboardingPanel
            providerEntryMode={providerEntryMode}
            crewBranchRequest={crewNavigation.crewRequest.branchId}
            crewSelectionRequest={crewNavigation.crewRequest.crewId}
            crewSelectionSignal={crewNavigation.crewSelectionSignal}
            crewTerritoryRequest={crewNavigation.crewRequest.territoryId}
            crewInspectionReturnLabel={
              crewNavigation.inspection
                ? 'Return to owner activity'
                : undefined
            }
            crewInspectionSummary={crewNavigation.inspection?.summary}
            crewInspectionAuditLabel={crewNavigation.inspection?.auditLabel}
            crewInspectionAuditId={crewNavigation.inspection?.auditId}
            crewInspectedDestinationBranchId={
              crewNavigation.inspection?.destinationBranchId
            }
            crewInspectedDestinationTerritoryId={
              crewNavigation.inspection?.destinationTerritoryId
            }
            hierarchyRefreshSignal={managerRefresh.signals.dispatchHierarchy}
            onOpenSetupStep={openFirstOwnerSetupStep}
            refreshSignal={managerRefresh.signals.firstOwnerProgress}
            onCrewCreated={managerRefresh.markCrewCreated}
            onCrewChanged={managerRefresh.markCrewChanged}
            onReturnToDispatchHierarchy={() => {
              managerNavigation.openTool('schedule', 'dispatch-hierarchy');
              window.setTimeout(() => {
                const target = document.getElementById('dispatch-hierarchy-administration');
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target?.focus({ preventScroll: true });
              }, 0);
            }}
            onReturnFromCrewInspection={() => {
              managerNavigation.openTool('team', 'team-activity');
              const inspectedAuditId = crewNavigation.returnFromInspection();
              window.setTimeout(() => {
                const target = inspectedAuditId
                  ? document.getElementById(`team-activity-${inspectedAuditId}`)
                  : document.getElementById('team-activity-review');
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target?.focus({ preventScroll: true });
              }, 0);
            }}
            onFindLatestCrewHierarchyMove={(crew) => {
              managerNavigation.openTool('team', 'team-activity');
              crewNavigation.requestLatestMove(crew);
              window.setTimeout(() => {
                const target = document.getElementById('team-activity-review');
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target?.focus({ preventScroll: true });
              }, 0);
            }}
            onOrganizationReady={(organizationName, organizationId) => {
              managerProperties.activateOrganization(organizationId);
              managerRefresh.markFirstOwnerProgressChanged();
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
              crewRefreshSignal={managerRefresh.signals.crew}
              jobs={jobs}
              onDayPlanPublished={(dayPlan) => {
                managerRefresh.markDayPlanPublished();
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
              properties={managerProperties.onboardingOptions}
              requestedPropertyId={managerProperties.requestedOperationalProfilePropertyId}
              onSaved={(profile) => {
                managerRefresh.markPropertyOnboardingSaved();
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
              properties={managerProperties.customerProperties}
              onboardingRefreshSignal={managerRefresh.signals.propertyOnboarding}
              requestedPropertyId={managerProperties.requestedServiceSetupPropertyId}
              onSetupChanged={managerRefresh.markPropertySetupChanged}
              onPropertyUpdated={(property) => managerProperties.registerProperties([property])}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            id="first-owner-customer-accounts"
            tool="customer-accounts"
          >
            <ManagerCustomerAccountOnboardingPanel
              organizationId={managerProperties.organizationId}
              onOpenPropertyWorkspace={openPropertyWorkspace}
              refreshSignal={managerRefresh.signals.customerAccount}
              onPropertiesLoaded={managerProperties.registerProperties}
              onPropertyCreated={(property) => {
                managerProperties.registerProperties([property]);
                managerRefresh.markFirstOwnerProgressChanged();
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
              onTeamChanged={managerRefresh.markTeamChanged}
              organizationId={managerProperties.organizationId}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="team-overview"
          >
            <TeamOrganizationOverviewPanel
              organizationId={managerProperties.organizationId}
              refreshSignal={
                managerRefresh.signals.teamActivity
                + managerRefresh.signals.firstOwnerProgress
                + managerRefresh.signals.crew
                + managerRefresh.signals.dispatchHierarchy
              }
              onOpenMembers={() => managerNavigation.selectTool('team-members')}
              onOpenInvitations={() => managerNavigation.selectTool('team-invitations')}
              onOpenActivity={() => managerNavigation.selectTool('team-activity')}
              onOpenHierarchy={() => {
                managerNavigation.openTool('schedule', 'dispatch-hierarchy');
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
                managerNavigation.openTool('overview', 'owner-setup');
                crewNavigation.openCrewList();
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
              onTeamChanged={managerRefresh.markTeamChanged}
              organizationId={managerProperties.organizationId}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6 scroll-mt-20"
            tool="team-activity"
          >
            <ManagerTeamActivityPanel
              onOpenCrew={(activity) => {
                managerNavigation.openTool('overview', 'owner-setup');
                crewNavigation.inspectCrewMove(activity);
                const target = document.getElementById('crew-administration');
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target?.focus({ preventScroll: true });
              }}
              organizationId={managerProperties.organizationId}
              requestedCrewId={crewNavigation.teamActivityRequest.crewId}
              requestedCrewBranchId={crewNavigation.teamActivityRequest.branchId}
              requestedCrewSignal={crewNavigation.teamActivityRequestSignal}
              requestedCrewTerritoryId={crewNavigation.teamActivityRequest.territoryId}
              returnedAuditId={crewNavigation.returnedAuditId}
              returnedAuditSignal={crewNavigation.returnedAuditSignal}
              refreshSignal={managerRefresh.signals.teamActivity}
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
                operationalExceptionNavigation.openException(exceptionId);
                managerNavigation.openTool('recovery', 'operational-exceptions');
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
              organizationId={managerProperties.organizationId}
              onActivityChanged={() => void refreshOperationalActivity()}
              requestedExceptionId={operationalExceptionNavigation.requestedExceptionId}
              requestedExceptionSignal={operationalExceptionNavigation.requestedExceptionSignal}
              onOpenAffectedResource={(resourceType, resourceId) => {
                if (resourceType === 'job') {
                  fieldJobNavigation.openJob(resourceId, 'overview', true);
                  return;
                }
                if (resourceType === 'property') {
                  openPropertyWorkspace(resourceId, 'operational-profile');
                  return;
                }
                managerNavigation.openTool('schedule', 'day-plan');
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
                organizationId={managerProperties.organizationId}
                onOpenCrewAdministration={(request) => {
                  managerNavigation.openTool('overview', 'owner-setup');
                  crewNavigation.openCrewAdministration(request);
                  const target = document.getElementById('crew-administration');
                  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  target?.focus({ preventScroll: true });
                }}
                refreshSignal={managerRefresh.signals.dispatchHierarchy}
                onChanged={managerRefresh.markDispatchHierarchyChanged}
              />
            ) : null}
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            tool="dispatch-workload"
          >
            <ManagerDispatchWorkloadPanel
              hierarchyRefreshSignal={managerRefresh.signals.dispatchHierarchy}
              jobs={jobs}
              onReassign={handleJobDispatchAssignment}
              onSelectJob={fieldJobNavigation.openJob}
            />
          </ManagerToolSurface>
          <ManagerToolSurface
            activeTool={activeAuthorizedManagerTool}
            className="mt-6"
            id="first-owner-completion-reports"
            tool="completion-reports"
          >
            <ManagerCompletionReportQueuePanel
              reports={managerReportQueueReports}
              isLoading={isLoadingReportQueue}
              onRefresh={(filters) => void refreshManagerReportQueue(filters)}
              onSelectJob={(jobId) => {
                fieldJobNavigation.openJob(jobId, 'report', true);
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
            reportActionStatus={managerReportActionStatus ?? reportNotificationActionStatus}
            reportEnabled={fieldControls.report}
            requestedWorkflow={fieldJobNavigation.requestedWorkflow}
            requestedWorkflowSignal={fieldJobNavigation.requestedWorkflowSignal}
          />
        </div>
      </section>
      <MobileWorkspaceNavigation
        activeView={mobileView}
        hasSelectedJob={Boolean(selectedJobId)}
        navigationItems={activePersona.navigation}
        onChange={(view) => {
          if (view === 'manager') {
            managerNavigation.openRoot();
          }
          workspaceViewNavigation.openView(view);
        }}
      />
    </main>
  );
}
