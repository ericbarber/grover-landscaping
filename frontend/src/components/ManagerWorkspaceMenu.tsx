import type { WorkspaceCapability, WorkspacePersonaId } from '../workspaces/core/types';
import {
  managerWorkspaceSectionLabel,
  managerWorkspaceSectionsForPersona,
  managerWorkspaceToolsForPersona,
  type ManagerWorkspaceSection,
  type ManagerWorkspaceSignal,
  type ManagerWorkspaceTool,
} from '../workspaces/features/management/managerWorkspace';
import { WorkspaceIcon, type WorkspaceIconName } from './WorkspaceIcon';
import { WorkspaceStatusBadge } from './WorkspaceStatus';

const managerSectionIcons: Record<ManagerWorkspaceSection, WorkspaceIconName> = {
  overview: 'home',
  schedule: 'route',
  customers: 'customer',
  team: 'jobs',
  reports: 'job',
  recovery: 'attention',
};

export function ManagerWorkspaceMenu({
  activeSection,
  capabilities,
  onChange,
  personaId,
  rolloutUnit,
  signals,
}: {
  activeSection: ManagerWorkspaceSection | null;
  capabilities?: ReadonlySet<WorkspaceCapability>;
  onChange: (section: ManagerWorkspaceSection) => void;
  personaId: WorkspacePersonaId;
  rolloutUnit?: string | null;
  signals?: Partial<Record<ManagerWorkspaceSection, ManagerWorkspaceSignal>>;
}) {
  const sections = managerWorkspaceSectionsForPersona(personaId, rolloutUnit, capabilities);

  return (
    <section className="yardfolio-card p-4">
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
            <WorkspaceIcon className="mb-2 size-5" name={managerSectionIcons[section.id]} />
            <span className="block text-sm font-black">{section.label}</span>
            <span className={`mt-1 block text-xs ${
              activeSection === section.id ? 'text-emerald-100' : 'text-slate-500'
            }`}>
              {section.description}
            </span>
            {signals?.[section.id] ? (
              <WorkspaceStatusBadge
                className={`mt-2 ${activeSection === section.id ? 'border-white/15 bg-white/10 text-white' : ''}`}
                tone={signals[section.id]?.tone}
              >
                {signals[section.id]?.label}
              </WorkspaceStatusBadge>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}

export function ManagerWorkspaceToolMenu({
  section,
  activeTool,
  capabilities,
  onBack,
  onClear,
  onChange,
  personaId,
  rolloutUnit,
}: {
  section: ManagerWorkspaceSection;
  activeTool: ManagerWorkspaceTool | null;
  capabilities?: ReadonlySet<WorkspaceCapability>;
  onBack: () => void;
  onClear: () => void;
  onChange: (tool: ManagerWorkspaceTool) => void;
  personaId: WorkspacePersonaId;
  rolloutUnit?: string | null;
}) {
  const tools = managerWorkspaceToolsForPersona(
    personaId,
    section,
    rolloutUnit,
    capabilities,
  );
  const selectedTool = tools.find((tool) => tool.id === activeTool);

  if (selectedTool) {
    return (
      <section className="yardfolio-card flex items-center gap-3 p-3">
        <button
          className="min-h-11 rounded-xl border border-slate-300 bg-paper px-3 text-sm font-bold text-slate-700"
          onClick={onClear}
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <WorkspaceIcon className="size-4" name="back" />Tools
          </span>
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
    <section className="yardfolio-card p-4">
      <button
        className="min-h-11 rounded-xl border border-slate-300 bg-paper px-3 text-sm font-bold text-slate-700"
        onClick={onBack}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          <WorkspaceIcon className="size-4" name="back" />Manager home
        </span>
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
            <WorkspaceIcon className="size-5" name="forward" />
          </button>
        ))}
      </div>
    </section>
  );
}
