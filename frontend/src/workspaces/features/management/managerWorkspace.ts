import { workspaceCapabilitiesForUnit } from '../../core/resolveWorkspace';
import type {
  ManagerWorkspaceSectionId,
  ManagerWorkspaceToolId,
  WorkspaceCapability,
  WorkspacePersonaId,
  WorkspaceStatusTone,
} from '../../core/types';
import { workspacePersonaManifest } from '../../personas/registry';

export type ManagerWorkspaceSection = ManagerWorkspaceSectionId;
export type ManagerWorkspaceTool = ManagerWorkspaceToolId;

export interface ManagerWorkspaceSignal {
  label: string;
  tone: WorkspaceStatusTone;
}

export interface ManagerWorkspaceSignalInput {
  isLoadingJobs: boolean;
  jobsUnavailable: boolean;
  openJobCount: number;
  isLoadingReports: boolean;
  reportCount: number;
  isLoadingNotifications: boolean;
  notificationsUnavailable: boolean;
  failedNotificationCount: number;
  operationalActivityUnavailable: boolean;
  isLoadingRecovery: boolean;
  recoveryItemCount: number;
}

export const managerWorkspaceSections: Array<{
  id: ManagerWorkspaceSection;
  label: string;
  description: string;
}> = [
  { id: 'overview', label: 'Overview', description: 'Setup and company readiness' },
  { id: 'schedule', label: 'Schedule', description: 'Routes, dispatch, and workload' },
  { id: 'customers', label: 'Customers', description: 'Accounts, properties, and portfolios' },
  { id: 'team', label: 'Team', description: 'Members, invitations, and access' },
  { id: 'reports', label: 'Reports', description: 'Quality, activity, and communication' },
  { id: 'recovery', label: 'Recovery', description: 'Photos, privacy, and failed work' },
];

export function managerWorkspaceSectionLabel(section: ManagerWorkspaceSection): string {
  return managerWorkspaceSections.find((item) => item.id === section)?.label ?? 'Manager';
}

export const managerWorkspaceTools: Record<
  ManagerWorkspaceSection,
  Array<{ id: ManagerWorkspaceTool; label: string; description: string }>
> = {
  overview: [
    { id: 'owner-setup', label: 'Company setup', description: 'Organization and crew readiness' },
    { id: 'company-readiness', label: 'Company summary', description: 'Capacity and onboarding status' },
  ],
  schedule: [
    { id: 'day-plan', label: 'Day plans', description: 'Build and publish crew routes' },
    { id: 'dispatch-hierarchy', label: 'Dispatch structure', description: 'Branches, territories, and crews' },
    { id: 'dispatch-workload', label: 'Workload', description: 'Assignments and schedule risk' },
  ],
  customers: [
    { id: 'property-profile', label: 'Operational profile', description: 'Property access and service details' },
    { id: 'property-service', label: 'Property setup', description: 'Portfolios and crew assignment' },
    { id: 'customer-accounts', label: 'Customer accounts', description: 'Contacts, billing, and onboarding' },
    { id: 'customer-portal', label: 'Customer view', description: 'Reports, work, and bid history' },
    { id: 'customer-portfolios', label: 'Portfolios', description: 'Grouped property coverage' },
  ],
  team: [
    { id: 'team-overview', label: 'Team overview', description: 'Staffing, access, and administration' },
    { id: 'team-members', label: 'Members', description: 'Roles, status, and names' },
    { id: 'team-invitations', label: 'Invitations', description: 'Invite and onboard teammates' },
    { id: 'team-activity', label: 'Team activity', description: 'Audited access and crew changes' },
  ],
  reports: [
    { id: 'conversion-dashboard', label: 'Conversion dashboard', description: 'Campaign funnel and audience signals' },
    { id: 'marketing-leads', label: 'Marketing leads', description: 'Platform inquiries and follow-up' },
    { id: 'operations-activity', label: 'Operations activity', description: 'Route, job, photo, and sync events' },
    { id: 'notifications', label: 'Notifications', description: 'Delivery status and retries' },
    { id: 'completion-reports', label: 'Completion reports', description: 'Quality review and delivery' },
    { id: 'visit-questions', label: 'Visit questions', description: 'Customer questions and exact responses' },
  ],
  recovery: [
    { id: 'operational-exceptions', label: 'Operational exceptions', description: 'Delays, risks, and escalations' },
    { id: 'photo-processing', label: 'Photo processing', description: 'Failed image work and retries' },
    { id: 'customer-privacy', label: 'Customer privacy', description: 'Exports and photo erasure' },
    { id: 'photo-erasure', label: 'Erasure recovery', description: 'Failed deletions and resolution' },
  ],
};

export function managerWorkspaceSectionsForPersona(
  personaId: WorkspacePersonaId,
  rolloutUnit?: string | null,
  resolvedCapabilities?: ReadonlySet<WorkspaceCapability>,
): typeof managerWorkspaceSections {
  return managerWorkspaceSections.filter((section) => (
    managerWorkspaceToolsForPersona(
      personaId,
      section.id,
      rolloutUnit,
      resolvedCapabilities,
    ).length > 0
  ));
}

