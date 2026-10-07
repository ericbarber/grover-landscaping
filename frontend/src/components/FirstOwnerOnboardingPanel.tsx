import { useEffect, useRef, useState } from 'react';
import { isApiErrorCode } from '../api/apiError';
import { trackMarketingEvent } from '../api/marketingAnalyticsClient';
import { APP_DISPLAY_NAME } from '../appIdentity';
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
import {
  firstOwnerNextMilestone,
  firstOwnerProgressMilestones,
  newlyCompletedCompanyFirstValueStages,
  resolveCompanySetupMembership,
  type CompanyFirstValueTarget,
} from '../domain/companyFirstValue';
import { OwnerCrewAdministrationPanel } from './OwnerCrewAdministrationPanel';
import { ProviderIdentityReadinessPanel } from './ProviderIdentityReadinessPanel';

type Props = {
  providerEntryMode?: 'owner-operator' | 'company-owner' | null;
  onOrganizationReady?: (organizationName: string, organizationId: string) => void;
  onOpenSetupStep?: (target: CompanyFirstValueTarget) => void;
  refreshSignal?: number;
  hierarchyRefreshSignal?: number;
  crewSelectionRequest?: string;
  crewBranchRequest?: string;
  crewTerritoryRequest?: string;
  crewSelectionSignal?: number;
  onCrewCreated?: (crew: CrewRecord) => void;
  onCrewChanged?: (crew: CrewRecord) => void;
  onReturnToDispatchHierarchy?: () => void;
  crewInspectionReturnLabel?: string;
  crewInspectionSummary?: string;
  crewInspectionAuditLabel?: string;
  crewInspectionAuditId?: string;
  crewInspectedDestinationBranchId?: string;
  crewInspectedDestinationTerritoryId?: string;
  onReturnFromCrewInspection?: () => void;
  onFindLatestCrewHierarchyMove?: (crew: CrewRecord) => void;
};

