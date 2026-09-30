import type { WorkspaceRolloutProjection } from '../../api/client';

export type WorkspacePersonaId =
  | 'yard-owner'
  | 'property-manager'
  | 'crew-lead'
  | 'crew-member'
  | 'company-owner'
  | 'company-manager'
  | 'dispatcher'
  | 'billing-admin'
  | 'support'
  | 'general';

export type WorkspaceRoleId =
  | 'PropertyOwner'
  | 'PropertyManager'
  | 'CrewLead'
  | 'CrewMember'
  | 'OrganizationOwner'
  | 'Manager'
  | 'Dispatcher'
  | 'BillingAdmin'
  | 'SupportAdmin';

export type WorkspaceView = 'home' | 'route' | 'jobs' | 'job' | 'manager' | 'customer';

export type WorkspaceNavigationIcon =
  | 'home'
  | 'route'
  | 'jobs'
  | 'job'
  | 'manage'
  | 'customer';

export type WorkspaceStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type WorkspaceCapability =
  | 'access_resolution'
  | 'care_visibility'
  | 'visit_tracking'
  | 'delivered_proof'
  | 'questions_and_decisions'
  | 'portfolio_readiness'
  | 'property_coverage_and_proof'
  | 'approvals_and_questions'
  | 'portfolio_administration'
  | 'day_plan_visibility'
  | 'stop_execution'
  | 'field_proof'
  | 'changes_and_recovery'
  | 'assigned_work'
  | 'job_execution'
  | 'field_evidence'
  | 'personal_recovery'
  | 'company_readiness'
  | 'daily_operations'
  | 'customers_and_team'
  | 'reports_and_recovery'
  | 'operating_readiness'
  | 'schedule_and_field_coordination'
  | 'reports_and_operational_recovery'
  | 'dispatch_readiness'
  | 'dispatch_planning'
  | 'dispatch_oversight'
  | 'dispatch_recovery'
  | 'billing_readiness'
  | 'account_review'
  | 'completion_readiness'
  | 'support_triage'
  | 'access_and_delivery_support'
  | 'evidence_and_exception_recovery'
  | 'privacy_and_erasure_recovery';

export type ManagerWorkspaceSectionId =
  | 'overview'
  | 'schedule'
  | 'customers'
  | 'team'
  | 'reports'
  | 'recovery';

export type ManagerWorkspaceToolId =
  | 'owner-setup'
  | 'company-readiness'
  | 'day-plan'
  | 'dispatch-hierarchy'
  | 'dispatch-workload'
  | 'property-profile'
  | 'property-service'
  | 'customer-accounts'
  | 'customer-portal'
  | 'customer-portfolios'
  | 'team-overview'
  | 'team-members'
  | 'team-invitations'
  | 'team-activity'
  | 'operations-activity'
  | 'notifications'
  | 'completion-reports'
  | 'visit-questions'
  | 'marketing-leads'
  | 'conversion-dashboard'
  | 'photo-processing'
  | 'operational-exceptions'
  | 'customer-privacy'
  | 'photo-erasure';

export interface WorkspaceNavigationItem {
  view: WorkspaceView;
  label: string;
  icon: WorkspaceNavigationIcon;
}

export interface WorkspaceProgressLanguage {
  eyebrow: string;
  completed: string;
  total: string;
  itemSingular: string;
  itemPlural: string;
}

export interface WorkspaceHomeDefinition {
  headline: string;
  promise: string;
  progress: WorkspaceProgressLanguage;
}

export interface WorkspaceSurfaces {
  fieldOperations: boolean;
  customerCare: boolean;
  management: boolean;
}

export interface WorkspaceFieldControlAvailability {
  jobDetails: boolean;
  stopProgress: boolean;
  routeChanges: boolean;
  fieldEvidence: boolean;
  report: boolean;
}

export interface WorkspacePersonaManifest {
  id: WorkspacePersonaId;
  status: 'authoritative' | 'proposed' | 'system';
  eligibleRoles: readonly WorkspaceRoleId[];
  priority: number;
  label: string;
  description: string;
  defaultView: WorkspaceView;
  navigation: readonly WorkspaceNavigationItem[];
  surfaces: WorkspaceSurfaces;
  home: WorkspaceHomeDefinition;
  rollout: ReadonlyArray<{
    unit: string;
    capability: WorkspaceCapability;
  }>;
  viewRequirements?: Partial<Record<WorkspaceView, WorkspaceCapability>>;
  managerTools?: Partial<Record<ManagerWorkspaceToolId, WorkspaceCapability>>;
}

export interface WorkspacePersona {
  id: WorkspacePersonaId;
  label: string;
  description: string;
  defaultView: WorkspaceView;
  navigation: WorkspaceNavigationItem[];
  home: WorkspaceHomeDefinition;
}

export interface ResolvedWorkspace {
  manifest: WorkspacePersonaManifest;
  persona: WorkspacePersona;
  capabilities: ReadonlySet<WorkspaceCapability>;
  rolloutUnit: string | null | undefined;
  rolloutScope: WorkspaceRolloutProjection['personas'][number]['scope'] | null;
  surfaces: WorkspaceSurfaces;
  fieldControls: WorkspaceFieldControlAvailability;
}
