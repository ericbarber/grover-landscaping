import { seedDayPlan } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { ManagerDraftRouteSummaryCard } from './ManagerDraftRouteSummaryCard';
import { ManagerLocalRoutePlanner } from './ManagerLocalRoutePlanner';

type ManagerRoutePlanningDashboardProps = {
  jobs: YardCareJob[];
};

export function ManagerRoutePlanningDashboard({ jobs }: ManagerRoutePlanningDashboardProps) {
  return (
    <section className="mt-6 space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Manager route planning</h2>
        <p className="text-sm text-slate-600">Add eligible scheduled jobs to a local draft route before backend assignment is wired.</p>
      </div>
      <ManagerDraftRouteSummaryCard jobs={jobs} stops={seedDayPlan.stops} />
      <ManagerLocalRoutePlanner jobs={jobs} initialStops={seedDayPlan.stops} />
    </section>
  );
}
