import { getCompletionProgress, seedJobs, type YardCareJob } from './domain/jobs';

function StatusBadge({ status }: { status: YardCareJob['status'] }) {
  const label = status.replace('_', ' ');

  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
      {label}
    </span>
  );
}

function JobCard({ job }: { job: YardCareJob }) {
  const progress = getCompletionProgress(job);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{job.scheduledDate}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">{job.customerName}</h3>
          <p className="mt-1 text-sm text-slate-600">{job.propertyAddress}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{job.beforePhotos}</p>
          <p className="text-xs text-slate-500">Before</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{job.afterPhotos}</p>
          <p className="text-xs text-slate-500">After</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{progress}%</p>
          <p className="text-xs text-slate-500">Ready</p>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">
          Open Job
        </button>
        <button className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Add Photo
        </button>
      </div>
    </article>
  );
}

export function App() {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Grover Landscaping</p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-5xl">Crew completion dashboard</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Track assigned yard-care jobs, capture before and after photos, and prepare completion reports for review.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
              <p className="font-semibold text-white">Today</p>
              <p>{seedJobs.length} assigned jobs</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Assigned jobs</h2>
            <p className="text-sm text-slate-600">Local seed data until the API integration is wired in.</p>
          </div>
          <button className="hidden rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 md:inline-flex">
            Sync Jobs
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {seedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>
    </main>
  );
}
