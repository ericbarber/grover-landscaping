import { useEffect, useMemo, useState } from 'react';
import {
  addPropertyToPortfolio,
  assignPropertyCrew,
  createPropertyPortfolio,
  fetchCrews,
  fetchCustomerPropertyActivationReadiness,
  fetchCustomerPropertyPortfolio,
  fetchPropertyCrewAssignments,
  updateCustomerPropertyIdentity,
  updateCustomerPropertyStatus,
  type CrewRecord,
  type CustomerPropertyActivationReadiness,
  type CustomerPropertyRecord,
  type PropertyCrewAssignmentRecord,
  type PropertyPortfolioRecord,
} from '../api/client';
import { getPropertyActivationReadiness } from '../domain/propertyActivation';

type Props = {
  properties: CustomerPropertyRecord[];
  onPropertyUpdated?: (property: CustomerPropertyRecord) => void;
  onboardingRefreshSignal?: number;
  onSetupChanged?: () => void;
  requestedPropertyId?: string;
};

export function ManagerPropertySetupPanel({
  properties,
  onPropertyUpdated,
  onboardingRefreshSignal = 0,
  onSetupChanged,
  requestedPropertyId,
}: Props) {
  const [propertyId, setPropertyId] = useState(properties[0]?.propertyId ?? '');
  const [crews, setCrews] = useState<CrewRecord[]>([]);
  const [portfolios, setPortfolios] = useState<Record<string, PropertyPortfolioRecord[]>>({});
  const [portfolioMemberships, setPortfolioMemberships] = useState<Record<string, string>>({});
  const [assignments, setAssignments] = useState<Record<string, PropertyCrewAssignmentRecord[]>>({});
  const [activationReadinessByProperty, setActivationReadinessByProperty] = useState<
    Record<string, CustomerPropertyActivationReadiness>
  >({});
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioType, setPortfolioType] = useState<PropertyPortfolioRecord['portfolioType']>('individual_owner');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioSetupAvailable, setPortfolioSetupAvailable] = useState(true);
  const [crewSetupAvailable, setCrewSetupAvailable] = useState(true);
  const [activationReadinessAvailable, setActivationReadinessAvailable] = useState(true);
  const [message, setMessage] = useState('Choose a property to finish service setup.');
  const [pendingLifecycleStatus, setPendingLifecycleStatus] = useState<'onboarding' | 'active' | 'archived' | null>(null);
  const [identityName, setIdentityName] = useState('');
  const [identityAddress, setIdentityAddress] = useState('');
  const selectedProperty = properties.find((property) => property.propertyId === propertyId);
  const accountPortfolios = selectedProperty ? portfolios[selectedProperty.accountId] ?? [] : [];
  const eligibleCrews = useMemo(
    () => crews.filter((crew) => crew.organizationId === selectedProperty?.organizationId),
    [crews, selectedProperty?.organizationId],
  );
  const activeAssignment = (assignments[propertyId] ?? []).find((assignment) => assignment.active);
  const serverReadiness = activationReadinessByProperty[propertyId];
  const activationReadiness = getPropertyActivationReadiness(
    serverReadiness?.profileReady ?? false,
    serverReadiness?.crewReady ?? Boolean(activeAssignment),
  );
  const currentPortfolio = accountPortfolios.find(
    (portfolio) => portfolio.id === portfolioMemberships[propertyId],
  );

  useEffect(() => {
    if (!properties.some((property) => property.propertyId === propertyId)) {
      setPropertyId(properties[0]?.propertyId ?? '');
    }
  }, [properties, propertyId]);

  useEffect(() => {
    if (
      requestedPropertyId
      && properties.some((property) => property.propertyId === requestedPropertyId)
    ) {
      setPropertyId(requestedPropertyId);
    }
  }, [properties, requestedPropertyId]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    Promise.allSettled([
      Promise.all([
        fetchCrews(),
        Promise.all(properties.map(async (property) => [
          property.propertyId,
          await fetchPropertyCrewAssignments(property.propertyId),
        ] as const)),
      ]),
      Promise.all(
        Array.from(new Set(properties.map((property) => property.accountId))).map(
          (accountId) => fetchCustomerPropertyPortfolio(accountId),
        ),
      ),
      Promise.all(properties.map(async (property) => [
        property.propertyId,
        await fetchCustomerPropertyActivationReadiness(
          property.accountId,
          property.propertyId,
        ),
      ] as const)),
    ])
      .then(([crewResult, portfolioResult, readinessResult]) => {
        if (!active) return;
        const crewAvailable = crewResult.status === 'fulfilled';
        const portfolioAvailable = portfolioResult.status === 'fulfilled';
        const readinessAvailable = readinessResult.status === 'fulfilled';
        setCrewSetupAvailable(crewAvailable);
        setPortfolioSetupAvailable(portfolioAvailable);
        setActivationReadinessAvailable(readinessAvailable);
        if (crewAvailable) {
          setCrews(crewResult.value[0]);
          setAssignments(Object.fromEntries(crewResult.value[1]));
        }
        if (portfolioAvailable) {
          setPortfolios(Object.fromEntries(
            portfolioResult.value.map((account) => [account.accountId, account.portfolios]),
          ));
          setPortfolioMemberships(Object.fromEntries(
            portfolioResult.value.flatMap((account) => account.portfolios.flatMap(
              (portfolio) => portfolio.properties.map((property) => [property.id, portfolio.id]),
            )),
          ));
        }
        if (readinessResult.status === 'fulfilled') {
          setActivationReadinessByProperty(Object.fromEntries(readinessResult.value));
        }
        setMessage(
          crewAvailable && portfolioAvailable
            ? 'Loaded persisted portfolio and crew setup.'
            : 'Loaded the property setup tools available to your role.',
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [properties, onboardingRefreshSignal]);

  useEffect(() => {
    setSelectedPortfolioId(accountPortfolios[0]?.id ?? '');
    setSelectedCrewId(eligibleCrews[0]?.id ?? '');
    setPendingLifecycleStatus(null);
  }, [propertyId, accountPortfolios[0]?.id, eligibleCrews[0]?.id]);

  useEffect(() => {
    setIdentityName(selectedProperty?.displayName ?? '');
    setIdentityAddress(selectedProperty?.serviceAddress ?? '');
  }, [selectedProperty?.propertyId, selectedProperty?.displayName, selectedProperty?.serviceAddress]);

  async function savePropertyIdentity() {
    if (!selectedProperty) return;
    if (identityName.trim().length < 2 || identityAddress.trim().length < 5) {
      setMessage('Enter a property name and complete service address.');
      return;
    }
    setIsLoading(true);
    try {
      const property = await updateCustomerPropertyIdentity(
        selectedProperty.accountId,
        selectedProperty.propertyId,
        {
          displayName: identityName.trim(),
          serviceAddress: identityAddress.trim(),
        },
      );
      onPropertyUpdated?.(property);
      onSetupChanged?.();
      setMessage(`${property.displayName} identity updated.`);
    } catch {
      setMessage('The property could not be updated. Check for a duplicate name and address.');
    } finally {
      setIsLoading(false);
    }
  }

  async function changePropertyStatus(status: 'onboarding' | 'active' | 'archived') {
    if (!selectedProperty) return;
    if (pendingLifecycleStatus !== status) {
      setPendingLifecycleStatus(status);
      setMessage(
        status === 'archived'
          ? 'Confirm archive. This will end the active crew assignment.'
          : status === 'onboarding'
            ? 'Confirm reactivation. A new crew assignment will still be required.'
            : 'Confirm activation after the operational profile and crew assignment are ready.',
      );
      return;
    }
    setIsLoading(true);
    try {
      const property = await updateCustomerPropertyStatus(
        selectedProperty.accountId,
        selectedProperty.propertyId,
        status,
      );
      onPropertyUpdated?.(property);
      if (status === 'archived') {
        setAssignments((current) => ({
          ...current,
          [property.propertyId]: (current[property.propertyId] ?? []).map(
            (assignment) => ({ ...assignment, active: false }),
          ),
        }));
      }
      setMessage(
        status === 'archived'
          ? `${property.displayName} archived and removed from active crew service.`
          : status === 'onboarding'
            ? `${property.displayName} returned to onboarding for service setup.`
            : `${property.displayName} activated for service.`,
      );
      setPendingLifecycleStatus(null);
    } catch {
      setMessage(
        status === 'active'
          ? 'Finish the active operational profile and assign a crew before activation.'
          : 'The property status could not be updated.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function addPortfolio() {
    if (!selectedProperty || portfolioName.trim().length < 2) {
      setMessage('Enter a portfolio name.');
      return;
    }
    setIsLoading(true);
    try {
      const portfolio = await createPropertyPortfolio({
        accountId: selectedProperty.accountId,
        organizationId: selectedProperty.organizationId,
        displayName: portfolioName.trim(),
        portfolioType,
      });
      setPortfolios((current) => ({
        ...current,
        [selectedProperty.accountId]: [...(current[selectedProperty.accountId] ?? []), portfolio]
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      }));
      setSelectedPortfolioId(portfolio.id);
      setPortfolioName('');
      setMessage(`${portfolio.displayName} portfolio created.`);
    } catch {
      setMessage('The portfolio could not be created.');
    } finally {
      setIsLoading(false);
    }
  }

  async function groupProperty() {
    if (!selectedProperty || !selectedPortfolioId) return;
    setIsLoading(true);
    try {
      await addPropertyToPortfolio(
        selectedPortfolioId,
        selectedProperty.propertyId,
        selectedProperty.organizationId,
      );
      setPortfolioMemberships((current) => ({
        ...current,
        [selectedProperty.propertyId]: selectedPortfolioId,
      }));
      setPortfolios((current) => ({
        ...current,
        [selectedProperty.accountId]: (current[selectedProperty.accountId] ?? []).map(
          (portfolio) => ({
            ...portfolio,
            propertyCount: portfolio.id === selectedPortfolioId
              ? portfolio.propertyCount
                + (portfolioMemberships[selectedProperty.propertyId] === selectedPortfolioId ? 0 : 1)
              : portfolio.id === portfolioMemberships[selectedProperty.propertyId]
                ? Math.max(0, portfolio.propertyCount - 1)
                : portfolio.propertyCount,
          }),
        ),
      }));
      setMessage(`${selectedProperty.displayName} grouped into the selected portfolio.`);
    } catch {
      setMessage('The property could not be grouped into that portfolio.');
    } finally {
      setIsLoading(false);
    }
  }

  async function assignCrew() {
    if (!selectedProperty || !selectedCrewId) return;
    setIsLoading(true);
    try {
      const assignment = await assignPropertyCrew(
        selectedProperty.propertyId,
        selectedCrewId,
        selectedProperty.organizationId,
      );
      setAssignments((current) => ({
        ...current,
        [selectedProperty.propertyId]: [
          assignment,
          ...(current[selectedProperty.propertyId] ?? []).map((item) => ({ ...item, active: false })),
        ],
      }));
      setActivationReadinessByProperty((current) => ({
        ...current,
        [selectedProperty.propertyId]: {
          propertyId: selectedProperty.propertyId,
          profileReady: current[selectedProperty.propertyId]?.profileReady ?? false,
          crewReady: true,
          ready: current[selectedProperty.propertyId]?.profileReady ?? false,
          persisted: assignment.persisted,
        },
      }));
      onSetupChanged?.();
      setMessage(`${selectedProperty.displayName} assigned to ${eligibleCrews.find((crew) => crew.id === selectedCrewId)?.name ?? selectedCrewId}.`);
    } catch {
      setMessage('The crew could not be assigned to that property.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Property setup</p>
      <h2 className="mt-1 text-xl font-bold text-slate-950">Portfolio and crew</h2>
      <p className="mt-2 text-sm text-slate-600">
        Grouping controls the customer view. Crew assignment controls who services the yard.
      </p>
      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Property
        <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
          {properties.map((property) => <option key={property.propertyId} value={property.propertyId}>{property.displayName}</option>)}
        </select>
      </label>
      <p className="mt-2 text-xs text-slate-500" role="status">{isLoading ? 'Working…' : message}</p>
      {!activationReadinessAvailable ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
          Persisted property activation readiness could not be loaded. Activation controls remain blocked until API readiness recovers.
        </p>
      ) : null}

      {selectedProperty ? (
        <>
          <div className="mt-4 rounded-xl border border-slate-200 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Property lifecycle</p>
                <p className="mt-1 text-xs text-slate-500">
                  Status: <span className="font-semibold capitalize">{selectedProperty.status}</span>
                </p>
                {selectedProperty.status !== 'active' && selectedProperty.status !== 'archived' ? (
                  <ul className="mt-2 grid gap-1 text-xs text-slate-600">
                    <li>
                      {activationReadiness.profileReady ? '✓' : '○'} Active operational profile
                    </li>
                    <li>
                      {activationReadiness.crewReady ? '✓' : '○'} Active crew assignment
                    </li>
                  </ul>
                ) : null}
              </div>
              <button
                className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-60"
                disabled={isLoading
                  || (selectedProperty.status !== 'active'
                    && selectedProperty.status !== 'archived'
                    && !activationReadiness.ready)}
                onClick={() => void changePropertyStatus(
                  selectedProperty.status === 'active'
                    ? 'archived'
                    : selectedProperty.status === 'archived' ? 'onboarding' : 'active',
                )}
                type="button"
              >
                {pendingLifecycleStatus
                  ? `Confirm ${pendingLifecycleStatus === 'archived'
                    ? 'archive'
                    : pendingLifecycleStatus === 'onboarding' ? 'reactivation' : 'activation'}`
                  : selectedProperty.status === 'active'
                    ? 'Archive property'
                    : selectedProperty.status === 'archived'
                      ? 'Reactivate property'
                      : 'Activate property'}
              </button>
            </div>
          </div>
          <details className="mt-4 rounded-xl border border-slate-200 px-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-sky-700 [&::-webkit-details-marker]:hidden">
              Edit property name or address
            </summary>
            <div className="grid gap-3 border-t border-slate-100 py-3">
              <label className="text-sm font-semibold text-slate-700">
                Property name
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  maxLength={160}
                  value={identityName}
                  onChange={(event) => setIdentityName(event.target.value)}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Service address
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  maxLength={240}
                  value={identityAddress}
                  onChange={(event) => setIdentityAddress(event.target.value)}
                />
              </label>
              <p className="text-xs text-slate-500">
                The same address may have multiple named service areas. An exact name-and-address duplicate is blocked.
              </p>
              <button
                className="min-h-11 rounded-lg border border-sky-700 px-3 py-2 text-sm font-semibold text-sky-800 disabled:opacity-60"
                disabled={isLoading
                  || (identityName.trim() === selectedProperty.displayName
                    && identityAddress.trim() === selectedProperty.serviceAddress)}
                onClick={() => void savePropertyIdentity()}
                type="button"
              >
                Save property details
              </button>
            </div>
          </details>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-900">Portfolio grouping</p>
            <p className="mt-1 text-xs text-slate-500">
              {currentPortfolio
                ? `Currently grouped in ${currentPortfolio.displayName}.`
                : 'This property is not currently grouped in a portfolio.'}
            </p>
            {!portfolioSetupAvailable ? (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900" role="alert">
                Persisted portfolio grouping could not be loaded. Grouping controls remain blocked until API readiness recovers.
              </p>
            ) : null}
            <select className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={selectedPortfolioId} onChange={(event) => setSelectedPortfolioId(event.target.value)}>
              <option value="">No portfolio selected</option>
              {accountPortfolios.map((portfolio) => <option key={portfolio.id} value={portfolio.id}>{portfolio.displayName}</option>)}
            </select>
            <button className="mt-2 w-full rounded-lg bg-sky-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={selectedProperty.status === 'archived' || !portfolioSetupAvailable || !selectedPortfolioId || isLoading} onClick={() => void groupProperty()} type="button">Group property</button>
            <details className="mt-3 rounded-lg border border-slate-200 px-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-sky-700 [&::-webkit-details-marker]:hidden">Create portfolio</summary>
              <div className="grid gap-2 border-t border-slate-100 py-3">
                <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Portfolio name" value={portfolioName} onChange={(event) => setPortfolioName(event.target.value)} />
                <select className="rounded-lg border border-slate-300 bg-white px-3 py-2" value={portfolioType} onChange={(event) => setPortfolioType(event.target.value as PropertyPortfolioRecord['portfolioType'])}>
                  <option value="individual_owner">Individual owner</option>
                  <option value="property_management_company">Property management company</option>
                  <option value="hoa">HOA</option>
                  <option value="commercial_client">Commercial client</option>
                </select>
                <button className="rounded-lg border border-sky-700 px-3 py-2 text-sm font-semibold text-sky-800 disabled:opacity-60" disabled={selectedProperty.status === 'archived' || !portfolioSetupAvailable || isLoading} onClick={() => void addPortfolio()} type="button">Create portfolio</button>
              </div>
            </details>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-900">Service crew</p>
            {!crewSetupAvailable ? (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900" role="alert">
                Persisted crew assignment context could not be loaded. Assignment controls remain blocked until API readiness recovers.
              </p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">
              {activeAssignment ? `Currently assigned to ${crews.find((crew) => crew.id === activeAssignment.crewId)?.name ?? activeAssignment.crewId}.` : 'No active crew assignment.'}
            </p>
            <select className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={selectedCrewId} onChange={(event) => setSelectedCrewId(event.target.value)}>
              <option value="">No crew selected</option>
              {eligibleCrews.map((crew) => <option key={crew.id} value={crew.id}>{crew.name}</option>)}
            </select>
            <button className="mt-2 w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={selectedProperty.status === 'archived' || !crewSetupAvailable || !selectedCrewId || isLoading} onClick={() => void assignCrew()} type="button">Assign crew</button>
          </div>
        </div>
        </>
      ) : <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Create a customer property before portfolio or crew setup.</p>}
    </section>
  );
}
