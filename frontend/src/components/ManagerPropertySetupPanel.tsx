import { useEffect, useMemo, useState } from 'react';
import {
  addPropertyToPortfolio,
  assignPropertyCrew,
  createPropertyPortfolio,
  fetchCrews,
  fetchPropertyCrewAssignments,
  fetchPropertyPortfolios,
  type CrewRecord,
  type CustomerPropertyRecord,
  type PropertyCrewAssignmentRecord,
  type PropertyPortfolioRecord,
} from '../api/client';

type Props = {
  properties: CustomerPropertyRecord[];
};

export function ManagerPropertySetupPanel({ properties }: Props) {
  const [propertyId, setPropertyId] = useState(properties[0]?.propertyId ?? '');
  const [crews, setCrews] = useState<CrewRecord[]>([]);
  const [portfolios, setPortfolios] = useState<Record<string, PropertyPortfolioRecord[]>>({});
  const [assignments, setAssignments] = useState<Record<string, PropertyCrewAssignmentRecord[]>>({});
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioType, setPortfolioType] = useState<PropertyPortfolioRecord['portfolioType']>('individual_owner');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Choose a property to finish service setup.');
  const selectedProperty = properties.find((property) => property.propertyId === propertyId);
  const accountPortfolios = selectedProperty ? portfolios[selectedProperty.accountId] ?? [] : [];
  const eligibleCrews = useMemo(
    () => crews.filter((crew) => crew.organizationId === selectedProperty?.organizationId),
    [crews, selectedProperty?.organizationId],
  );
  const activeAssignment = (assignments[propertyId] ?? []).find((assignment) => assignment.active);

  useEffect(() => {
    if (!properties.some((property) => property.propertyId === propertyId)) {
      setPropertyId(properties[0]?.propertyId ?? '');
    }
  }, [properties, propertyId]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    Promise.all([
      fetchCrews(),
      Promise.all(
        Array.from(new Set(properties.map((property) => property.accountId))).map(async (accountId) => [
          accountId,
          await fetchPropertyPortfolios(accountId),
        ] as const),
      ),
      Promise.all(properties.map(async (property) => [
        property.propertyId,
        await fetchPropertyCrewAssignments(property.propertyId),
      ] as const)),
    ])
      .then(([loadedCrews, loadedPortfolios, loadedAssignments]) => {
        if (!active) return;
        setCrews(loadedCrews);
        setPortfolios(Object.fromEntries(loadedPortfolios));
        setAssignments(Object.fromEntries(loadedAssignments));
        setMessage('Loaded persisted portfolio and crew setup.');
      })
      .catch(() => {
        if (active) setMessage('Some property setup records could not be loaded.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [properties]);

  useEffect(() => {
    setSelectedPortfolioId(accountPortfolios[0]?.id ?? '');
    setSelectedCrewId(eligibleCrews[0]?.id ?? '');
  }, [propertyId, accountPortfolios[0]?.id, eligibleCrews[0]?.id]);

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

      {selectedProperty ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-900">Portfolio grouping</p>
            <select className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={selectedPortfolioId} onChange={(event) => setSelectedPortfolioId(event.target.value)}>
              <option value="">No portfolio selected</option>
              {accountPortfolios.map((portfolio) => <option key={portfolio.id} value={portfolio.id}>{portfolio.displayName}</option>)}
            </select>
            <button className="mt-2 w-full rounded-lg bg-sky-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={!selectedPortfolioId || isLoading} onClick={() => void groupProperty()} type="button">Group property</button>
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
                <button className="rounded-lg border border-sky-700 px-3 py-2 text-sm font-semibold text-sky-800 disabled:opacity-60" disabled={isLoading} onClick={() => void addPortfolio()} type="button">Create portfolio</button>
              </div>
            </details>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-900">Service crew</p>
            <p className="mt-1 text-xs text-slate-500">
              {activeAssignment ? `Currently assigned to ${crews.find((crew) => crew.id === activeAssignment.crewId)?.name ?? activeAssignment.crewId}.` : 'No active crew assignment.'}
            </p>
            <select className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={selectedCrewId} onChange={(event) => setSelectedCrewId(event.target.value)}>
              <option value="">No crew selected</option>
              {eligibleCrews.map((crew) => <option key={crew.id} value={crew.id}>{crew.name}</option>)}
            </select>
            <button className="mt-2 w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={!selectedCrewId || isLoading} onClick={() => void assignCrew()} type="button">Assign crew</button>
          </div>
        </div>
      ) : <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Create a customer property before portfolio or crew setup.</p>}
    </section>
  );
}
