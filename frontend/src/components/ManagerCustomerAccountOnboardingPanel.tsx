import { useEffect, useState } from 'react';
import { ApiRequestError } from '../api/apiError';
import {
  archiveCustomerAccount,
  createCustomerAccount,
  createCustomerProperty,
  fetchCustomerAccountOnboardingProgress,
  fetchArchivedCustomerAccounts,
  fetchCustomerAccounts,
  fetchCustomerProperties,
  reactivateCustomerAccount,
  type CustomerAccountRecord,
  type CustomerAccountOnboardingProgress,
  type CustomerPropertyRecord,
  updateCustomerAccount,
  updateCustomerAccountRelationship,
} from '../api/client';
import {
  deriveAccountOnboardingProgress,
  customerRelationshipCounts,
  filterAccountsByOnboardingProgress,
  filterAccountsByRelationship,
  propertyAttentionReasonLabel,
  propertyAttentionWorkspace,
  searchCustomerAccounts,
  type AccountOnboardingFilter,
  type CustomerRelationshipFilter,
} from '../domain/accountOnboardingProgress';
import {
  customerAccountDraftError,
  emptyCustomerAccountDraft,
  findMatchingCustomerAccount,
  type CustomerAccountDraft,
} from '../domain/customerAccountDraft';
import { customerOnboardingCsv } from '../domain/customerOnboardingExport';

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
  const [archivedAccounts, setArchivedAccounts] = useState<CustomerAccountRecord[]>([]);
  const [properties, setProperties] = useState<Record<string, CustomerPropertyRecord[]>>({});
  const [progress, setProgress] = useState<Record<string, CustomerAccountOnboardingProgress>>({});
  const [propertyDrafts, setPropertyDrafts] = useState<Record<string, PropertyDraft>>({});
  const [createDraft, setCreateDraft] = useState<CustomerAccountDraft>(emptyCustomerAccountDraft);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [duplicateAccount, setDuplicateAccount] = useState<CustomerAccountRecord | null>(null);
  const [archiveConfirmationId, setArchiveConfirmationId] = useState('');
  const [reactivateConfirmationId, setReactivateConfirmationId] = useState('');
  const [relationshipDrafts, setRelationshipDrafts] = useState<Record<string, NonNullable<CustomerAccountRecord['relationshipType']>>>({});
  const [relationshipConfirmationId, setRelationshipConfirmationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accountsUnavailable, setAccountsUnavailable] = useState(false);
  const [archivedAccountsUnavailable, setArchivedAccountsUnavailable] = useState(false);
  const [propertyListsUnavailable, setPropertyListsUnavailable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<CustomerAccountRecord | null>(null);
  const [addingPropertyAccountId, setAddingPropertyAccountId] = useState('');
  const [filter, setFilter] = useState<AccountOnboardingFilter>('all');
  const [relationshipFilter, setRelationshipFilter] = useState<CustomerRelationshipFilter>(
    () => loadRelationshipFilter(organizationId),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const statusFilteredAccounts = filterAccountsByOnboardingProgress(accounts, progress, filter);
  const relationshipFilteredAccounts = filterAccountsByRelationship(statusFilteredAccounts, relationshipFilter);
  const filteredAccounts = searchCustomerAccounts(relationshipFilteredAccounts, properties, searchQuery);
  const relationshipCounts = customerRelationshipCounts(accounts);
  const completeCount = accounts.filter((account) => progress[account.accountId]?.complete).length;
  const incompleteCount = accounts.length - completeCount;

  async function refresh() {
    setIsLoading(true);
    setAccountsUnavailable(false);
    setArchivedAccountsUnavailable(false);
    setPropertyListsUnavailable(false);
    try {
      const loadedAccounts = await fetchCustomerAccounts();
      const loadedArchivedAccounts = await fetchArchivedCustomerAccounts().catch(() => {
        setArchivedAccountsUnavailable(true);
        return [];
      });
      setAccounts(loadedAccounts);
      setArchivedAccounts(loadedArchivedAccounts);
      const loadedProperties = await Promise.all(
        loadedAccounts.map(async (account) => [
          account.accountId,
          await fetchCustomerProperties(account.accountId).catch((error: unknown) => {
            if (error instanceof ApiRequestError) {
              setPropertyListsUnavailable(true);
            }
            return [];
          }),
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
      setAccounts([]);
      setArchivedAccounts([]);
      setProperties({});
      setProgress({});
      setAccountsUnavailable(true);
      setMessage('Customer accounts could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [refreshSignal]);
  useEffect(() => {
    setRelationshipFilter(loadRelationshipFilter(organizationId));
  }, [organizationId]);

  async function create(allowDuplicate = false) {
    const validationError = customerAccountDraftError(createDraft);
    if (validationError) {
      setMessage(validationError);
      return;
    }
    const matchingAccount = findMatchingCustomerAccount(accounts, createDraft);
    if (matchingAccount && !allowDuplicate) {
      setDuplicateAccount(matchingAccount);
      return;
    }
    setIsLoading(true);
    try {
      const account = await createCustomerAccount({
        organizationId,
        relationshipType: createDraft.relationshipType,
        customerName: createDraft.customerName.trim(),
        billingModel: 'per_job',
        paymentStatus: 'pending',
        serviceApprovalStatus: 'approved',
        contractedServicesPerPeriod: 1,
        billingNotes: '',
        primaryContactName: createDraft.primaryContactName.trim(),
        contactEmail: createDraft.contactEmail.trim(),
        contactPhone: createDraft.contactPhone.trim(),
        emailNotificationsEnabled: createDraft.emailNotificationsEnabled,
        smsNotificationsEnabled: createDraft.smsNotificationsEnabled,
        quietHoursStart: '',
        quietHoursEnd: '',
      });
      setAccounts((current) => [...current, account].sort((a, b) => a.customerName.localeCompare(b.customerName)));
      setProgress((current) => ({
        ...current,
        [account.accountId]: deriveAccountOnboardingProgress(account, []),
      }));
      setCreateDraft(emptyCustomerAccountDraft);
      setShowCreateForm(false);
      setDuplicateAccount(null);
      setMessage(`${account.customerName} account created.`);
    } catch {
      setMessage('The customer account could not be created.');
    } finally {
      setIsLoading(false);
    }
  }

  function downloadOnboardingReview() {
    const url = URL.createObjectURL(new Blob(
      [customerOnboardingCsv(filteredAccounts, progress)],
      { type: 'text/csv;charset=utf-8' },
    ));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `customer-onboarding-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`Downloaded ${filteredAccounts.length} customer onboarding record${filteredAccounts.length === 1 ? '' : 's'}.`);
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

  async function archive(account: CustomerAccountRecord) {
    setIsLoading(true);
    try {
      await archiveCustomerAccount(account.accountId);
      setArchivedAccounts((current) => [...current, account]
        .sort((a, b) => a.customerName.localeCompare(b.customerName)));
      setAccounts((current) => current.filter((item) => item.accountId !== account.accountId));
      setProperties((current) => {
        const next = { ...current };
        delete next[account.accountId];
        return next;
      });
      setProgress((current) => {
        const next = { ...current };
        delete next[account.accountId];
        return next;
      });
      setArchiveConfirmationId('');
      setMessage(`${account.customerName} account archived. Historical records remain available.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The customer account could not be archived.');
    } finally {
      setIsLoading(false);
    }
  }

  async function reactivate(account: CustomerAccountRecord) {
    setIsLoading(true);
    try {
      const reactivated = await reactivateCustomerAccount(account.accountId);
      const accountProperties = await fetchCustomerProperties(account.accountId).catch(() => []);
      const accountProgress = await fetchCustomerAccountOnboardingProgress(account.accountId).catch(
        () => deriveAccountOnboardingProgress(reactivated, accountProperties),
      );
      setArchivedAccounts((current) => current.filter((item) => item.accountId !== account.accountId));
      setAccounts((current) => [...current, reactivated]
        .sort((a, b) => a.customerName.localeCompare(b.customerName)));
      setProperties((current) => ({ ...current, [account.accountId]: accountProperties }));
      setProgress((current) => ({ ...current, [account.accountId]: accountProgress }));
      setReactivateConfirmationId('');
      setMessage(`${account.customerName} account returned to active onboarding.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The customer account could not be reactivated.');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveRelationship(account: CustomerAccountRecord) {
    const relationshipType = relationshipDrafts[account.accountId] ?? account.relationshipType ?? 'service_provider';
    setIsLoading(true);
    try {
      const updated = await updateCustomerAccountRelationship(account.accountId, relationshipType);
      setAccounts((current) => current.map((item) => item.accountId === updated.accountId ? updated : item));
      setRelationshipConfirmationId('');
      setMessage(`${updated.customerName} relationship updated to ${accountRelationshipLabel(updated.relationshipType)}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The customer relationship could not be updated.');
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
      {!showCreateForm ? (
        <button className="mt-4 min-h-11 w-full rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-60" disabled={isLoading} onClick={() => setShowCreateForm(true)} type="button">
          Add customer account
        </button>
      ) : (
        <CustomerAccountCreateForm
          disabled={isLoading}
          draft={createDraft}
          onCancel={() => {
            setCreateDraft(emptyCustomerAccountDraft);
            setShowCreateForm(false);
            setDuplicateAccount(null);
          }}
          onChange={(draft) => {
            setCreateDraft(draft);
            setDuplicateAccount(null);
          }}
          onCreate={() => void create()}
          onCreateAnyway={() => void create(true)}
          onReviewDuplicate={() => {
            if (!duplicateAccount) return;
            setFilter('all');
            setSearchQuery('');
            setShowCreateForm(false);
            setCreateDraft(emptyCustomerAccountDraft);
            setDuplicateAccount(null);
            openAccountDetails(duplicateAccount);
          }}
          duplicateAccount={duplicateAccount}
        />
      )}
      {message ? <p className="mt-2 text-sm text-slate-600" role="status">{message}</p> : null}
      {accountsUnavailable ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
          Persisted customer accounts could not be loaded. Account administration is unavailable until API readiness recovers.
        </p>
      ) : null}
      {propertyListsUnavailable ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
          Persisted customer properties could not be loaded. Property counts and onboarding readiness may be incomplete.
        </p>
      ) : null}
      <label className="mt-4 block text-sm font-semibold text-slate-700">Find customer account
        <input
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Customer, contact, phone, or property"
          type="search"
          value={searchQuery}
        />
      </label>
      <label className="mt-3 block text-sm font-semibold text-slate-700">Customer relationship filter
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
          onChange={(event) => {
            const nextFilter = event.target.value as CustomerRelationshipFilter;
            setRelationshipFilter(nextFilter);
            window.localStorage.setItem(relationshipFilterStorageKey(organizationId), nextFilter);
          }}
          value={relationshipFilter}
        >
          <option value="all">All relationships ({relationshipCounts.all})</option>
          <option value="owner">Direct property owners ({relationshipCounts.owner})</option>
          <option value="property_manager">Property managers ({relationshipCounts.property_manager})</option>
          <option value="service_provider">Service-provider partners ({relationshipCounts.service_provider})</option>
        </select>
      </label>
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
      <button
        className="mt-3 min-h-11 w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-50"
        disabled={filteredAccounts.length === 0}
        onClick={downloadOnboardingReview}
        type="button"
      >
        Download onboarding review ({filteredAccounts.length})
      </button>
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
                    <p className="text-xs font-medium text-emerald-700">
                      {accountRelationshipLabel(account.relationshipType)}
                    </p>
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
                <div className="mt-3 rounded-lg border border-slate-200 p-3">
                  <label className="text-xs font-semibold text-slate-700">Customer relationship
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
                      onChange={(event) => {
                        setRelationshipDrafts((current) => ({
                          ...current,
                          [account.accountId]: event.target.value as NonNullable<CustomerAccountRecord['relationshipType']>,
                        }));
                        setRelationshipConfirmationId('');
                      }}
                      value={relationshipDrafts[account.accountId] ?? account.relationshipType ?? 'service_provider'}
                    >
                      <option value="owner">Direct property owner</option>
                      <option value="property_manager">Property manager</option>
                      <option value="service_provider">Service-provider partner</option>
                    </select>
                  </label>
                  {relationshipConfirmationId === account.accountId ? (
                    <div className="mt-3 rounded-lg bg-amber-50 p-3">
                      <p className="text-xs text-amber-950">
                        This changes how portal ownership and portfolio responsibility are described. Existing properties and history stay linked.
                      </p>
                      <div className="mt-3 flex justify-end gap-2">
                        <button className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" disabled={isLoading} onClick={() => setRelationshipConfirmationId('')} type="button">Keep current type</button>
                        <button className="min-h-11 rounded-lg bg-amber-800 px-3 py-2 text-sm font-bold text-white disabled:opacity-60" disabled={isLoading} onClick={() => void saveRelationship(account)} type="button">Confirm relationship change</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="mt-2 min-h-11 text-sm font-semibold text-emerald-700 disabled:text-slate-400"
                      disabled={(relationshipDrafts[account.accountId] ?? account.relationshipType ?? 'service_provider') === account.relationshipType}
                      onClick={() => setRelationshipConfirmationId(account.accountId)}
                      type="button"
                    >
                      Change relationship
                    </button>
                  )}
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
                <div className="mt-3 border-t border-slate-100 pt-3">
                  {archiveConfirmationId === account.accountId ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                      <p className="text-sm font-bold text-rose-950">Archive {account.customerName}?</p>
                      <p className="mt-1 text-xs text-rose-800">
                        The account leaves active onboarding, but its completed work and audit history are retained.
                      </p>
                      {(properties[account.accountId] ?? []).some((property) => property.status !== 'archived') ? (
                        <p className="mt-2 text-xs font-semibold text-amber-900">
                          Archive every current property before this account can be archived.
                        </p>
                      ) : null}
                      <div className="mt-3 flex justify-end gap-2">
                        <button className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" disabled={isLoading} onClick={() => setArchiveConfirmationId('')} type="button">Keep account</button>
                        <button
                          className="min-h-11 rounded-lg bg-rose-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                          disabled={isLoading || (properties[account.accountId] ?? []).some((property) => property.status !== 'archived')}
                          onClick={() => void archive(account)}
                          type="button"
                        >
                          Confirm archive
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="min-h-11 text-sm font-semibold text-rose-700" onClick={() => setArchiveConfirmationId(account.accountId)} type="button">
                      Archive account
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        {!isLoading && accounts.length > 0 && filteredAccounts.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            No accounts match this search and onboarding filter.
          </p>
        ) : null}
        {!isLoading && !accountsUnavailable && accounts.length === 0 ? <p className="text-sm text-slate-500">No customer accounts yet.</p> : null}
      </div>
      <details className="mt-4 rounded-lg border border-slate-200 px-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
          <span>Archived accounts</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{archivedAccounts.length}</span>
        </summary>
        <div className="space-y-2 border-t border-slate-100 py-3">
          {archivedAccountsUnavailable ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
              Persisted archived accounts could not be loaded. Retry after API readiness recovers.
            </p>
          ) : null}
          {archivedAccounts.map((account) => (
            <div className="rounded-lg bg-slate-50 p-3" key={account.accountId}>
              <p className="text-sm font-semibold text-slate-900">{account.customerName}</p>
              <p className="mt-1 text-xs text-slate-600">
                {account.primaryContactName || 'Contact not set'}
                {account.contactEmail ? ` · ${account.contactEmail}` : ''}
                {account.contactPhone ? ` · ${account.contactPhone}` : ''}
              </p>
              {reactivateConfirmationId === account.accountId ? (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-900">
                    Return this account to active onboarding? Archived properties remain archived.
                  </p>
                  <div className="mt-3 flex justify-end gap-2">
                    <button className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" disabled={isLoading} onClick={() => setReactivateConfirmationId('')} type="button">Keep archived</button>
                    <button className="min-h-11 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60" disabled={isLoading} onClick={() => void reactivate(account)} type="button">Confirm reactivation</button>
                  </div>
                </div>
              ) : (
                <button className="mt-2 min-h-11 text-sm font-semibold text-emerald-700" onClick={() => setReactivateConfirmationId(account.accountId)} type="button">Reactivate account</button>
              )}
            </div>
          ))}
          {!archivedAccountsUnavailable && archivedAccounts.length === 0 ? (
            <p className="text-sm text-slate-500">No archived customer accounts.</p>
          ) : null}
        </div>
      </details>
    </section>
  );
}

function CustomerAccountCreateForm({
  draft,
  disabled,
  onCancel,
  onChange,
  onCreate,
  onCreateAnyway,
  onReviewDuplicate,
  duplicateAccount,
}: {
  draft: CustomerAccountDraft;
  disabled: boolean;
  onCancel: () => void;
  onChange: (draft: CustomerAccountDraft) => void;
  onCreate: () => void;
  onCreateAnyway: () => void;
  onReviewDuplicate: () => void;
  duplicateAccount: CustomerAccountRecord | null;
}) {
  const update = <K extends keyof CustomerAccountDraft>(key: K, value: CustomerAccountDraft[K]) =>
    onChange({ ...draft, [key]: value });
  const validationError = customerAccountDraftError(draft);
  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
      <p className="text-sm font-bold text-slate-900">New customer details</p>
      <label className="text-sm font-semibold text-slate-700">Customer or company name
        <input autoFocus className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" maxLength={160} onChange={(event) => update('customerName', event.target.value)} value={draft.customerName} />
      </label>
      <label className="text-sm font-semibold text-slate-700">Primary contact
        <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" maxLength={160} onChange={(event) => update('primaryContactName', event.target.value)} value={draft.primaryContactName} />
      </label>
      <label className="text-sm font-semibold text-slate-700">Customer relationship
        <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" onChange={(event) => update('relationshipType', event.target.value as CustomerAccountDraft['relationshipType'])} value={draft.relationshipType}>
          <option value="owner">Direct property owner</option>
          <option value="property_manager">Property manager</option>
          <option value="service_provider">Service-provider partner</option>
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Contact email
          <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" maxLength={254} onChange={(event) => update('contactEmail', event.target.value)} type="email" value={draft.contactEmail} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Mobile phone
          <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" inputMode="tel" onChange={(event) => update('contactPhone', event.target.value)} placeholder="+14805550123" value={draft.contactPhone} />
        </label>
      </div>
      <fieldset className="rounded-lg border border-emerald-200 bg-white p-3">
        <legend className="px-1 text-sm font-semibold text-slate-700">Customer updates</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
          <input checked={draft.emailNotificationsEnabled} disabled={!draft.contactEmail.trim()} onChange={(event) => update('emailNotificationsEnabled', event.target.checked)} type="checkbox" />
          Customer opted into email updates
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
          <input checked={draft.smsNotificationsEnabled} disabled={!draft.contactPhone.trim()} onChange={(event) => update('smsNotificationsEnabled', event.target.checked)} type="checkbox" />
          Customer opted into SMS updates
        </label>
      </fieldset>
      {validationError ? <p className="text-xs font-medium text-amber-800">{validationError}</p> : null}
      {duplicateAccount ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3" role="alert">
          <p className="text-sm font-bold text-amber-950">Possible duplicate account</p>
          <p className="mt-1 text-xs text-amber-900">
            {duplicateAccount.customerName} already uses this customer name, email, or phone.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button className="min-h-11 rounded-lg bg-amber-900 px-3 py-2 text-sm font-bold text-white" onClick={onReviewDuplicate} type="button">Review existing account</button>
            <button className="min-h-11 rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-semibold text-amber-950" onClick={onCreateAnyway} type="button">Create separate account</button>
          </div>
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <button className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" disabled={disabled} onClick={onCancel} type="button">Cancel</button>
        <button className="min-h-11 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60" disabled={disabled || Boolean(validationError)} onClick={onCreate} type="button">Create account</button>
      </div>
    </div>
  );
}

function accountRelationshipLabel(
  relationshipType: CustomerAccountRecord['relationshipType'],
): string {
  switch (relationshipType) {
    case 'owner':
      return 'Direct property owner';
    case 'property_manager':
      return 'Property manager';
    default:
      return 'Service-provider partner';
  }
}

function relationshipFilterStorageKey(organizationId: string): string {
  return `grover.customer-account-relationship-filter.v1.${organizationId}`;
}

function loadRelationshipFilter(organizationId: string): CustomerRelationshipFilter {
  const value = window.localStorage.getItem(relationshipFilterStorageKey(organizationId));
  return value === 'owner' || value === 'property_manager' || value === 'service_provider'
    ? value
    : 'all';
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
