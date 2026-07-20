export type JobWorkflowSection = 'overview' | 'checklist' | 'photos' | 'addons' | 'report';

export function jobWorkflowItems({
  checklistComplete,
  checklistTotal,
  photoCount,
  addOnCount,
  reportReady,
}: {
  checklistComplete: number;
  checklistTotal: number;
  photoCount: number;
  addOnCount: number;
  reportReady: boolean;
}): Array<{ id: JobWorkflowSection; label: string; context: string }> {
  return [
    { id: 'overview', label: 'Overview', context: 'Primary actions' },
    {
      id: 'checklist',
      label: 'Checklist',
      context: `${checklistComplete}/${checklistTotal}`,
    },
    { id: 'photos', label: 'Photos', context: `${photoCount}` },
    { id: 'addons', label: 'Add-ons', context: `${addOnCount}` },
    { id: 'report', label: 'Report', context: reportReady ? 'Ready' : 'Draft' },
  ];
}

export function JobWorkflowMenu({
  activeSection,
  addOnCount,
  checklistComplete,
  checklistTotal,
  onChange,
  photoCount,
  reportReady,
}: {
  activeSection: JobWorkflowSection;
  addOnCount: number;
  checklistComplete: number;
  checklistTotal: number;
  onChange: (section: JobWorkflowSection) => void;
  photoCount: number;
  reportReady: boolean;
}) {
  const items = jobWorkflowItems({
    checklistComplete,
    checklistTotal,
    photoCount,
    addOnCount,
    reportReady,
  });

  return (
    <nav aria-label="Job workflow" className="mt-4 grid grid-cols-3 gap-2 lg:hidden">
      {items.map((item) => (
        <button
          aria-current={activeSection === item.id ? 'page' : undefined}
          className={`min-h-14 rounded-xl border px-2 py-2 text-center ${
            activeSection === item.id
              ? 'border-emerald-700 bg-emerald-800 text-white'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
          key={item.id}
          onClick={() => onChange(item.id)}
          type="button"
        >
          <span className="block text-xs font-black">{item.label}</span>
          <span className={`mt-1 block text-[0.65rem] ${
            activeSection === item.id ? 'text-emerald-100' : 'text-slate-500'
          }`}>
            {item.context}
          </span>
        </button>
      ))}
    </nav>
  );
}
