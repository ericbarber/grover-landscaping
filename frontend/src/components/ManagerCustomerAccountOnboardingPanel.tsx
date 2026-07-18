import { useEffect, useState } from 'react';
import {
  createCustomerAccount,
  fetchCustomerAccounts,
  type CustomerAccountRecord,
} from '../api/client';

type Props = { organizationId: string };

export function ManagerCustomerAccountOnboardingPanel({ organizationId }: Props) {
  const [accounts, setAccounts] = useState<CustomerAccountRecord[]>([]);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    try {
      setAccounts(await fetchCustomerAccounts());
    } catch {
      setMessage('Customer accounts could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function create() {
    if (name.trim().length < 2) {
      setMessage('Enter a customer name with at least two characters.');
      return;
    }
    setIsLoading(true);
    try {
      const account = await createCustomerAccount({
        organizationId,
        customerName: name.trim(),
        billingModel: 'per_job',
        paymentStatus: 'pending',
        serviceApprovalStatus: 'approved',
        contractedServicesPerPeriod: 1,
        billingNotes: '',
      });
      setAccounts((current) => [...current, account].sort((a, b) => a.customerName.localeCompare(b.customerName)));
      setName('');
      setMessage(`${account.customerName} account created.`);
    } catch {
      setMessage('The customer account could not be created.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Customer onboarding</p>
      <h2 className="mt-1 text-xl font-bold text-slate-950">Customer accounts</h2>
      <div className="mt-4 flex gap-2">
        <input className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2" placeholder="Customer or company name" value={name} onChange={(event) => setName(event.target.value)} />
        <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-60" disabled={isLoading} onClick={() => void create()} type="button">Add account</button>
      </div>
      {message ? <p className="mt-2 text-sm text-slate-600" role="status">{message}</p> : null}
      <div className="mt-4 space-y-2">
        {accounts.map((account) => (
          <div className="rounded-lg border border-slate-200 p-3" key={account.accountId}>
            <p className="font-semibold text-slate-950">{account.customerName}</p>
            <p className="text-xs text-slate-500">{account.billingModel.replace('_', ' ')} · {account.paymentStatus.replace('_', ' ')}</p>
          </div>
        ))}
        {!isLoading && accounts.length === 0 ? <p className="text-sm text-slate-500">No customer accounts yet.</p> : null}
      </div>
    </section>
  );
}
