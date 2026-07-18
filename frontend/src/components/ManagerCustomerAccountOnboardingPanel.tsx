import { useEffect, useState } from 'react';
import {
  createCustomerAccount,
  createCustomerProperty,
  fetchCustomerAccounts,
  fetchCustomerProperties,
  type CustomerAccountRecord,
  type CustomerPropertyRecord,
  updateCustomerAccount,
} from '../api/client';

type Props = {
  organizationId: string;
  onPropertyCreated?: (property: CustomerPropertyRecord) => void;
  onPropertiesLoaded?: (properties: CustomerPropertyRecord[]) => void;
};

type PropertyDraft = { displayName: string; serviceAddress: string };

export function ManagerCustomerAccountOnboardingPanel({
  organizationId,
  onPropertyCreated,
  onPropertiesLoaded,
}: Props) {
  const [accounts, setAccounts] = useState<CustomerAccountRecord[]>([]);
  const [properties, setProperties] = useState<Record<string, CustomerPropertyRecord[]>>({});
  const [propertyDrafts, setPropertyDrafts] = useState<Record<string, PropertyDraft>>({});
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<CustomerAccountRecord | null>(null);

  async function refresh() {
    setIsLoading(true);
    try {
      const loadedAccounts = await fetchCustomerAccounts();
      setAccounts(loadedAccounts);
      const loadedProperties = await Promise.all(
        loadedAccounts.map(async (account) => [
          account.accountId,
          await fetchCustomerProperties(account.accountId).catch(() => []),
        ] as const),
      );
      setProperties(Object.fromEntries(loadedProperties));
      onPropertiesLoaded?.(loadedProperties.flatMap(([, accountProperties]) => accountProperties));
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

  async function save(account: CustomerAccountRecord) {
    setIsLoading(true);
    try {
      const updated = await updateCustomerAccount(account.accountId, account);
      setAccounts((current) => current.map((item) => item.accountId === updated.accountId ? updated : item)
        .sort((a, b) => a.customerName.localeCompare(b.customerName)));
      setEditingAccount(null);
      setMessage(`${updated.customerName} account updated.`);
    } catch {
      setMessage('The customer account could not be updated.');
    } finally {
      setIsLoading(false);
    }
  }

  function updatePropertyDraft(accountId: string, update: Partial<PropertyDraft>) {
    setPropertyDrafts((current) => {
      const draft = current[accountId] ?? { displayName: '', serviceAddress: '' };
      return { ...current, [accountId]: { ...draft, ...update } };
    });
  }

  async function addProperty(account: CustomerAccountRecord) {
    const draft = propertyDrafts[account.accountId] ?? { displayName: '', serviceAddress: '' };
    if (draft.displayName.trim().length < 2 || draft.serviceAddress.trim().length < 5) {
      setMessage('Enter a property name and complete service address.');
      return;
    }
    setIsLoading(true);
    try {
      const property = await createCustomerProperty(account.accountId, {
        organizationId: account.organizationId,
        displayName: draft.displayName.trim(),
        serviceAddress: draft.serviceAddress.trim(),
      });
      setProperties((current) => ({
        ...current,
        [account.accountId]: [...(current[account.accountId] ?? []), property]
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      }));
      setPropertyDrafts((current) => ({ ...current, [account.accountId]: { displayName: '', serviceAddress: '' } }));
      setMessage(`${property.displayName} property created.`);
      onPropertyCreated?.(property);
    } catch {
      setMessage('The customer property could not be created.');
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
            {editingAccount?.accountId === account.accountId ? (
              <AccountEditor account={editingAccount} disabled={isLoading} onCancel={() => setEditingAccount(null)} onChange={setEditingAccount} onSave={() => void save(editingAccount)} />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{account.customerName}</p>
                    <p className="text-xs text-slate-500">{account.billingModel.replace('_', ' ')} · {account.paymentStatus.replace('_', ' ')}</p>
                  </div>
                  <button className="text-sm font-semibold text-emerald-700" onClick={() => setEditingAccount(account)} type="button">Edit</button>
                </div>
                {account.billingNotes ? <p className="mt-2 text-sm text-slate-600">{account.billingNotes}</p> : null}
                <div className="mt-3 space-y-2">
                  {(properties[account.accountId] ?? []).map((property) => (
                    <div className="rounded-lg bg-slate-50 px-3 py-2" key={property.propertyId}>
                      <p className="text-sm font-semibold text-slate-800">{property.displayName}</p>
                      <p className="text-xs text-slate-500">{property.serviceAddress} · {property.status}</p>
                    </div>
                  ))}
                  {(properties[account.accountId] ?? []).length === 0 ? (
                    <p className="text-xs text-amber-700">No properties have been added.</p>
                  ) : null}
                </div>
                <details className="mt-3 rounded-lg border border-slate-200 px-3">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-emerald-700 [&::-webkit-details-marker]:hidden">
                    Add property
                  </summary>
                  <div className="grid gap-2 border-t border-slate-100 py-3">
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      onChange={(event) => updatePropertyDraft(account.accountId, { displayName: event.target.value })}
                      placeholder="Property name"
                      value={propertyDrafts[account.accountId]?.displayName ?? ''}
                    />
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      onChange={(event) => updatePropertyDraft(account.accountId, { serviceAddress: event.target.value })}
                      placeholder="Service address"
                      value={propertyDrafts[account.accountId]?.serviceAddress ?? ''}
                    />
                    <button
                      className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                      disabled={isLoading}
                      onClick={() => void addProperty(account)}
                      type="button"
                    >
                      Create property
                    </button>
                  </div>
                </details>
              </>
            )}
          </div>
        ))}
        {!isLoading && accounts.length === 0 ? <p className="text-sm text-slate-500">No customer accounts yet.</p> : null}
      </div>
    </section>
  );
}

