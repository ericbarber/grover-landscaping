import { useEffect, useMemo, useState } from 'react';
import {
  completeJob,
  completePhotoUpload,
  createPhotoUploadTicket,
  fetchJobDetail,
  fetchJobs,
  startJob,
  type JobDetail,
  type PhotoUploadTicket,
} from './api/client';
import { getCompletionProgress, seedJobs, type YardCareJob } from './domain/jobs';

function StatusBadge({ status }: { status: YardCareJob['status'] }) {
  const label = status.replace('_', ' ');

  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
      {label}
    </span>
  );
}

function JobCard({
  job,
  isSelected,
  onSelect,
}: {
  job: YardCareJob;
  isSelected: boolean;
  onSelect: (jobId: string) => void;
}) {
  const progress = getCompletionProgress(job);

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        isSelected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'
      }`}
    >
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

      <button
        className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
        onClick={() => onSelect(job.id)}
      >
        {isSelected ? 'Selected Job' : 'Open Job'}
      </button>
    </article>
  );
}

function JobDetailPanel({
  job,
  isLoading,
  uploadTickets,
  onStart,
  onComplete,
  onPhotoSelected,
}: {
  job: JobDetail | null;
  isLoading: boolean;
  uploadTickets: PhotoUploadTicket[];
  onStart: () => Promise<void>;
  onComplete: () => Promise<void>;
  onPhotoSelected: (file: File, photoType: 'before' | 'after' | 'issue' | 'extra') => Promise<void>;
}) {
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'issue' | 'extra'>('before');

  if (isLoading) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Loading job details...</p>
      </aside>
    );
  }

  if (!job) {
    return (
      <aside className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-slate-600">
        Select a job to view checklist, workflow actions, and local photo upload placeholders.
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Job detail</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{job.customerName}</h2>
          <p className="mt-1 text-sm text-slate-600">{job.propertyAddress}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Checklist</h3>
        <div className="mt-3 space-y-2">
          {job.checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <span
                className={`h-3 w-3 rounded-full ${item.completed ? 'bg-emerald-500' : 'bg-slate-300'}`}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          className="rounded-xl border border-emerald-700 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          onClick={() => void onStart()}
        >
          Start Job
        </button>
        <button
          className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
          onClick={() => void onComplete()}
        >
          Complete Job
        </button>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Local photo placeholder</h3>
        <p className="mt-2 text-sm text-slate-600">
          This calls the backend upload-ticket endpoint now. Later, the same flow will return an S3 presigned URL.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            value={photoType}
            onChange={(event) => setPhotoType(event.target.value as 'before' | 'after' | 'issue' | 'extra')}
          >
            <option value="before">Before photo</option>
            <option value="after">After photo</option>
            <option value="issue">Issue photo</option>
            <option value="extra">Extra photo</option>
          </select>
          <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-400 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Choose Photo
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void onPhotoSelected(file, photoType);
                  event.currentTarget.value = '';
                }
              }}
            />
          </label>
        </div>

        {uploadTickets.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadTickets.map((ticket) => (
              <div key={ticket.photoId} className="rounded-xl bg-white p-3 text-xs text-slate-600 shadow-sm">
                <p className="font-semibold text-slate-800">{ticket.photoId}</p>
                <p>{ticket.uploadMode}</p>
                <p className="break-all">{ticket.objectKey}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export function App() {
  const [jobs, setJobs] = useState<YardCareJob[]>(seedJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(seedJobs[0]?.id ?? null);
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading jobs from local API...');
  const [uploadTickets, setUploadTickets] = useState<PhotoUploadTicket[]>([]);

  const selectedJobTickets = useMemo(
    () => uploadTickets.filter((ticket) => ticket.jobId === selectedJobId),
    [selectedJobId, uploadTickets],
  );

  useEffect(() => {
    let isMounted = true;

    fetchJobs()
      .then((apiJobs) => {
        if (!isMounted) {
          return;
        }

        setJobs(apiJobs);
        setSelectedJobId((current) => current ?? apiJobs[0]?.id ?? null);
        setStatusMessage('Connected to the local API.');
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setJobs(seedJobs);
        setSelectedJobId((current) => current ?? seedJobs[0]?.id ?? null);
        setStatusMessage('Using seed data because the local API is not reachable yet.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingJobs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJob(null);
      return;
    }

    let isMounted = true;
    setIsLoadingDetail(true);

    fetchJobDetail(selectedJobId)
      .then((detail) => {
        if (isMounted) {
          setSelectedJob(detail);
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallback = jobs.find((job) => job.id === selectedJobId) ?? null;
          setSelectedJob(
            fallback
              ? {
                  ...fallback,
                  checklist: [
                    { id: 'before-photos', label: 'Capture before photos', completed: fallback.beforePhotos > 0 },
                    { id: 'yard-service', label: 'Complete yard service', completed: fallback.status !== 'scheduled' },
                    { id: 'after-photos', label: 'Capture after photos', completed: fallback.afterPhotos > 0 },
                    { id: 'completion-notes', label: 'Submit completion notes', completed: fallback.status === 'completed' },
                  ],
                }
              : null,
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDetail(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [jobs, selectedJobId]);

  async function handleStartJob() {
    if (!selectedJobId) {
      return;
    }

    await startJob(selectedJobId);
    setStatusMessage(`Started ${selectedJobId}.`);
    setJobs((current) => current.map((job) => (job.id === selectedJobId ? { ...job, status: 'in_progress' } : job)));
  }

  async function handleCompleteJob() {
    if (!selectedJobId) {
      return;
    }

    await completeJob(selectedJobId);
    setStatusMessage(`Completed ${selectedJobId}.`);
    setJobs((current) => current.map((job) => (job.id === selectedJobId ? { ...job, status: 'completed' } : job)));
  }

  async function handlePhotoSelected(file: File, photoType: 'before' | 'after' | 'issue' | 'extra') {
    if (!selectedJobId) {
      return;
    }

    const ticket = await createPhotoUploadTicket(selectedJobId, file, photoType);
    await completePhotoUpload(selectedJobId, ticket.photoId);

    setUploadTickets((current) => [ticket, ...current]);
    setStatusMessage(`Prepared ${photoType} photo placeholder for ${file.name}.`);
    setJobs((current) =>
      current.map((job) => {
        if (job.id !== selectedJobId) {
          return job;
        }

        if (photoType === 'before') {
          return { ...job, beforePhotos: job.beforePhotos + 1 };
        }

        if (photoType === 'after') {
          return { ...job, afterPhotos: job.afterPhotos + 1 };
        }

        return job;
      }),
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
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
              <p>{isLoadingJobs ? 'Loading...' : `${jobs.length} assigned jobs`}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Assigned jobs</h2>
              <p className="text-sm text-slate-600">{statusMessage}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={job.id === selectedJobId}
                onSelect={setSelectedJobId}
              />
            ))}
          </div>
        </div>

        <JobDetailPanel
          job={selectedJob}
          isLoading={isLoadingDetail}
          uploadTickets={selectedJobTickets}
          onStart={handleStartJob}
          onComplete={handleCompleteJob}
          onPhotoSelected={handlePhotoSelected}
        />
      </section>
    </main>
  );
}
