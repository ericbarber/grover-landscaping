import { useEffect, useState } from 'react';
import {
  bootstrapOrganization,
  fetchPrincipalAccessSummary,
  type PrincipalAccessSummary,
} from '../api/client';

type Props = {
  onOrganizationReady?: (organizationName: string) => void;
};

export function firstOwnerSetupSteps(access: PrincipalAccessSummary): string[] {
  if (access.memberships.length === 0) return ['Create your organization'];
  return [
    'Confirm organization and owner access',
    'Complete the first property profile',
    'Configure the first crew',
    'Publish the first day plan',
    'Invite additional team members',
  ];
}

export function FirstOwnerOnboardingPanel({ onOrganizationReady }: Props) {
  const [access, setAccess] = useState<PrincipalAccessSummary | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState<
    'yard_care_company' | 'property_management_company'
  >('yard_care_company');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    try {
      setAccess(await fetchPrincipalAccessSummary());
      setMessage(null);
    } catch {
      setMessage('Your access summary could not be loaded. Check authentication and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function createOrganization() {
    const displayName = organizationName.trim();
    if (displayName.length < 2) {
      setMessage('Enter an organization name with at least two characters.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await bootstrapOrganization(displayName, organizationType);
      setMessage(`${result.displayName} is ready. You are the organization owner.`);
      onOrganizationReady?.(result.displayName);
      setAccess(await fetchPrincipalAccessSummary());
    } catch {
      setMessage('The organization could not be created. Confirm owner access and database availability.');
    } finally {
      setIsLoading(false);
    }
  }

  const membership = access?.memberships[0];
  const ownerClaim = access?.claimRoles.includes('OrganizationOwner')
    || access?.claimRoles.includes('SupportAdmin');

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">First-user setup</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            {membership ? `Welcome, ${membership.organizationName}` : 'Create your organization'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {membership
              ? 'Your owner membership is active. Use this checklist to prepare the first live route.'
              : 'The first signed-in organization owner creates the tenant boundary for all future crews, customers, and properties.'}
          </p>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void refresh()}
          type="button"
        >
          {isLoading ? 'Checking…' : 'Refresh access'}
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700" role="status">
          {message}
        </p>
      ) : null}

      {!isLoading && access && !membership ? (
        ownerClaim ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Organization name
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Grover Landscaping"
                value={organizationName}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Organization type
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                onChange={(event) => setOrganizationType(event.target.value as typeof organizationType)}
                value={organizationType}
              >
                <option value="yard_care_company">Yard-care company</option>
                <option value="property_management_company">Property management company</option>
              </select>
            </label>
            <button
              className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 sm:col-span-2"
              disabled={isLoading}
              onClick={() => void createOrganization()}
              type="button"
            >
              Create organization and owner membership
            </button>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Your identity is authenticated but does not have the OrganizationOwner claim required for first-user setup.
          </p>
        )
      ) : null}

      {membership ? (
        <>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <p className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
              Role: {membership.role.replace(/([A-Z])/g, ' $1').trim()}
            </p>
            <p className="rounded-lg bg-slate-50 p-3 text-slate-700">
              Access scope: {membership.scopeType}
            </p>
          </div>
          <ol className="mt-4 space-y-2">
            {firstOwnerSetupSteps(access).map((step, index) => (
              <li className="flex gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700" key={step}>
                <span className="font-bold text-slate-950">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </section>
  );
}