export function managerWorkspaceToolsForPersona(
  personaId: WorkspacePersonaId,
  section: ManagerWorkspaceSection,
  rolloutUnit?: string | null,
  resolvedCapabilities?: ReadonlySet<WorkspaceCapability>,
): Array<{ id: ManagerWorkspaceTool; label: string; description: string }> {
  const manifest = workspacePersonaManifest(personaId);
  const capabilities = resolvedCapabilities
    ?? workspaceCapabilitiesForUnit(personaId, rolloutUnit);
  return managerWorkspaceTools[section].filter((tool) => {
    const requirement = manifest.managerTools?.[tool.id];
    if (!requirement) return false;
    return capabilities === null || capabilities.has(requirement);
  });
}

export function managerWorkspaceActiveToolForPersona(
  personaId: WorkspacePersonaId,
  rolloutUnit: string | null | undefined,
  requestedTool: ManagerWorkspaceTool | null,
  resolvedCapabilities?: ReadonlySet<WorkspaceCapability>,
): ManagerWorkspaceTool | null {
  if (!requestedTool) return null;
  return managerWorkspaceSectionsForPersona(
    personaId,
    rolloutUnit,
    resolvedCapabilities,
  ).some((section) => (
    managerWorkspaceToolsForPersona(
      personaId,
      section.id,
      rolloutUnit,
      resolvedCapabilities,
    ).some(({ id }) => id === requestedTool)
  ))
    ? requestedTool
    : null;
}

function toolCountSignal(
  section: ManagerWorkspaceSection,
  toolCount: number,
): ManagerWorkspaceSignal {
  const noun = section === 'overview' ? 'setup step' : `${section} tool`;
  return {
    label: `${toolCount} ${noun}${toolCount === 1 ? '' : 's'}`,
    tone: 'neutral',
  };
}

export function managerWorkspaceSectionSignalsForPersona(
  personaId: WorkspacePersonaId,
  rolloutUnit: string | null | undefined,
  input: ManagerWorkspaceSignalInput,
  resolvedCapabilities?: ReadonlySet<WorkspaceCapability>,
): Partial<Record<ManagerWorkspaceSection, ManagerWorkspaceSignal>> {
  return managerWorkspaceSectionsForPersona(
    personaId,
    rolloutUnit,
    resolvedCapabilities,
  ).reduce<Partial<Record<ManagerWorkspaceSection, ManagerWorkspaceSignal>>>(
    (signals, section) => {
      const tools = managerWorkspaceToolsForPersona(
        personaId,
        section.id,
        rolloutUnit,
        resolvedCapabilities,
      );
      const toolIds = new Set(tools.map(({ id }) => id));
      let signal = toolCountSignal(section.id, tools.length);

      if (section.id === 'schedule') {
        signal = input.jobsUnavailable
          ? { label: 'Schedule unavailable', tone: 'warning' }
          : input.isLoadingJobs
            ? { label: 'Loading schedule', tone: 'info' }
            : input.openJobCount > 0
              ? {
                  label: `${input.openJobCount} stop${input.openJobCount === 1 ? '' : 's'} open`,
                  tone: 'info',
                }
              : { label: 'Route clear', tone: 'success' };
      }

      if (section.id === 'reports') {
        if (toolIds.has('notifications') && input.notificationsUnavailable) {
          signal = { label: 'Delivery status unavailable', tone: 'warning' };
        } else if (toolIds.has('operations-activity') && input.operationalActivityUnavailable) {
          signal = { label: 'Activity unavailable', tone: 'warning' };
        } else if (toolIds.has('notifications') && input.failedNotificationCount > 0) {
          signal = {
            label: `${input.failedNotificationCount} delivery issue${input.failedNotificationCount === 1 ? '' : 's'}`,
            tone: 'warning',
          };
        } else if (
          (toolIds.has('completion-reports') && input.isLoadingReports)
          || (toolIds.has('notifications') && input.isLoadingNotifications)
        ) {
          signal = { label: 'Loading status', tone: 'info' };
        } else if (toolIds.has('completion-reports') && input.reportCount > 0) {
          signal = {
            label: `${input.reportCount} report${input.reportCount === 1 ? '' : 's'} ready`,
            tone: 'success',
          };
        }
      }

      if (section.id === 'recovery') {
        if (toolIds.has('operational-exceptions') && input.operationalActivityUnavailable) {
          signal = { label: 'Recovery status unavailable', tone: 'warning' };
        } else if (input.recoveryItemCount > 0) {
          signal = {
            label: `${input.recoveryItemCount} item${input.recoveryItemCount === 1 ? '' : 's'} need attention`,
            tone: 'warning',
          };
        } else if (input.isLoadingRecovery) {
          signal = { label: 'Checking recovery', tone: 'info' };
        }
      }

      signals[section.id] = signal;
      return signals;
    },
    {},
  );
}
