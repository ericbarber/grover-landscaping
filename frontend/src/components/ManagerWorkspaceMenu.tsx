import type { WorkspacePersonaId } from '../domain/workspacePersona';

export type ManagerWorkspaceSection =
  | 'overview'
  | 'schedule'
  | 'customers'
  | 'team'
  | 'reports'
  | 'recovery';

export type ManagerWorkspaceTool =
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
  | 'team-members'
  | 'team-invitations'
  | 'team-activity'
  | 'operations-activity'
  | 'notifications'
  | 'completion-reports'
  | 'marketing-leads'
  | 'conversion-dashboard'
  | 'photo-processing'
  | 'operational-exceptions'
  | 'customer-privacy'
  | 'photo-erasure';

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
  ],
  recovery: [
    { id: 'operational-exceptions', label: 'Operational exceptions', description: 'Delays, risks, and escalations' },
    { id: 'photo-processing', label: 'Photo processing', description: 'Failed image work and retries' },
    { id: 'customer-privacy', label: 'Customer privacy', description: 'Exports and photo erasure' },
    { id: 'photo-erasure', label: 'Erasure recovery', description: 'Failed deletions and resolution' },
  ],
};

const sectionAccess: Partial<Record<WorkspacePersonaId, ManagerWorkspaceSection[]>> = {
  'company-owner': ['overview', 'schedule', 'customers', 'team', 'reports', 'recovery'],
  'company-manager': ['overview', 'schedule', 'customers', 'team', 'reports', 'recovery'],
  'property-manager': ['customers'],
  dispatcher: ['schedule'],
  'billing-admin': ['customers', 'reports'],
  support: ['team', 'reports', 'recovery'],
};

const toolAccess: Partial<Record<WorkspacePersonaId, ManagerWorkspaceTool[]>> = {
  'company-owner': [
    'owner-setup', 'company-readiness', 'day-plan', 'dispatch-hierarchy',
    'dispatch-workload', 'property-profile', 'property-service', 'customer-accounts',
    'customer-portal', 'customer-portfolios', 'team-members', 'team-invitations',
    'team-activity', 'operations-activity', 'notifications', 'completion-reports',
    'photo-processing', 'operational-exceptions', 'customer-privacy', 'photo-erasure',
  ],
  'company-manager': [
    'company-readiness', 'day-plan', 'dispatch-workload', 'property-profile',
    'property-service', 'customer-accounts', 'customer-portal', 'customer-portfolios',
    'team-members', 'team-activity', 'operations-activity', 'notifications',
    'completion-reports', 'photo-processing', 'operational-exceptions',
  ],
  'property-manager': ['customer-portal', 'customer-portfolios'],
  dispatcher: ['day-plan', 'dispatch-workload'],
  'billing-admin': ['customer-accounts', 'customer-portal', 'completion-reports'],
  support: [
    'team-members', 'team-invitations', 'team-activity', 'operations-activity',
    'notifications', 'completion-reports', 'marketing-leads', 'conversion-dashboard',
    'photo-processing', 'operational-exceptions', 'customer-privacy', 'photo-erasure',
  ],
};

export function managerWorkspaceSectionsForPersona(
  personaId: WorkspacePersonaId,
): typeof managerWorkspaceSections {
  const allowed = new Set(sectionAccess[personaId] ?? []);
  return managerWorkspaceSections.filter((section) => allowed.has(section.id));
}

export function managerWorkspaceToolsForPersona(
  personaId: WorkspacePersonaId,
  section: ManagerWorkspaceSection,
): Array<{ id: ManagerWorkspaceTool; label: string; description: string }> {
  const allowed = new Set(toolAccess[personaId] ?? []);
  return managerWorkspaceTools[section].filter((tool) => allowed.has(tool.id));
}

export function ManagerWorkspaceMenu({
  activeSection,
  onChange,
  personaId,
}: {
  activeSection: ManagerWorkspaceSection | null;
  onChange: (section: ManagerWorkspaceSection) => void;
  personaId: WorkspacePersonaId;
}) {
  const sections = managerWorkspaceSectionsForPersona(personaId);

  return (
    <section className="grover-card p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
        Manager home
      </p>
      <h2 className="mt-1 text-xl font-black text-slate-950">
        Choose what you need to do
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
        {sections.map((section) => (
          <button
            aria-pressed={activeSection === section.id}
            className={`min-h-20 rounded-xl border p-3 text-left ${
              activeSection === section.id
                ? 'border-emerald-700 bg-emerald-800 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-800'
            }`}
            key={section.id}
            onClick={() => onChange(section.id)}
            type="button"
          >
            <span className="block text-sm font-black">{section.label}</span>
            <span className={`mt-1 block text-xs ${
              activeSection === section.id ? 'text-emerald-100' : 'text-slate-500'
            }`}>
              {section.description}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ManagerWorkspaceToolMenu({
  section,
  activeTool,
  onBack,
  onClear,
  onChange,
  personaId,
}: {
  section: ManagerWorkspaceSection;
  activeTool: ManagerWorkspaceTool | null;
  onBack: () => void;
  onClear: () => void;
  onChange: (tool: ManagerWorkspaceTool) => void;
  personaId: WorkspacePersonaId;
}) {
  const tools = managerWorkspaceToolsForPersona(personaId, section);
  const selectedTool = tools.find(
    (tool) => tool.id === activeTool,
  );

  if (selectedTool) {
    return (
      <section className="grover-card flex items-center gap-3 p-3">
        <button
          className="min-h-11 rounded-xl border border-slate-300 bg-paper px-3 text-sm font-bold text-slate-700"
          onClick={onClear}
          type="button"
        >
          ← Tools
        </button>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-emerald-700">
            {managerWorkspaceSectionLabel(section)}
          </p>
          <h2 className="truncate text-base font-black text-slate-950">{selectedTool.label}</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="grover-card p-4">
      <button
        className="min-h-11 rounded-xl border border-slate-300 bg-paper px-3 text-sm font-bold text-slate-700"
        onClick={onBack}
        type="button"
      >
        ← Manager home
      </button>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
        {managerWorkspaceSectionLabel(section)}
      </p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Choose a tool</h2>
      <div className="mt-4 space-y-2">
        {tools.map((tool) => (
          <button
            aria-pressed={activeTool === tool.id}
            className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border p-3 text-left ${
              activeTool === tool.id
                ? 'border-emerald-700 bg-emerald-800 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-800'
            }`}
            key={tool.id}
            onClick={() => onChange(tool.id)}
            type="button"
          >
            <span>
              <span className="block text-sm font-black">{tool.label}</span>
              <span className={`mt-1 block text-xs ${
                activeTool === tool.id ? 'text-emerald-100' : 'text-slate-500'
              }`}>
                {tool.description}
              </span>
            </span>
            <span aria-hidden="true" className="text-lg">›</span>
          </button>
        ))}
      </div>
    </section>
  );
}
