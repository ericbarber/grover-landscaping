import { WorkspaceIcon } from './WorkspaceIcon';

export interface ServiceLifecycleStep {
  id: string;
  label: string;
}

export function ServiceLifecycleProgress({
  steps,
  currentIndex,
  ariaLabel = 'Service progress',
}: {
  steps: readonly ServiceLifecycleStep[];
  currentIndex: number;
  ariaLabel?: string;
}) {
  if (steps.length === 0) return null;
  const boundedCurrentIndex = Math.max(0, Math.min(currentIndex, steps.length - 1));
  return (
    <ol
      aria-label={ariaLabel}
      className="mt-5 grid gap-2"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, index) => {
        const isDone = index < boundedCurrentIndex;
        const isCurrent = index === boundedCurrentIndex;
        return (
          <li
            aria-current={isCurrent ? 'step' : undefined}
            className={`border-t-2 pt-2 text-center text-[0.68rem] font-black ${isDone || isCurrent ? 'border-emerald-700 text-emerald-900' : 'border-slate-200 text-slate-500'}`}
            key={step.id}
          >
            <span className={`mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full ${isDone ? 'bg-emerald-700 text-white' : isCurrent ? 'bg-forest text-white' : 'bg-slate-100 text-slate-500'}`}>
              {isDone ? <WorkspaceIcon className="h-4 w-4" name="check" /> : index + 1}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}
