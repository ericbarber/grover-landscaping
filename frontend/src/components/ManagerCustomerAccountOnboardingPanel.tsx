import { useEffect, useState } from 'react';
import {
  createCustomerAccount,
  createCustomerProperty,
  fetchCustomerAccountOnboardingProgress,
  fetchCustomerAccounts,
  fetchCustomerProperties,
  type CustomerAccountRecord,
  type CustomerAccountOnboardingProgress,
  type CustomerPropertyRecord,
  updateCustomerAccount,
} from '../api/client';
import {
  deriveAccountOnboardingProgress,
  filterAccountsByOnboardingProgress,
  propertyAttentionReasonLabel,
  propertyAttentionWorkspace,
  type AccountOnboardingFilter,
} from '../domain/accountOnboardingProgress';

type Props = {
  organizationId: string;
  onOpenPropertyWorkspace?: (
    propertyId: string,
    workspace: 'operational-profile' | 'service-setup',
  ) => void;
  onPropertyCreated?: (property: CustomerPropertyRecord) => void;
  onPropertiesLoaded?: (properties: CustomerPropertyRecord[]) => void;
  refreshSignal?: number;
};

type PropertyDraft = { displayName: string; serviceAddress: string };

export function ManagerCustomerAccountOnboardingPanel({
  organizationId,
  onOpenPropertyWorkspace,
  onPropertyCreated,
  onPropertiesLoaded,
  refreshSignal = 0,
}: Props) {
  const [accounts, setAccounts] = useState<CustomerAccountRecord[]>([]);
  const [properties, setProperties] = useState<Record<string, CustomerPropertyRecord[]>>({});
  const [progress, setProgress] = useState<Record<string, CustomerAccountOnboardingProgress>>({});
  const [propertyDrafts, setPropertyDrafts] = useState<Record<string, PropertyDraft>>({});
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<CustomerAccountRecord | null>(null);
  const [addingPropertyAccountId, setAddingPropertyAccountId] = useState('');
  const [filter, setFilter] = useState<AccountOnboardingFilter>('all');
  const filteredAccounts = filterAccountsByOnboardingProgress(accounts, progress, filter);
  const completeCount = accounts.filter((account) => progress[account.accountId]?.complete).length;
  const incompleteCount = accounts.length - completeCount;

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
      const loadedProgress = await Promise.all(loadedAccounts.map(async (account) => [
        account.accountId,
        await fetchCustomerAccountOnboardingProgress(account.accountId).catch(
          () => deriveAccountOnboardingProgress(
            account,
            loadedProperties.find(([accountId]) => accountId === account.accountId)?.[1] ?? [],
          ),
        ),
      ] as const));
      setProgress(Object.fromEntries(loadedProgress));
      onPropertiesLoaded?.(loadedProperties.flatMap(([, accountProperties]) => accountProperties));
    } catch {
      setMessage('Customer accounts could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [refreshSignal]);

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
        primaryContactName: '',
        contactEmail: '',
        contactPhone: '',
        emailNotificationsEnabled: false,
        smsNotificationsEnabled: false,
        quietHoursStart: '',
        quietHoursEnd: '',
      });
      setAccounts((current) => [...current, account].sort((a, b) => a.customerName.localeCompare(b.customerName)));
      setProgress((current) => ({
        ...current,
        [account.accountId]: deriveAccountOnboardingProgress(account, []),
      }));
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
      const accountProgress = await fetchCustomerAccountOnboardingProgress(updated.accountId).catch(
        () => deriveAccountOnboardingProgress(updated, properties[updated.accountId] ?? []),
      );
      setProgress((current) => ({ ...current, [updated.accountId]: accountProgress }));
      setEditingAccount(null);
      setMessage(`${updated.customerName} account updated.`);
    } catch {
      setMessage('The customer account could not be updated.');
    } finally {
      setIsLoading(false);
    }
  }

  function openAccountDetails(account: CustomerAccountRecord) {
    setEditingAccount(account);
    window.setTimeout(() => {
      document.getElementById(`customer-account-${account.accountId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  function openPropertyForm(accountId: string) {
    setAddingPropertyAccountId(accountId);
    window.setTimeout(() => {
      document.getElementById(`customer-property-form-${accountId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 0);
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
      const accountProperties = [...(properties[account.accountId] ?? []), property];
      const accountProgress = await fetchCustomerAccountOnboardingProgress(account.accountId).catch(
        () => deriveAccountOnboardingProgress(account, accountProperties),
      );
      setProgress((current) => ({ ...current, [account.accountId]: accountProgress }));
      setPropertyDrafts((current) => ({ ...current, [account.accountId]: { displayName: '', serviceAddress: '' } }));
      setAddingPropertyAccountId('');
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
      <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Account onboarding filters">
        {([
          ['all', `All ${accounts.length}`],
          ['incomplete', `Needs setup ${incompleteCount}`],
          ['complete', `Complete ${completeCount}`],
        ] as const).map(([value, label]) => (
          <button
            aria-pressed={filter === value}
            className={`min-h-11 rounded-lg px-2 py-2 text-xs font-semibold ${
              filter === value
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-700'
            }`}
            key={value}
            onClick={() => setFilter(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {filteredAccounts.map((account) => (
          <div
            className="scroll-mt-20 rounded-lg border border-slate-200 p-3"
            id={`customer-account-${account.accountId}`}
            key={account.accountId}
          >
            {editingAccount?.accountId === account.accountId ? (
              <AccountEditor account={editingAccount} disabled={isLoading} onCancel={() => setEditingAccount(null)} onChange={setEditingAccount} onSave={() => void save(editingAccount)} />
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{account.customerName}</p>
                    <p className="text-xs text-slate-500">{account.billingModel.replace('_', ' ')} · {account.paymentStatus.replace('_', ' ')}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {account.primaryContactName || 'Contact not set'}
                      {account.contactEmail ? ` · ${account.contactEmail}` : ''}
                      {account.contactPhone ? ` · ${account.contactPhone}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Notifications: {[
                        account.emailNotificationsEnabled ? 'email' : null,
                        account.smsNotificationsEnabled ? 'SMS' : null,
                      ].filter(Boolean).join(' + ') || 'off'}
                      {account.quietHoursStart && account.quietHoursEnd
                        ? ` · quiet ${account.quietHoursStart}–${account.quietHoursEnd}`
                        : ''}
                    </p>
                  </div>
                  <button className="min-h-11 px-2 text-sm font-semibold text-emerald-700" onClick={() => openAccountDetails(account)} type="button">Edit</button>
                </div>
                {account.billingNotes ? <p className="mt-2 text-sm text-slate-600">{account.billingNotes}</p> : null}
                <AccountProgress
                  onAddProperty={() => openPropertyForm(account.accountId)}
                  onOpenCustomerDetails={() => openAccountDetails(account)}
                  progress={progress[account.accountId]}
                />
                <div className="mt-3 space-y-2">
                  {(properties[account.accountId] ?? []).map((property) => {
                    const attention = progress[account.accountId]?.propertiesNeedingAttention
                      .find((item) => item.propertyId === property.propertyId);
                    return (
                      <div className="rounded-lg bg-slate-50 px-3 py-2" key={property.propertyId}>
                        <p className="text-sm font-semibold text-slate-800">{property.displayName}</p>
                        <p className="text-xs text-slate-500">{property.serviceAddress} · {property.status}</p>
                        {attention ? (
                          <ul className="mt-2 flex flex-wrap gap-1">
                            {attention.reasons.map((reason) => (
                              <li key={reason}>
                                <button
                                  className="min-h-9 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                                  onClick={() => onOpenPropertyWorkspace?.(
                                    property.propertyId,
                                    propertyAttentionWorkspace(reason),
                                  )}
                                  type="button"
                                >
                                  {propertyAttentionReasonLabel(reason)}
                                  <span aria-hidden="true"> →</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    );
                  })}
                  {(properties[account.accountId] ?? []).length === 0 ? (
                    <p className="text-xs text-amber-700">No properties have been added.</p>
                  ) : null}
                </div>
                <details
                  className="mt-3 scroll-mt-20 rounded-lg border border-slate-200 px-3"
                  id={`customer-property-form-${account.accountId}`}
                  onToggle={(event) => {
                    const isOpen = event.currentTarget.open;
                    setAddingPropertyAccountId((current) => {
                      if (isOpen) return account.accountId;
                      return current === account.accountId ? '' : current;
                    });
                  }}
                  open={addingPropertyAccountId === account.accountId}
                >
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
        {!isLoading && accounts.length > 0 && filteredAccounts.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            No accounts match this onboarding filter.
          </p>
        ) : null}
        {!isLoading && accounts.length === 0 ? <p className="text-sm text-slate-500">No customer accounts yet.</p> : null}
      </div>
    </section>
  );
}

function AccountProgress({
  progress,
  onOpenCustomerDetails,
  onAddProperty,
}: {
  progress?: CustomerAccountOnboardingProgress;
  onOpenCustomerDetails: () => void;
  onAddProperty: () => void;
}) {
  if (!progress) return null;
  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">Onboarding progress</p>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
          progress.complete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
        }`}>
          {progress.complete ? 'Complete' : 'In progress'}
        </span>
      </div>
      <ul className="mt-2 grid gap-1 text-xs text-slate-600">
        <li>{progress.customerDetailsReady ? '✓' : '○'} Customer service details approved</li>
        <li>{progress.propertyCount > 0 ? '✓' : '○'} Property added ({progress.propertyCount})</li>
        <li>
          {progress.serviceReadyPropertyCount === progress.propertyCount && progress.propertyCount > 0 ? '✓' : '○'}
          {' '}{progress.serviceReadyPropertyCount} of {progress.propertyCount} properties service-ready
        </li>
        <li>
          {progress.propertiesNeedingAttention.length === 0 ? '✓' : '○'}
          {' '}{progress.propertiesNeedingAttention.length} properties need attention
        </li>
        <li>
          {progress.activePropertyCount === progress.propertyCount && progress.propertyCount > 0 ? '✓' : '○'}
          {' '}{progress.activePropertyCount} of {progress.propertyCount} properties active
        </li>
      </ul>
      {!progress.customerDetailsReady ? (
        <button
          className="mt-3 min-h-11 w-full rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          onClick={onOpenCustomerDetails}
          type="button"
        >
          Complete customer service details
          <span aria-hidden="true"> →</span>
        </button>
      ) : null}
      {progress.propertyCount === 0 ? (
        <button
          className="mt-3 min-h-11 w-full rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          onClick={onAddProperty}
          type="button"
        >
          Add first property
          <span aria-hidden="true"> →</span>
        </button>
      ) : null}
    </div>
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
  const notificationPreferencesValid = (
    (!account.emailNotificationsEnabled || account.contactEmail.trim().length > 0)
    && (!account.smsNotificationsEnabled || account.contactPhone.trim().length > 0)
    && (Boolean(account.quietHoursStart) === Boolean(account.quietHoursEnd))
  );
  return (
    <div className="grid gap-3">
      <label className="text-sm font-semibold text-slate-700">Customer name
        <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" value={account.customerName} onChange={(event) => update('customerName', event.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Primary contact
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" maxLength={160} value={account.primaryContactName} onChange={(event) => update('primaryContactName', event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Contact email
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" maxLength={254} type="email" value={account.contactEmail} onChange={(event) => update('contactEmail', event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Contact phone
          <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" inputMode="tel" placeholder="+14805550123" value={account.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} />
        </label>
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
      <fieldset className="rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-sm font-semibold text-slate-700">Notification preferences</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
            <input checked={account.emailNotificationsEnabled} disabled={!account.contactEmail} onChange={(event) => update('emailNotificationsEnabled', event.target.checked)} type="checkbox" />
            Email updates
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
            <input checked={account.smsNotificationsEnabled} disabled={!account.contactPhone} onChange={(event) => update('smsNotificationsEnabled', event.target.checked)} type="checkbox" />
            SMS updates
          </label>
          <label className="text-sm font-semibold text-slate-700">Quiet hours start
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" onChange={(event) => update('quietHoursStart', event.target.value)} type="time" value={account.quietHoursStart} />
          </label>
          <label className="text-sm font-semibold text-slate-700">Quiet hours end
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" onChange={(event) => update('quietHoursEnd', event.target.value)} type="time" value={account.quietHoursEnd} />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500">Set both quiet-hour times or leave both blank.</p>
      </fieldset>
      <div className="flex justify-end gap-2">
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" disabled={disabled} onClick={onCancel} type="button">Cancel</button>
        <button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60" disabled={disabled || account.customerName.trim().length < 2 || !notificationPreferencesValid} onClick={onSave} type="button">Save account</button>
      </div>
    </div>
  );
}
