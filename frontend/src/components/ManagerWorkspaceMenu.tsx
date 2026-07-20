export type ManagerWorkspaceSection =
  | 'overview'
  | 'schedule'
  | 'customers'
  | 'team'
  | 'reports'
  | 'recovery';

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

export function ManagerWorkspaceMenu({
  activeSection,
  onChange,
}: {
  activeSection: ManagerWorkspaceSection | null;
  onChange: (section: ManagerWorkspaceSection) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
        Manager home
      </p>
      <h2 className="mt-1 text-xl font-black text-slate-950">
        Choose what you need to do
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {managerWorkspaceSections.map((section) => (
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