function AccountEditor({ account, disabled, onCancel, onChange, onSave }: {
  account: CustomerAccountRecord;
  disabled: boolean;
  onCancel: () => void;
  onChange: (account: CustomerAccountRecord) => void;
  onSave: () => void;
}) {
  const update = <K extends keyof CustomerAccountRecord>(key: K, value: CustomerAccountRecord[K]) =>
    onChange({ ...account, [key]: value });
  return (
    <div className="grid gap-3">
      <label className="text-sm font-semibold text-slate-700">Customer name
        <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" value={account.customerName} onChange={(event) => update('customerName', event.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Billing model
          <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" value={account.billingModel} onChange={(event) => update('billingModel', event.target.value as CustomerAccountRecord['billingModel'])}>
            <option value="per_job">Per job</option><option value="monthly_plan">Monthly plan</option><option value="prepaid_package">Prepaid package</option><option value="manual_account">Manual account</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">Payment status
          <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" value={account.paymentStatus} onChange={(event) => update('paymentStatus', event.target.value as CustomerAccountRecord['paymentStatus'])}>
            <option value="not_required">Not required</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="past_due">Past due</option><option value="waived">Waived</option><option value="manager_review">Manager review</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">Service approval
          <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" value={account.serviceApprovalStatus} onChange={(event) => update('serviceApprovalStatus', event.target.value as CustomerAccountRecord['serviceApprovalStatus'])}>
            <option value="approved">Approved</option><option value="blocked">Blocked</option><option value="manager_review">Manager review</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">Services per period
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" min="0" type="number" value={account.contractedServicesPerPeriod} onChange={(event) => update('contractedServicesPerPeriod', Math.max(0, Number(event.target.value)))} />
        </label>
      </div>
      <label className="text-sm font-semibold text-slate-700">Billing notes
        <textarea className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" maxLength={1000} rows={2} value={account.billingNotes} onChange={(event) => update('billingNotes', event.target.value)} />
      </label>
      <div className="flex justify-end gap-2">
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" disabled={disabled} onClick={onCancel} type="button">Cancel</button>
        <button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60" disabled={disabled || account.customerName.trim().length < 2} onClick={onSave} type="button">Save account</button>
      </div>
    </div>
  );
}
