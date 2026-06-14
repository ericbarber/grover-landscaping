import { useEffect, useState } from 'react';
import { fetchAccountStatus, type AccountStatus } from '../api/client';
import {
  billingModelLabel,
  getAccountSummaryForJob,
  paymentStatusLabel,
} from '../domain/accounts';

type AccountStatusCardProps = {
  jobId: string;
};

export function AccountStatusCard({ jobId }: AccountStatusCardProps) {
  const [account, setAccount] = useState<AccountStatus>(() => getAccountSummaryForJob(jobId));
  const [source, setSource] = useState<'api' | 'local'>('local');

  useEffect(() => {
    let isMounted = true;

    fetchAccountStatus(jobId)
      .then((apiAccount) => {
        if (isMounted) {
          setAccount(apiAccount);
          setSource('api');
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccount(getAccountSummaryForJob(jobId));
          setSource('local');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [jobId]);

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
