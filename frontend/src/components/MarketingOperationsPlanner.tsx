import { useState } from 'react';

type Assignment = 'unassigned' | 'north' | 'west';

const candidateMinutes = 90;
const crewPlans = {
  north: { label: 'North crew', baseMinutes: 340, capacityMinutes: 420, baseStops: 4 },
  west: { label: 'West crew', baseMinutes: 225, capacityMinutes: 420, baseStops: 3 },
} as const;

export function MarketingOperationsPlanner() {
  const [assignment, setAssignment] = useState<Assignment>('unassigned');
  const northMinutes = crewPlans.north.baseMinutes + (assignment === 'north' ? candidateMinutes : 0);
  const westMinutes = crewPlans.west.baseMinutes + (assignment === 'west' ? candidateMinutes : 0);
  const unassignedCount = assignment === 'unassigned' ? 7 : 6;
  const riskCount = assignment === 'north' ? 4 : 3;

  const summary = assignment === 'unassigned'
    ? { tone: 'amber', title: '1 stop needs assignment', detail: 'Choose a crew or use the suggested balance.' }
    : assignment === 'north'
      ? { tone: 'rose', title: 'North crew is 10 minutes over capacity', detail: 'Move the stop before publishing the day.' }
      : { tone: 'emerald', title: 'Balanced plan · all 8 stops assigned', detail: 'West crew keeps 105 minutes of planned capacity.' };

  return (
    <section
      aria-labelledby="marketing-operations-planner-title"
      className="absolute bottom-4 left-3 right-3 rounded-[1.35rem] border border-white/60 bg-paper/95 p-4 text-ink shadow-grover-lg backdrop-blur sm:bottom-7 sm:left-auto sm:right-7 sm:w-[min(40rem,calc(100%-3.5rem))] sm:p-5 lg:bottom-8 lg:right-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.15em] text-emerald-700">Landscaping owner workspace</p>
          <h2 className="mt-1 text-xl font-black leading-tight sm:text-2xl" id="marketing-operations-planner-title">Today’s operation</h2>
          <p className="mt-1 max-w-md text-xs leading-4 text-slate-600">Balance route progress, available capacity, and the work that still needs an owner.</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-wide text-emerald-900">Live · 8:42 AM</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Today's operations summary">
        <OperationMetric detail="One unavailable" label="Crews active" value="8 / 9" />
        <OperationMetric detail="39 of 84 stops" label="Route progress" value="46%" />
        <OperationMetric detail="Need owners" label="Unassigned" tone="amber" value={String(unassignedCount)} />
        <OperationMetric detail="Review today" label="At risk" tone="rose" value={String(riskCount)} />
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">Crew schedule</p>
        <span className="text-xs font-bold text-slate-500">Phoenix branch · Day view</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <CrewWorkloadCard assignment={assignment} crew="north" minutes={northMinutes} />
        <CrewWorkloadCard assignment={assignment} crew="west" minutes={westMinutes} />
      </div>

      <fieldset className="mt-4 rounded-xl border border-slate-200 bg-white/75 p-3">
        <legend className="px-1 text-xs font-black uppercase tracking-[0.11em] text-slate-500">Dispatch focus · Copper Ridge HOA · 90 min</legend>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          {([
            ['unassigned', 'Leave open'],
            ['north', 'North crew'],
            ['west', 'West crew'],
          ] as const).map(([value, label]) => (
            <label
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-2 text-center text-xs font-black transition ${
                assignment === value
                  ? 'border-emerald-800 bg-emerald-800 text-white'
                  : 'border-slate-200 bg-paper text-slate-700 hover:border-emerald-700'
              }`}
              key={value}
            >
              <input
                checked={assignment === value}
                className="sr-only"
                name="marketing-operations-assignment"
                onChange={() => setAssignment(value)}
                type="radio"
                value={value}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div
        aria-live="polite"
        className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${
          summary.tone === 'rose'
            ? 'border-rose-200 bg-rose-50 text-rose-950'
            : summary.tone === 'emerald'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
              : 'border-amber-200 bg-amber-50 text-amber-950'
        }`}
      >
        <div>
          <p className="text-xs font-black">{summary.title}</p>
          <p className="mt-0.5 text-xs leading-4 opacity-80">{summary.detail}</p>
        </div>
        {assignment !== 'west' ? (
          <button className="min-h-10 rounded-lg bg-emerald-800 px-3 text-xs font-black text-white hover:bg-emerald-700" onClick={() => setAssignment('west')} type="button">
            Use suggested balance
          </button>
        ) : (
          <button className="min-h-10 rounded-lg px-3 text-xs font-black text-emerald-900 underline underline-offset-4" onClick={() => setAssignment('unassigned')} type="button">
            Reset preview
          </button>
        )}
      </div>
      <p className="mt-2 text-[0.68rem] font-semibold leading-4 text-slate-500">Illustrative planning only. Live counts are sample data; no route or schedule is saved.</p>
    </section>
  );
}

function OperationMetric({
  detail,
  label,
  tone = 'emerald',
  value,
}: {
  detail: string;
  label: string;
  tone?: 'amber' | 'emerald' | 'rose';
  value: string;
}) {
  const border = tone === 'rose' ? 'border-l-rose-500' : tone === 'amber' ? 'border-l-amber-600' : 'border-l-emerald-800';
  return (
    <div className={`rounded-lg border border-slate-200 border-l-4 bg-white px-3 py-2 ${border}`}>
      <dt className="text-[0.62rem] font-black uppercase tracking-[0.11em] text-slate-500">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-2">
        <strong className="whitespace-nowrap text-lg font-black text-slate-950">{value}</strong>
        <span className="text-[0.62rem] font-semibold text-slate-500">{detail}</span>
      </dd>
    </div>
  );
}

function CrewWorkloadCard({
  assignment,
  crew,
  minutes,
}: {
  assignment: Assignment;
  crew: keyof typeof crewPlans;
  minutes: number;
}) {
  const plan = crewPlans[crew];
  const overCapacity = minutes > plan.capacityMinutes;
  const remainingMinutes = plan.capacityMinutes - minutes;
  const stopCount = plan.baseStops + (assignment === crew ? 1 : 0);
  const workloadLabel = overCapacity
    ? `${plan.label} workload: ${minutes} of ${plan.capacityMinutes} minutes, ${Math.abs(remainingMinutes)} minutes over capacity`
    : `${plan.label} workload: ${minutes} of ${plan.capacityMinutes} minutes, ${remainingMinutes} minutes available`;

  return (
    <article className={`rounded-xl border p-3 ${overCapacity ? 'border-rose-200 bg-rose-50' : 'border-emerald-100 bg-emerald-50/75'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black">{plan.label}</p>
        <span className={`text-[0.68rem] font-black uppercase tracking-wide ${overCapacity ? 'text-rose-700' : 'text-emerald-700'}`}>
          {overCapacity ? 'Over capacity' : `${remainingMinutes} min open`}
        </span>
      </div>
      <div aria-label={workloadLabel} className="mt-2 h-1.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemax={plan.capacityMinutes} aria-valuemin={0} aria-valuenow={Math.min(minutes, plan.capacityMinutes)}>
        <span className={`block h-full rounded-full transition-[width] ${overCapacity ? 'bg-rose-600' : 'bg-emerald-700'}`} style={{ width: `${Math.min((minutes / plan.capacityMinutes) * 100, 100)}%` }} />
      </div>
      <p className="mt-2 text-xs font-bold text-slate-600">{stopCount} stops · {minutes} planned minutes</p>
    </article>
  );
}