export function FirstOwnerOnboardingPanel({
  providerEntryMode = null,
  onOrganizationReady,
  onOpenSetupStep,
  refreshSignal = 0,
  hierarchyRefreshSignal = 0,
  crewSelectionRequest,
  crewBranchRequest,
  crewTerritoryRequest,
  crewSelectionSignal = 0,
  onCrewCreated,
  onCrewChanged,
  onReturnToDispatchHierarchy,
  crewInspectionReturnLabel,
  crewInspectionSummary,
  crewInspectionAuditLabel,
  crewInspectionAuditId,
  crewInspectedDestinationBranchId,
  crewInspectedDestinationTerritoryId,
  onReturnFromCrewInspection,
  onFindLatestCrewHierarchyMove,
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
  const [supportedServiceCategories, setSupportedServiceCategories] = useState<string[]>([]);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [crewName, setCrewName] = useState('');
  const [isCreatingCrew, setIsCreatingCrew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [setupReadsUnavailable, setSetupReadsUnavailable] = useState(false);
  const [membershipConflict, setMembershipConflict] = useState(false);
  const lastViewedStage = useRef<string | null>(null);
  const resumeTracked = useRef(false);
  const previousProgress = useRef<FirstOwnerSetupProgress | null>(null);

  function trackSetupEvent(
    eventName: 'setup_stage_viewed' | 'setup_stage_started' | 'setup_stage_completed' | 'setup_stage_failed' | 'setup_resumed',
    stage: string,
  ) {
    trackMarketingEvent(eventName, 'landscaping_company', stage);
  }

  async function refresh() {
    setIsLoading(true);
    setSetupReadsUnavailable(false);
    setMembershipConflict(false);
    try {
      const nextAccess = await fetchPrincipalAccessSummary();
      setAccess(nextAccess);
      const membershipResolution = resolveCompanySetupMembership(nextAccess);
      const nextMembership = membershipResolution.membership;
      setMembershipConflict(membershipResolution.state === 'conflict');
      if (membershipResolution.state === 'conflict') {
        setSetupProgress(null);
        previousProgress.current = null;
        setMessage('This account belongs to more than one company. Choose the company you want to manage before continuing.');
        return;
      }
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
        setSupportedServiceCategories(profile.supportedServiceCategories);
        setSupportedLanguages(profile.supportedLanguages);
        setSetupProgress(progress);
        for (const stage of newlyCompletedCompanyFirstValueStages(
          previousProgress.current,
          progress,
        )) {
          trackSetupEvent('setup_stage_completed', stage);
        }
        previousProgress.current = progress;
        const next = firstOwnerNextMilestone(progress);
        if (next && lastViewedStage.current !== next.id) {
          lastViewedStage.current = next.id;
          trackSetupEvent('setup_stage_viewed', next.id);
        }
        if (
          !resumeTracked.current
          && progress.persisted
          && progress.completedSteps > 0
          && progress.completedSteps < progress.totalSteps
        ) {
          resumeTracked.current = true;
          trackSetupEvent('setup_resumed', next?.id ?? 'first_value');
        }
      } else {
        setSetupProgress(null);
        previousProgress.current = null;
        if (lastViewedStage.current !== 'organization') {
          lastViewedStage.current = 'organization';
          trackSetupEvent('setup_stage_viewed', 'organization');
        }
      }
      setMessage(null);
    } catch (error) {
      if (
        isApiErrorCode(error, 'principal_access_unavailable')
        ||
        isApiErrorCode(error, 'organization_profile_unavailable')
        || isApiErrorCode(error, 'organization_setup_progress_unavailable')
      ) {
        setSetupProgress(null);
        setSetupReadsUnavailable(true);
        setMessage('We couldn’t load your company access or setup progress. Wait a moment, then try again.');
      } else {
        setMessage('Your access summary could not be loaded. Check authentication and try again.');
      }
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
      setMessage('Enter a company name with at least two characters.');
      return;
    }
    setIsLoading(true);
    trackSetupEvent('setup_stage_started', 'organization');
    try {
      const result = await bootstrapOrganization(displayName, organizationType);
      trackSetupEvent('setup_stage_completed', 'organization');
      setMessage(`${result.displayName} is ready. You have owner access.`);
      onOrganizationReady?.(result.displayName, result.organizationId);
      await refresh();
    } catch (error) {
      trackSetupEvent('setup_stage_failed', 'organization');
      if (isApiErrorCode(error, 'organization_bootstrap_not_available')) {
        setMessage('This account already belongs to a company. Refresh access or use the invitation link instead of creating another company.');
        await refresh();
      } else if (isApiErrorCode(error, 'organization_bootstrap_unavailable')) {
        setMessage('Company setup is temporarily unavailable. Nothing was created.');
      } else {
        setMessage('We couldn’t create the company. Confirm this account has owner access and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function saveOrganizationProfile() {
    const displayName = organizationName.trim();
    if (displayName.length < 2 || !membership) {
      setMessage('Enter a company name with at least two characters.');
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
    trackSetupEvent('setup_stage_started', 'organization_profile');
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
        supportedServiceCategories,
        supportedLanguages,
      );
      setMessage(`${profile.displayName} profile saved.`);
      setIsEditingProfile(false);
      onOrganizationReady?.(profile.displayName, profile.id);
      await refresh();
    } catch (error) {
      trackSetupEvent('setup_stage_failed', 'organization_profile');
      if (isApiErrorCode(error, 'organization_profile_update_unavailable')) {
        setMessage('We couldn’t save the company profile. No changes were made.');
      } else {
        setMessage('We couldn’t save the company profile. Confirm owner access and try again.');
      }
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
    trackSetupEvent('setup_stage_started', 'first_crew');
    try {
      const crew = await createOrganizationCrew(membership.organizationId, name);
      onCrewCreated?.(crew);
      setCrewName('');
      setMessage(`${crew.name} created${crew.persisted ? '' : ' in local demo mode'}.`);
      await refresh();
    } catch (error) {
      trackSetupEvent('setup_stage_failed', 'first_crew');
      setMessage(
        isApiErrorCode(error, 'crew_creation_unavailable')
          ? 'Crew setup is temporarily unavailable. No new crew was created.'
          : 'The crew could not be created. Use a unique name and try again.',
      );
    } finally {
      setIsCreatingCrew(false);
    }
  }

  const membershipResolution = access ? resolveCompanySetupMembership(access) : null;
  const membership = membershipResolution?.membership ?? undefined;
  const ownerClaim = access?.claimRoles.includes('OrganizationOwner')
    || access?.claimRoles.includes('SupportAdmin');
  const nextMilestone = setupProgress ? firstOwnerNextMilestone(setupProgress) : null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {providerEntryMode ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4" role="note">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Provider entry path</p>
          <h2 className="mt-2 text-lg font-black text-emerald-950">
            {providerEntryMode === 'owner-operator' ? 'Owner-operator setup' : 'Company-owner setup'}
          </h2>
          <p className="mt-1 text-sm leading-6 text-emerald-900">
            {providerEntryMode === 'owner-operator'
              ? `${APP_DISPLAY_NAME} sets up one company account for you, even if you also do field work. Every crew, customer, and property remains protected inside that company.`
              : 'Create or continue one landscaping company, then invite each teammate with the access their role needs.'}
          </p>
          <p className="mt-2 text-xs font-bold text-emerald-800">We’ll confirm your signed-in account and active company access before allowing changes.</p>
        </div>
      ) : null}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">First-user setup</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            {setupReadsUnavailable
              ? 'Company setup unavailable'
              : membership
                ? `Welcome, ${membership.organizationName}`
                : 'Create your company'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {setupReadsUnavailable
              ? 'We couldn’t load your company access. Setup actions stay hidden until it can be checked again.'
              : membership
              ? 'Your owner access is active. Follow these steps to prepare your first route and customer-ready service report.'
              : 'Create your company account first. Crews, customers, and properties will be kept within it.'}
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
      {setupReadsUnavailable ? (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
          We couldn’t load your saved company profile or setup progress. To protect your work, {APP_DISPLAY_NAME} won’t guess which steps are complete.
        </p>
      ) : null}
      {membershipConflict ? (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
          This account belongs to more than one company. Choose a company before continuing so the wrong one is not updated.
        </p>
      ) : null}

      {!isLoading && access && !membership && !membershipConflict ? (
        ownerClaim ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Company name
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Desert Bloom Landscaping"
                value={organizationName}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Business type
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
              Create company and continue
            </button>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            This account is signed in, but it does not have owner access to create a company. Ask an administrator for an owner invitation.
          </p>
        )
      ) : null}

      {membership ? (
        <>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <p className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
              Your role: {membership.role === 'OrganizationOwner' ? 'Company owner' : membership.role.replace(/([A-Z])/g, ' $1').trim()}
            </p>
            <p className="rounded-lg bg-slate-50 p-3 text-slate-700">
              Access: {membership.scopeType === 'organization' ? 'Entire company' : membership.scopeType}
            </p>
          </div>
          <ProviderIdentityReadinessPanel
            contactEmail={contactEmail}
            contactPhone={contactPhone}
            defaultDailyStopCapacity={defaultDailyStopCapacity}
            displayName={organizationName}
            onEditProfile={() => setIsEditingProfile(true)}
            serviceAreaLabel={serviceAreaLabel}
            setupProgress={setupProgress}
            supportedLanguages={supportedLanguages}
            supportedServiceCategories={supportedServiceCategories}
            timeZone={timeZone}
            websiteUrl={websiteUrl}
          />
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-950">Company profile</h3>
                <p className="text-xs text-slate-500">Details customers and crews will rely on</p>
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
                  Company name
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
                  Business type
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
                <fieldset className="rounded-xl border border-slate-200 p-3 sm:col-span-2">
                  <legend className="px-1 text-sm font-bold text-slate-800">Services currently offered</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {[
                      ['routine_maintenance', 'Routine maintenance'],
                      ['seasonal_cleanup', 'Seasonal cleanup'],
                      ['turf_care', 'Turf care'],
                      ['shrub_care', 'Shrub care'],
                      ['irrigation_checks', 'Irrigation checks'],
                      ['desert_landscape_care', 'Desert landscape care'],
                    ].map(([value, label]) => <label className="flex min-h-11 items-center gap-3 rounded-lg bg-slate-50 px-3 text-sm font-semibold" key={value}><input checked={supportedServiceCategories.includes(value)} onChange={(event) => setSupportedServiceCategories((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} type="checkbox" />{label}</label>)}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">These are details you provide about your company. They are not {APP_DISPLAY_NAME} verification, ranking, or credential approval.</p>
                </fieldset>
                <fieldset className="rounded-xl border border-slate-200 p-3 sm:col-span-2">
                  <legend className="px-1 text-sm font-bold text-slate-800">Customer communication languages</legend>
                  <div className="mt-2 flex flex-wrap gap-3">{[['en', 'English'], ['es', 'Spanish']].map(([value, label]) => <label className="flex min-h-11 items-center gap-3 rounded-lg bg-slate-50 px-3 text-sm font-semibold" key={value}><input checked={supportedLanguages.includes(value)} onChange={(event) => setSupportedLanguages((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} type="checkbox" />{label}</label>)}</div>
                </fieldset>
                <button
                  className="min-h-11 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                  disabled={isLoading}
                  onClick={() => void saveOrganizationProfile()}
                  type="button"
                >
                  {isLoading ? 'Saving…' : 'Save company profile'}
                </button>
              </div>
            ) : null}
          </div>
          {setupProgress ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">Launch progress</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {setupProgress.completedSteps} of {setupProgress.totalSteps} setup steps complete
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
                  <li className="flex min-h-11 items-start gap-3 rounded-lg bg-white px-3 py-3 text-sm" key={milestone.id}>
                    <span aria-hidden="true" className={milestone.complete ? 'text-emerald-700' : 'text-slate-400'}>
                      {milestone.complete ? '✓' : '○'}
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-slate-800">{milestone.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {milestone.complete ? milestone.unlockedOutcome : milestone.detail}
                      </span>
                    </span>
                    {!milestone.complete && milestone.target ? (
                      <button
                        className="min-h-11 rounded-lg px-3 font-semibold text-emerald-700 hover:bg-emerald-50"
                        onClick={() => onOpenSetupStep?.(milestone.target!)}
                        type="button"
                      >
                        Open
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {!setupProgress.persisted ? (
                <p className="mt-3 text-xs font-medium text-amber-700">This demo saves progress on this device only.</p>
              ) : null}
              {nextMilestone ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Next step</p>
                  <p className="mt-1 font-semibold text-slate-950">{nextMilestone.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{nextMilestone.detail}</p>
                  <p className="mt-2 text-xs font-semibold text-emerald-800">This unlocks: {nextMilestone.unlockedOutcome}</p>
                  <button
                    className="mt-3 min-h-11 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
                    onClick={() => {
                      if (nextMilestone.target) {
                        trackSetupEvent('setup_stage_started', nextMilestone.id);
                        onOpenSetupStep?.(nextMilestone.target);
                      } else if (nextMilestone.id === 'first_crew') {
                        trackSetupEvent('setup_stage_started', nextMilestone.id);
                        document.getElementById('first-owner-crew-setup')?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        });
                      } else {
                        trackSetupEvent('setup_stage_started', nextMilestone.id);
                        setIsEditingProfile(true);
                      }
                    }}
                    type="button"
                  >
                    Continue: {nextMilestone.label}
                  </button>
                </div>
              ) : (
                <p className="mt-4 rounded-lg bg-emerald-100 px-3 py-3 text-sm font-semibold text-emerald-900">
                  Your first service cycle is complete. The work was finished, reviewed, and delivered to the customer.
                </p>
              )}
            </div>
          ) : null}
          {setupProgress && !setupProgress.crewConfigured ? (
            <div className="mt-4 scroll-mt-20 rounded-xl border border-slate-200 p-4" id="first-owner-crew-setup">
              <h3 className="font-bold text-slate-950">Create the first crew</h3>
              <p className="mt-1 text-xs text-slate-600">Crews belong to this company and can be assigned to properties and routes.</p>
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
              inspectionReturnLabel={crewInspectionReturnLabel}
              inspectionSummary={crewInspectionSummary}
              inspectionAuditLabel={crewInspectionAuditLabel}
              inspectionAuditId={crewInspectionAuditId}
              inspectedDestinationBranchId={crewInspectedDestinationBranchId}
              inspectedDestinationTerritoryId={crewInspectedDestinationTerritoryId}
              onReturnFromInspection={onReturnFromCrewInspection}
              onFindLatestHierarchyMove={onFindLatestCrewHierarchyMove}
              onReturnToHierarchy={onReturnToDispatchHierarchy}
              requestedBranchId={crewBranchRequest}
              requestedCrewId={crewSelectionRequest}
              requestedTerritoryId={crewTerritoryRequest}
              refreshSignal={refreshSignal + hierarchyRefreshSignal}
              selectionSignal={crewSelectionSignal}
            />
          ) : null}
          {setupProgress && !setupProgress.teamInvitationCreated ? (
            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Optional team setup</p>
              <h3 className="mt-1 font-bold text-slate-950">Invite an additional team member</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">Owner-operators can finish setup without inviting anyone. Growing teams can invite each person with the access their role needs.</p>
              <button className="mt-3 min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-emerald-800" onClick={() => onOpenSetupStep?.('team-invitations')} type="button">Open team invitations</button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
