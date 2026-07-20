import { useEffect, useState } from 'react';
import {
  bootstrapOrganization,
  createOrganizationCrew,
  fetchFirstOwnerSetupProgress,
  fetchOrganizationProfile,
  fetchPrincipalAccessSummary,
  updateOrganizationProfile,
  type PrincipalAccessSummary,
  type FirstOwnerSetupProgress,
  type CrewRecord,
} from '../api/client';
import { OwnerCrewAdministrationPanel } from './OwnerCrewAdministrationPanel';

type Props = {
  onOrganizationReady?: (organizationName: string, organizationId: string) => void;
  onOpenSetupStep?: (target: FirstOwnerSetupTarget) => void;
  refreshSignal?: number;
  hierarchyRefreshSignal?: number;
  crewSelectionRequest?: string;
  crewSelectionSignal?: number;
  onCrewCreated?: (crew: CrewRecord) => void;
  onCrewChanged?: (crew: CrewRecord) => void;
};

export type FirstOwnerSetupTarget =
  | 'operational-profile'
  | 'service-setup'
  | 'day-plan'
  | 'team-invitations';

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

export function firstOwnerSetupTarget(step: string): FirstOwnerSetupTarget | null {
  switch (step) {
    case 'Complete the first property profile':
      return 'operational-profile';
    case 'Configure the first crew':
      return 'service-setup';
    case 'Publish the first day plan':
      return 'day-plan';
    case 'Invite additional team members':
      return 'team-invitations';
    default:
      return null;
  }
}

export function firstOwnerProgressMilestones(progress: FirstOwnerSetupProgress) {
  return [
    { label: 'Complete organization profile', complete: progress.organizationProfileComplete, target: null },
    { label: 'Configure the first crew', complete: progress.crewConfigured, target: null },
    { label: 'Publish the first route', complete: progress.firstRoutePublished, target: 'day-plan' as const },
    { label: 'Invite a team member', complete: progress.teamInvitationCreated, target: 'team-invitations' as const },
  ];
}

export function firstOwnerNextMilestone(progress: FirstOwnerSetupProgress) {
  return firstOwnerProgressMilestones(progress).find((milestone) => !milestone.complete) ?? null;
}

