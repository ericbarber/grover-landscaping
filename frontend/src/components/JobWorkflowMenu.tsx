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
    { id: 'overview', label: 'Overview', context: 'At a glance' },
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
    <nav aria-label="Job workflow" className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5" role="tablist">
      {items.map((item, index) => (
        <button
          aria-controls={`job-workflow-panel-${item.id}`}
          aria-selected={activeSection === item.id}
          className={`min-h-14 rounded-xl border px-2 py-2 text-center transition-colors ${
            activeSection === item.id
              ? 'border-forest bg-forest text-white shadow-sm'
              : 'border-slate-200 bg-paper text-slate-700 hover:border-emerald-500 hover:bg-emerald-50'
          }`}
          key={item.id}
          id={`job-workflow-tab-${item.id}`}
          onClick={() => onChange(item.id)}
          onKeyDown={(event) => {
            const nextIndex = event.key === 'ArrowRight'
              ? (index + 1) % items.length
              : event.key === 'ArrowLeft'
                ? (index - 1 + items.length) % items.length
                : event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? items.length - 1
                    : null;
            if (nextIndex === null) return;
            event.preventDefault();
            const nextItem = items[nextIndex];
            onChange(nextItem.id);
            window.requestAnimationFrame(() => {
              document.getElementById(`job-workflow-tab-${nextItem.id}`)?.focus();
            });
          }}
          role="tab"
          tabIndex={activeSection === item.id ? 0 : -1}
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
