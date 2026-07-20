import { useEffect, useState } from 'react';
import { fetchAccountStatus, type AccountStatus } from '../api/client';
import { ApiRequestError } from '../api/apiError';
import {
  billingModelLabel,
  getAccountSummaryForJob,
  paymentStatusLabel,
} from '../domain/accounts';

type AccountStatusCardProps = {
  jobId: string;
};

export function AccountStatusCard({ jobId }: AccountStatusCardProps) {
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [source, setSource] = useState<'api' | 'local' | null>(null);
  const [persistedAccountUnavailable, setPersistedAccountUnavailable] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setAccount(null);
    setSource(null);
    setPersistedAccountUnavailable(false);

    fetchAccountStatus(jobId)
      .then((apiAccount) => {
        if (isMounted) {
          setAccount(apiAccount);
          setSource('api');
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          if (error instanceof ApiRequestError) {
            setAccount(null);
            setSource(null);
            setPersistedAccountUnavailable(true);
          } else {
            setAccount(getAccountSummaryForJob(jobId));
            setSource('local');
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  if (persistedAccountUnavailable) {
    return (
      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Account status unavailable</p>
        <p className="mt-2 text-sm text-amber-950" role="alert">
          Persisted billing and service-approval context could not be loaded. Retry after API readiness recovers.
        </p>
      </section>
    );
  }

  if (!account || !source) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Account status</p>
        <p className="mt-2 text-sm text-slate-600" role="status">Loading persisted account context…</p>
      </section>
    );
  }

  const accountIsCurrent =
    account.paymentStatus === 'paid' || account.paymentStatus === 'not_required' || account.paymentStatus === 'waived';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Account status</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{billingModelLabel(account.billingModel)}</h3>
          <p className="mt-1 text-xs text-slate-500">Source: {source === 'api' ? 'local API' : 'browser fallback'}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            accountIsCurrent ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {paymentStatusLabel(account.paymentStatus)}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Services this period</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">
          {account.completedServicesThisPeriod} / {account.contractedServicesPerPeriod}
        </p>
        <p className="mt-2 text-xs text-slate-500">{account.billingNotes}</p>
      </div>
    </section>
  );
}
