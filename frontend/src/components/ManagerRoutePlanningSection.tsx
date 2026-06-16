import { seedDayPlan } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { ManagerLocalRoutePlanner } from './ManagerLocalRoutePlanner';

type ManagerRoutePlanningSectionProps = {
  jobs: YardCareJob[];
};

export function ManagerRoutePlanningSection({ jobs }: ManagerRoutePlanningSectionProps) {
  return (
    <section className="mt-6 space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Manager route planning</h2>
        <p className="text-sm text-slate-600">Add eligible scheduled jobs to a local draft route before backend assignment is wired.</p>
      </div>
      <ManagerLocalRoutePlanner jobs={jobs} initialStops={seedDayPlan.stops} />
    </section>
  );
}