export function FirstOwnerOnboardingPanel({
  onOrganizationReady,
  onOpenSetupStep,
  refreshSignal = 0,
  hierarchyRefreshSignal = 0,
  crewSelectionRequest,
  crewSelectionSignal = 0,
  onCrewCreated,
  onCrewChanged,
}: Props) {
  const [access, setAccess] = useState<PrincipalAccessSummary | null>(null);
  const [setupProgress, setSetupProgress] = useState<FirstOwnerSetupProgress | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState<
    'yard_care_company' | 'property_management_company'
  >('yard_care_company');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [timeZone, setTimeZone] = useState('America/Phoenix');
  const [serviceAreaLabel, setServiceAreaLabel] = useState('');
  const [defaultDailyStopCapacity, setDefaultDailyStopCapacity] = useState(12);
  const [crewName, setCrewName] = useState('');
  const [isCreatingCrew, setIsCreatingCrew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    try {
      const nextAccess = await fetchPrincipalAccessSummary();
      setAccess(nextAccess);
      const nextMembership = nextAccess.memberships[0];
      if (nextMembership) {
        const [profile, progress] = await Promise.all([
          fetchOrganizationProfile(nextMembership.organizationId),
          fetchFirstOwnerSetupProgress(nextMembership.organizationId),
        ]);
        setOrganizationName(profile.displayName);
        setOrganizationType(profile.organizationType);
        setContactEmail(profile.contactEmail);
        setContactPhone(profile.contactPhone);
        setWebsiteUrl(profile.websiteUrl);
        setTimeZone(profile.timeZone);
        setServiceAreaLabel(profile.serviceAreaLabel);
        setDefaultDailyStopCapacity(profile.defaultDailyStopCapacity);
        setSetupProgress(progress);
      } else {
        setSetupProgress(null);
      }
      setMessage(null);
    } catch {
      setMessage('Your access summary could not be loaded. Check authentication and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [refreshSignal]);

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
      onOrganizationReady?.(result.displayName, result.organizationId);
      await refresh();
    } catch {
      setMessage('The organization could not be created. Confirm owner access and database availability.');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveOrganizationProfile() {
    const displayName = organizationName.trim();
    if (displayName.length < 2 || !membership) {
      setMessage('Enter an organization name with at least two characters.');
      return;
    }
    if (
      !Number.isInteger(defaultDailyStopCapacity)
      || defaultDailyStopCapacity < 1
      || defaultDailyStopCapacity > 100
    ) {
      setMessage('Daily stop capacity must be a whole number from 1 to 100.');
      return;
    }
    setIsLoading(true);
    try {
      const profile = await updateOrganizationProfile(
        membership.organizationId,
        displayName,
        organizationType,
        contactEmail.trim(),
        contactPhone.trim(),
        websiteUrl.trim(),
        timeZone,
        serviceAreaLabel.trim(),
        defaultDailyStopCapacity,
      );
      setMessage(`${profile.displayName} profile saved.`);
      setIsEditingProfile(false);
      onOrganizationReady?.(profile.displayName, profile.id);
      await refresh();
    } catch {
      setMessage('The organization profile could not be saved. Confirm owner access and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function createFirstCrew() {
    const name = crewName.trim();
    if (!membership || name.length < 2 || name.length > 120) {
      setMessage('Enter a crew name from 2 to 120 characters.');
      return;
    }
    setIsCreatingCrew(true);
    try {
      const crew = await createOrganizationCrew(membership.organizationId, name);
      onCrewCreated?.(crew);
      setCrewName('');
      setMessage(`${crew.name} created${crew.persisted ? '' : ' in local demo mode'}.`);
      await refresh();
    } catch {
      setMessage('The crew could not be created. Use a unique name and try again.');
    } finally {
      setIsCreatingCrew(false);
    }
  }

  const membership = access?.memberships[0];
  const ownerClaim = access?.claimRoles.includes('OrganizationOwner')
    || access?.claimRoles.includes('SupportAdmin');
  const nextMilestone = setupProgress ? firstOwnerNextMilestone(setupProgress) : null;

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
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-950">Organization profile</h3>
                <p className="text-xs text-slate-500">Owner-managed company identity</p>
              </div>
              <button
                className="min-h-11 rounded-lg border border-slate-300 px-3 text-xs font-semibold"
                onClick={() => setIsEditingProfile((current) => !current)}
                type="button"
              >
                {isEditingProfile ? 'Cancel edit' : 'Edit profile'}
              </button>
            </div>
            {isEditingProfile ? (
              <div className="mt-3 grid gap-3">
                <label className="text-sm font-semibold text-slate-700">
                  Organization name
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                    onChange={(event) => setOrganizationName(event.target.value)}
                    value={organizationName}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Contact email
                  <input
                    autoComplete="email"
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                    inputMode="email"
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="office@example.com"
                    type="email"
                    value={contactEmail}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Contact phone
                  <input
                    autoComplete="tel"
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                    inputMode="tel"
                    onChange={(event) => setContactPhone(event.target.value)}
                    placeholder="(602) 555-0142"
                    type="tel"
                    value={contactPhone}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Website
                  <input
                    autoComplete="url"
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                    inputMode="url"
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    placeholder="https://example.com"
                    type="url"
                    value={websiteUrl}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Organization type
                  <select
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                    onChange={(event) => setOrganizationType(event.target.value as typeof organizationType)}
                    value={organizationType}
                  >
                    <option value="yard_care_company">Yard-care company</option>
                    <option value="property_management_company">Property management company</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Operating timezone
                  <select
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                    onChange={(event) => setTimeZone(event.target.value)}
                    value={timeZone}
                  >
                    <option value="America/Phoenix">Arizona</option>
                    <option value="America/Los_Angeles">Pacific</option>
                    <option value="America/Denver">Mountain</option>
                    <option value="America/Chicago">Central</option>
                    <option value="America/New_York">Eastern</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Default service area
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                    onChange={(event) => setServiceAreaLabel(event.target.value)}
                    placeholder="Phoenix metro"
                    value={serviceAreaLabel}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Daily stop capacity
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                    inputMode="numeric"
                    max={100}
                    min={1}
                    onChange={(event) => setDefaultDailyStopCapacity(Number(event.target.value))}
                    type="number"
                    value={defaultDailyStopCapacity}
                  />
                </label>
                <button
                  className="min-h-11 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                  disabled={isLoading}
                  onClick={() => void saveOrganizationProfile()}
                  type="button"
                >
                  {isLoading ? 'Saving…' : 'Save organization profile'}
                </button>
              </div>
            ) : null}
          </div>
          {setupProgress ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">Setup progress</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {setupProgress.completedSteps} of {setupProgress.totalSteps} launch steps complete
                  </p>
                </div>
                <span className="text-lg font-bold text-slate-950">
                  {Math.round((setupProgress.completedSteps / setupProgress.totalSteps) * 100)}%
                </span>
              </div>
              <div
                aria-label={`${setupProgress.completedSteps} of ${setupProgress.totalSteps} setup steps complete`}
                className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuemax={setupProgress.totalSteps}
                aria-valuemin={0}
                aria-valuenow={setupProgress.completedSteps}
              >
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${(setupProgress.completedSteps / setupProgress.totalSteps) * 100}%` }}
                />
              </div>
              <ul className="mt-3 space-y-2">
                {firstOwnerProgressMilestones(setupProgress).map((milestone) => (
                  <li className="flex min-h-11 items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm" key={milestone.label}>
                    <span aria-hidden="true" className={milestone.complete ? 'text-emerald-700' : 'text-slate-400'}>
                      {milestone.complete ? '✓' : '○'}
                    </span>
                    <span className="flex-1 font-medium text-slate-800">{milestone.label}</span>
                    {!milestone.complete && milestone.target ? (
                      <button
                        className="min-h-11 rounded-lg px-3 font-semibold text-emerald-700 hover:bg-emerald-50"
                        onClick={() => onOpenSetupStep?.(milestone.target)}
                        type="button"
                      >
                        Open
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {!setupProgress.persisted ? (
                <p className="mt-3 text-xs font-medium text-amber-700">Demo progress is local until database persistence is available.</p>
              ) : null}
              {nextMilestone ? (
                <button
                  className="mt-4 min-h-11 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
                  onClick={() => {
                    if (nextMilestone.target) {
                      onOpenSetupStep?.(nextMilestone.target);
                    } else if (nextMilestone.label === 'Configure the first crew') {
                      document.getElementById('first-owner-crew-setup')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                      });
                    } else {
                      setIsEditingProfile(true);
                    }
                  }}
                  type="button"
                >
                  Next: {nextMilestone.label}
                </button>
              ) : (
                <p className="mt-4 rounded-lg bg-emerald-100 px-3 py-3 text-sm font-semibold text-emerald-900">
                  Launch setup is complete. Refresh after future changes to keep this status current.
                </p>
              )}
            </div>
          ) : null}
          {setupProgress && !setupProgress.crewConfigured ? (
            <div className="mt-4 scroll-mt-20 rounded-xl border border-slate-200 p-4" id="first-owner-crew-setup">
              <h3 className="font-bold text-slate-950">Create the first crew</h3>
              <p className="mt-1 text-xs text-slate-600">Crews stay inside this organization and become available for properties and day plans.</p>
              <label className="mt-3 block text-sm font-semibold text-slate-700">
                Crew name
                <input
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                  maxLength={120}
                  onChange={(event) => setCrewName(event.target.value)}
                  placeholder="North Route Crew"
                  value={crewName}
                />
              </label>
              <button
                className="mt-3 min-h-11 w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
                disabled={isCreatingCrew}
                onClick={() => void createFirstCrew()}
                type="button"
              >
                {isCreatingCrew ? 'Creating crew…' : 'Create crew'}
              </button>
            </div>
          ) : null}
          {membership && setupProgress?.crewConfigured ? (
            <OwnerCrewAdministrationPanel
              organizationId={membership.organizationId}
              onCrewChanged={onCrewChanged}
              requestedCrewId={crewSelectionRequest}
              refreshSignal={refreshSignal + hierarchyRefreshSignal}
              selectionSignal={crewSelectionSignal}
            />
          ) : null}
          <ol className="mt-4 space-y-2">
            {firstOwnerSetupSteps(access).map((step, index) => {
              const target = firstOwnerSetupTarget(step);
              return (
              <li className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700" key={step}>
                <span className="font-bold text-slate-950">{index + 1}</span>
                <span className="flex-1">{step}</span>
                {target ? (
                  <button
                    aria-label={`Open ${step.toLowerCase()}`}
                    className="min-h-11 rounded-lg px-3 font-semibold text-emerald-700 hover:bg-emerald-50"
                    onClick={() => onOpenSetupStep?.(target)}
                    type="button"
                  >
                    Open <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <span className="font-semibold text-emerald-700">Ready</span>
                )}
              </li>
              );
            })}
          </ol>
        </>
      ) : null}
    </section>
  );
}
